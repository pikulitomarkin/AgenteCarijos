import { supabase } from '../services/supabase.js';
import { classifyIntent } from '../services/deepseek.js';
import { confirmAppointment } from '../actions/confirmAppointment.js';
import { cancelAppointment } from '../actions/cancelAppointment.js';
import { rescheduleFlow } from '../actions/rescheduleFlow.js';
import { sendText } from '../services/evolutionApi.js';

const MIN_CONFIDENCE = 0.7;

/**
 * Processa mensagem de texto usando IA para classificar intenção
 */
export async function textHandler(notification, text) {
  try {
    console.log(`[text] Classificando: "${text}"`);

    // Classificar intenção com IA
    const { intent, confidence } = await classifyIntent(text);
    console.log(`[text] Resultado: ${intent} (confiança: ${confidence})`);

    // Atualizar notificação com resposta
    await supabase
      .from('whatsapp_notifications')
      .update({
        patient_response: text,
        response_type: 'text',
        ai_intent: intent,
        ai_confidence: confidence,
        responded_at: new Date().toISOString()
      })
      .eq('id', notification.id);

    // Verificar confiança mínima
    if (confidence < MIN_CONFIDENCE || intent === 'DESCONHECIDO') {
      console.log(`[text] Confiança baixa ou desconhecido, pedindo uso dos botões`);
      await sendText(
        notification.patient_phone,
        'Não foi possível identificar sua resposta. Por favor, utilize os botões da mensagem anterior para confirmar, cancelar ou reagendar sua consulta.'
      );
      return;
    }

    const appt = notification.appointments;

    // Executar ação baseada na intenção
    switch (intent) {
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
        console.log(`[text] Intenção não mapeada: ${intent}`);
        await sendText(
          notification.patient_phone,
          'Não foi possível identificar sua resposta. Por favor, utilize os botões da mensagem anterior para confirmar, cancelar ou reagendar sua consulta.'
        );
    }
  } catch (error) {
    console.error('[text] Erro:', error);
  }
}
