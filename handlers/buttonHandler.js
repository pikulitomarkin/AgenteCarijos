import { supabase } from '../services/supabase.js';
import { confirmAppointment } from '../actions/confirmAppointment.js';
import { cancelAppointment } from '../actions/cancelAppointment.js';
import { rescheduleFlow } from '../actions/rescheduleFlow.js';

/**
 * Processa clique em botão (CONFIRMAR, CANCELAR, REAGENDAR)
 */
export async function buttonHandler(notification, buttonId) {
  try {
    console.log(`[button] ${notification.patient_name} clicou: ${buttonId}`);

    // Atualizar notificação com resposta do botão
    await supabase
      .from('whatsapp_notifications')
      .update({
        button_clicked: buttonId,
        response_type: 'button',
        ai_intent: buttonId,
        ai_confidence: 1.0,
        responded_at: new Date().toISOString()
      })
      .eq('id', notification.id);

    const appt = notification.appointments;

    // Executar ação correspondente
    switch (buttonId) {
      case 'CONFIRMAR':
        await confirmAppointment(appt, notification);
        break;
      case 'CANCELAR':
        await cancelAppointment(appt, notification);
        break;
      case 'REAGENDAR':
        await rescheduleFlow(appt, notification);
        break;
      default:
        console.log(`[button] Botão desconhecido: ${buttonId}`);
    }
  } catch (error) {
    console.error('[button] Erro:', error);
  }
}
