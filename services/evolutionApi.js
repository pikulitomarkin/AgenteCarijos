import axios from 'axios';
import 'dotenv/config';

const api = axios.create({
  baseURL: process.env.EVOLUTION_API_URL,
  headers: {
    'apikey': process.env.EVOLUTION_API_KEY,
    'Content-Type': 'application/json'
  }
});

// Pega as instâncias a partir de EVOLUTION_INSTANCES (separadas por vírgula) 
// ou usa a EVOLUTION_INSTANCE padrão.
const instances = process.env.EVOLUTION_INSTANCES
  ? process.env.EVOLUTION_INSTANCES.split(',').map(i => i.trim())
  : [process.env.EVOLUTION_INSTANCE].filter(Boolean);

if (instances.length === 0) {
  console.warn("Aviso: Nenhuma instância da Evolution API configurada.");
}

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

  let lastError;

  for (const instance of instances) {
    try {
      const response = await api.post(
        `/message/sendText/${instance}`,
        payload
      );
      // Se enviou com sucesso, retorna o resultado
      return response.data;
    } catch (error) {
      console.error(`Erro ao enviar sendButtons via instância ${instance}:`, error.message);
      lastError = error;
      // Falhou nesta instância, continua o loop para tentar a próxima
    }
  }

  // Se todas as instâncias falharem, lança o último erro
  throw lastError;
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

  let lastError;

  for (const instance of instances) {
    try {
      const response = await api.post(
        `/message/sendText/${instance}`,
        payload
      );
      // Se enviou com sucesso, retorna o resultado
      return response.data;
    } catch (error) {
      console.error(`Erro ao enviar sendText via instância ${instance}:`, error.message);
      lastError = error;
      // Falhou nesta instância, continua o loop para tentar a próxima
    }
  }

  // Se todas as instâncias falharem, lança o último erro
  throw lastError;
}
