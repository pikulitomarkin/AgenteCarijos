import { supabase } from '../services/supabase.js';
import { sendText } from '../services/evolutionApi.js';
import { buttonHandler } from './buttonHandler.js';
import { textHandler } from './textHandler.js';

/**
 * Handler principal do webhook da Evolution API
 * Processa mensagens recebidas e botões clicados
 */
export async function webhookHandler(req, res) {
  // Responder IMEDIATAMENTE antes de processar
  res.status(200).json({ received: true });

  try {
    const payload = req.body;
    
    // Verificar se é evento de mensagem
    if (payload.event !== 'messages.upsert') {
      console.log('[webhook] Evento ignorado:', payload.event);
      return;
    }

    // Ignorar mensagens enviadas por nós
    if (payload.data?.key?.fromMe === true) {
      console.log('[webhook] Mensagem própria ignorada');
      return;
    }

    // Extrair telefone (remover @s.whatsapp.net e @c.us)
    const remoteJid = payload.data?.key?.remoteJid || '';
    const phone = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '');
    
    if (!phone) {
      console.log('[webhook] Telefone não encontrado no payload');
      return;
    }

    console.log(`[webhook] Mensagem recebida de ${phone}`);

    // Buscar última notificação deste telefone
    const { data: notifications, error } = await supabase
      .from('whatsapp_notifications')
      .select(`
        *,
        appointments (*)
      `)
      .eq('patient_phone', phone)
      .in('status', ['enviado', 'aguardando_reagendamento'])
      .order('sent_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[webhook] Erro ao buscar notificação:', error);
      return;
    }

    if (!notifications || notifications.length === 0) {
      console.log('[webhook] Nenhuma notificação pendente encontrada para', phone);
      return;
    }

    const notification = notifications[0];
    console.log(`[webhook] Notificação encontrada: ${notification.id} (${notification.status})`);

    // FLUXO DE REAGENDAMENTO - escolha de opção
    if (notification.status === 'aguardando_reagendamento') {
      const message = payload.data?.message;
      const text = message?.conversation || message?.extendedTextMessage?.text || '';
      const choice = parseInt(text.trim());

      if ([1, 2, 3].includes(choice)) {
        console.log(`[webhook] Opção de reagendamento escolhida: ${choice}`);

        try {
          // Carregar opções salvas
          const options = JSON.parse(notification.patient_response || '[]');
          const chosen = options[choice - 1];

          if (!chosen) {
            await sendText(phone, '❌ Opção inválida. Por favor, escolha 1, 2 ou 3.');
            return;
          }

          const originalAppt = notification.appointments;

          // Criar novo agendamento
          const { data: newAppt, error: insertError } = await supabase
            .from('appointments')
            .insert({
              patient_name: originalAppt.patient_name,
              patient_phone: originalAppt.patient_phone,
              patient_email: originalAppt.patient_email,
              patient_cpf: originalAppt.patient_cpf,
              doctor_id: chosen.doctor_id,
              doctor_name: chosen.doctor_name,
              specialty: originalAppt.specialty,
              insurance_id: originalAppt.insurance_id,
              insurance_name: originalAppt.insurance_name,
              date: chosen.date,
              time: chosen.time + ':00',
              status: 'agendado',
              appointment_type: originalAppt.appointment_type,
              created_by: 'paciente',
              created_by_name: 'WhatsApp IA'
            })
            .select()
            .single();

          if (insertError) throw insertError;

          // Cancelar agendamento original
          await supabase
            .from('appointments')
            .update({ status: 'cancelado', updated_at: new Date().toISOString() })
            .eq('id', originalAppt.id);

          // Atualizar notificação
          await supabase
            .from('whatsapp_notifications')
            .update({ status: 'reagendado' })
            .eq('id', notification.id);

          // Formatar data
          const [year, month, day] = chosen.date.split('-');
          const formattedDate = `${day}/${month}/${year}`;
          const [hour, minute] = chosen.time.split(':');

          // Confirmar reagendamento
          await sendText(
            phone,
            `✅ Reagendamento confirmado!\n\n🩺 Médico: ${chosen.doctor_name}\n📅 Data: ${formattedDate}\n🕐 Horário: ${hour}:${minute}\n📍 Rua dos Carijós, 141 - 6º Andar, Centro - BH\n\nAguardamos você!`
          );

          console.log(`[webhook] Reagendamento concluído: ${newAppt.id}`);
        } catch (error) {
          console.error('[webhook] Erro ao reagendar:', error);
          await sendText(phone, '❌ Erro ao processar reagendamento. Por favor, entre em contato com a clínica.');
        }
        return;
      } else {
        await sendText(phone, '❌ Opção inválida. Por favor, escolha 1, 2 ou 3.');
        return;
      }
    }

    // FLUXO NORMAL - botão ou texto
    const message = payload.data?.message;

    // Verificar se é resposta de botão
    if (message?.buttonsResponseMessage?.selectedButtonId) {
      const buttonId = message.buttonsResponseMessage.selectedButtonId;
      console.log(`[webhook] Botão clicado: ${buttonId}`);
      await buttonHandler(notification, buttonId);
      return;
    }

    // Verificar se é texto
    const text = message?.conversation || message?.extendedTextMessage?.text;
    if (text) {
      console.log(`[webhook] Texto recebido: "${text}"`);
      await textHandler(notification, text);
      return;
    }

    console.log('[webhook] Tipo de mensagem não suportado');
  } catch (error) {
    console.error('[webhook] Erro geral:', error);
  }
}
