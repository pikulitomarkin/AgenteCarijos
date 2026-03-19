import axios from 'axios';
import 'dotenv/config';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const SYSTEM_PROMPT = `Você é um classificador de intenções para mensagens de pacientes respondendo a confirmações de consulta.

Classifique a mensagem em uma das seguintes categorias:
- CONFIRMAR: paciente confirma a consulta (ex: "sim", "confirmo", "ok", "vou sim")
- CANCELAR: paciente cancela a consulta (ex: "não posso", "cancelar", "desmarcar")
- REAGENDAR: paciente quer remarcar (ex: "mudar data", "outro dia", "remarcar")
- DESCONHECIDO: não se encaixa nas categorias acima

Responda APENAS com a palavra da categoria seguida de vírgula e um número de confiança entre 0 e 1.
Exemplo: "CONFIRMAR,0.95"`;

/**
 * Classifica a intenção de uma mensagem do paciente usando DeepSeek AI
 */
export async function classifyIntent(patientMessage) {
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: patientMessage }
        ],
        max_tokens: 20,
        temperature: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content.trim();
    const [intent, confidenceStr] = content.split(',');
    
    return {
      intent: intent.trim().toUpperCase(),
      confidence: parseFloat(confidenceStr) || 0
    };
  } catch (error) {
    console.error('Error classifying intent:', error.message);
    return {
      intent: 'DESCONHECIDO',
      confidence: 0
    };
  }
}
