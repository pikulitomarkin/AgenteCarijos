import { supabase } from '../services/supabase.js';
import { sendText } from '../services/evolutionApi.js';

/**
 * Formata data para dd/MM/yyyy
 */
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Confirma o agendamento e notifica o paciente
 */
export async function confirmAppointment(appointment, notification) {
  try {
    console.log(`[confirm] Confirmando appointment ${appointment.id}`);

    // Atualizar status do agendamento para confirmado
    const { error } = await supabase
      .from('appointments')
      .update({ 
        status: 'confirmado',
        confirmed_by_name: 'WhatsApp IA',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', appointment.id);

    if (error) throw error;

    // Atualizar status da notificação
    await supabase
      .from('whatsapp_notifications')
      .update({ status: 'confirmado' })
      .eq('id', notification.id);

    // Formatar data e hora
    const formattedDate = formatDate(appointment.date);
    const [hour, minute] = appointment.time.substring(0, 5).split(':');

    // Enviar confirmação ao paciente
    await sendText(
      notification.patient_phone,
      `✅ Sua consulta foi confirmada com sucesso!\n\n🩺 ${appointment.doctor_name}\n📅 ${formattedDate} às ${hour}:${minute}\n\nAguardamos sua presença na Clínica Carijós.\n📍 Rua dos Carijós, 141 - 6º Andar, Centro - BH`
    );

    console.log(`[confirm] ${appointment.patient_name} confirmou`);
  } catch (error) {
    console.error('[confirm] Erro:', error);
    await sendText(
      notification.patient_phone,
      'Desculpe, ocorreu um erro ao confirmar sua consulta. Por favor, entre em contato com a clínica.'
    );
  }
}

