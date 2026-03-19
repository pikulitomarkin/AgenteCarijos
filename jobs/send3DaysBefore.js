import cron from 'node-cron';
import { supabase } from '../services/supabase.js';
import { sendButtons } from '../services/evolutionApi.js';

/**
 * Normaliza telefone: remove não numéricos, adiciona 55 se necessário
 */
function normalizePhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && !cleaned.startsWith('55')) {
    return '55' + cleaned;
  }
  return cleaned;
}

/**
 * Formata data para dd/MM/yyyy
 */
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR');
}

/**
 * Job que roda diariamente às 08:00 (America/Sao_Paulo) para enviar notificações 3 dias antes
 */
export function initSend3DaysBeforeJob() {
  // Executa todo dia às 08:00 (timezone America/Sao_Paulo)
  cron.schedule('0 8 * * *', async () => {
    console.log('[3dias] Iniciando job...');
    
    let enviados = 0;
    let erros = 0;
    let pulados = 0;
    
    try {
      // Calcular data alvo (hoje + 3 dias)
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 3);
      const dateStr = targetDate.toISOString().split('T')[0];

      console.log(`[3dias] Buscando agendamentos para ${dateStr}`);

      // Buscar agendamentos para daqui a 3 dias
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('id, patient_name, patient_phone, doctor_name, date, time, status')
        .eq('date', dateStr)
        .eq('status', 'agendado')
        .is('deleted_at', null);

      if (error) throw error;

      console.log(`[3dias] Encontrados ${appointments?.length || 0} agendamentos`);

      for (const apt of appointments || []) {
        try {
          // Verificar se tem telefone
          if (!apt.patient_phone) {
            pulados++;
            continue;
          }

          // Verificar duplicata
          const { data: existing } = await supabase
            .from('whatsapp_notifications')
            .select('id')
            .eq('appointment_id', apt.id)
            .eq('notification_type', '3dias')
            .single();

          if (existing) {
            console.log(`[3dias] PULAR: já enviado para ${apt.patient_name}`);
            pulados++;
            continue;
          }

          // Normalizar telefone
          const normalizedPhone = normalizePhone(apt.patient_phone);
          if (!normalizedPhone) {
            pulados++;
            continue;
          }

          // Formatar data e hora
          const formattedDate = formatDate(apt.date);
          const [hour, minute] = apt.time.substring(0, 5).split(':');

          // Enviar mensagem com botões
          await sendButtons(
            normalizedPhone,
            'Confirmação de Consulta',
            `Prezado(a) ${apt.patient_name},\n\nVocê possui uma consulta em 3 dias:\n\n🩺 Médico: ${apt.doctor_name}\n📅 Data: ${formattedDate}\n🕐 Horário: ${hour}:${minute}\n📍 Rua dos Carijós, 141 - 6º Andar, Centro - BH\n\nPor favor, confirme sua presença:`,
            'Clínica Carijós — Especialidades Médicas'
          );

          // Registrar notificação
          await supabase.from('whatsapp_notifications').insert({
            appointment_id: apt.id,
            patient_phone: normalizedPhone,
            patient_name: apt.patient_name,
            doctor_name: apt.doctor_name,
            appointment_date: apt.date,
            appointment_time: apt.time,
            notification_type: '3dias',
            status: 'enviado'
          });

          console.log(`[3dias] Enviado para ${apt.patient_name}`);
          enviados++;
        } catch (error) {
          console.error(`[3dias] Erro ao processar ${apt.patient_name}:`, error.message);
          erros++;
        }
      }
    } catch (error) {
      console.error('[3dias] Erro geral:', error);
    }

    console.log(`[3dias] Concluído: ${enviados} enviados, ${erros} erros, ${pulados} pulados`);
  }, {
    timezone: 'America/Sao_Paulo'
  });

  console.log('[3dias] Cron job registrado (diariamente às 08:00 - America/Sao_Paulo)');
}
