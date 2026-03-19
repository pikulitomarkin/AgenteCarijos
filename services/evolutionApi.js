import axios from 'axios';
import 'dotenv/config';

const api = axios.create({
  baseURL: process.env.EVOLUTION_API_URL,
  headers: {
    'apikey': process.env.EVOLUTION_API_KEY,
    'Content-Type': 'application/json'
  }
});

/**
 * Remove caracteres não numéricos do telefone
 */
function cleanPhone(phone) {
  return phone.replace(/\D/g, '');
}

/**
 * Envia mensagem com botões interativos
 */
export async function sendButtons(phone, title, description, footer = '') {
  const cleanedPhone = cleanPhone(phone);
  
  const payload = {
    number: cleanedPhone,
    title,
    description,
    footer,
    buttons: [
      {
        buttonId: 'CONFIRMAR',
        buttonText: { displayText: '✅ Confirmar' }
      },
      {
        buttonId: 'CANCELAR',
        buttonText: { displayText: '❌ Cancelar' }
      },
      {
        buttonId: 'REAGENDAR',
        buttonText: { displayText: '📅 Reagendar' }
      }
    ]
  };

  const response = await api.post(
    `/${process.env.EVOLUTION_INSTANCE}/message/sendButtons`,
    payload
  );

  return response.data;
}

/**
 * Envia mensagem de texto simples
 */
export async function sendText(phone, message) {
  const cleanedPhone = cleanPhone(phone);
  
  const payload = {
    number: cleanedPhone,
    text: message
  };

  const response = await api.post(
    `/${process.env.EVOLUTION_INSTANCE}/message/sendText`,
    payload
  );

  return response.data;
}
