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
 * Envia notificação imediata para um agendamento específico
 * Chamado via POST /notify/immediate
 */
export async function sendImmediateNotification(appointmentId) {
  try {
    console.log(`[imediato] Processando appointment ${appointmentId}`);

    // Buscar dados do agendamento
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('id, patient_name, patient_phone, doctor_name, date, time, status')
      .eq('id', appointmentId)
      .single();

    if (error) throw error;
    if (!appointment) {
      console.log('[imediato] Agendamento não encontrado');
      return { success: false, error: 'Appointment not found' };
    }

    // Verificar se tem telefone
    if (!appointment.patient_phone) {
      console.log('[imediato] Telefone não informado');
      return { success: false, error: 'Patient phone not found' };
    }

    // Não enviar se cancelado
    if (appointment.status === 'cancelado') {
      console.log('[imediato] Agendamento cancelado, não enviando');
      return { success: false, error: 'Appointment is cancelled' };
    }

    // Verificar duplicata
    const { data: existing } = await supabase
      .from('whatsapp_notifications')
      .select('id')
      .eq('appointment_id', appointment.id)
      .eq('notification_type', 'imediato')
      .single();

    if (existing) {
      console.log('[imediato] Notificação já enviada anteriormente');
      return { success: false, error: 'Notification already sent' };
    }

    // Normalizar telefone
    const normalizedPhone = normalizePhone(appointment.patient_phone);
    if (!normalizedPhone) {
      console.log('[imediato] Telefone inválido');
      return { success: false, error: 'Invalid phone number' };
    }

    // Formatar data e hora
    const formattedDate = formatDate(appointment.date);
    const [hour, minute] = appointment.time.substring(0, 5).split(':');

    // Enviar mensagem com botões
    await sendButtons(
      normalizedPhone,
      'Agendamento Confirmado',
      `Prezado(a) ${appointment.patient_name},\n\nSeu agendamento foi realizado:\n\n🩺 Médico: ${appointment.doctor_name}\n📅 Data: ${formattedDate}\n🕐 Horário: ${hour}:${minute}\n📍 Rua dos Carijós, 141 - 6º Andar, Centro - BH\n\nConfirme sua presença:`,
      'Clínica Carijós — Especialidades Médicas'
    );

    // Registrar notificação
    await supabase.from('whatsapp_notifications').insert({
      appointment_id: appointment.id,
      patient_phone: normalizedPhone,
      patient_name: appointment.patient_name,
      doctor_name: appointment.doctor_name,
      appointment_date: appointment.date,
      appointment_time: appointment.time,
      notification_type: 'imediato',
      status: 'enviado'
    });

    console.log(`[imediato] Enviado para ${appointment.patient_name}`);
    return { success: true };
  } catch (error) {
    console.error('[imediato] Erro:', error);
    throw error;
  }
}
