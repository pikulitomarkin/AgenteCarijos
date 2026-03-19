import { supabase } from '../services/supabase.js';
import { sendText } from '../services/evolutionApi.js';

/**
 * Cancela o agendamento e notifica o paciente
 */
export async function cancelAppointment(appointment, notification) {
  try {
    console.log(`[cancel] Cancelando appointment ${appointment.id}`);

    // Atualizar status do agendamento para cancelado
    // Horário fica automaticamente liberado para novos agendamentos
    const { error } = await supabase
      .from('appointments')
      .update({ 
        status: 'cancelado',
        updated_at: new Date().toISOString()
      })
      .eq('id', appointment.id);

    if (error) throw error;

    // Atualizar status da notificação
    await supabase
      .from('whatsapp_notifications')
      .update({ status: 'cancelado' })
      .eq('id', notification.id);

    // Enviar confirmação ao paciente
    await sendText(
      notification.patient_phone,
      `❌ Sua consulta foi cancelada.\n\nQuando desejar remarcar, entre em contato:\n📞 (31) 3222-1000\n🌐 grupocarijos.com.br\n\nAgradecemos a comunicação. Clínica Carijós.`
    );

    console.log(`[cancel] ${appointment.patient_name} cancelou`);
  } catch (error) {
    console.error('[cancel] Erro:', error);
    await sendText(
      notification.patient_phone,
      'Desculpe, ocorreu um erro ao cancelar sua consulta. Por favor, entre em contato com a clínica.'
    );
  }
}
