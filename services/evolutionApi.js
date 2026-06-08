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
 * Envia mensagem formatada como texto (compatível com Evolution API v2)
 * A v2 removeu o suporte ao endpoint /message/sendButtons (retornava 400).
 * As opções de resposta são incluídas no corpo do texto.
 */
export async function sendButtons(phone, title, description, footer = '') {
  const cleanedPhone = cleanPhone(phone);

  const text = [
    `*${title}*`,
    '',
    description,
    '',
    'Responda com uma das opções abaixo:',
    '1️⃣  *1* - ✅ Confirmar',
    '2️⃣  *2* - ❌ Cancelar',
    '3️⃣  *3* - 📅 Reagendar',
    ...(footer ? ['', `_${footer}_`] : [])
  ].join('\n');

  const payload = {
    number: cleanedPhone,
    text
  };

  const response = await api.post(
    `/message/sendText/${process.env.EVOLUTION_INSTANCE}`,
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
    `/message/sendText/${process.env.EVOLUTION_INSTANCE}`,
    payload
  );

  return response.data;
}
