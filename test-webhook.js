import axios from 'axios';

/**
 * Script para testar o webhook localmente
 * Uso: node test-webhook.js [button|text|reagendar] [phone] [value]
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const testType = process.argv[2];
const phone = process.argv[3];
const value = process.argv[4];

/**
 * Testa clique em botão
 */
async function testButton(phone, buttonId) {
  console.log(`\n🧪 Testando botão ${buttonId} para ${phone}\n`);

  const payload = {
    event: 'messages.upsert',
    data: {
      key: {
        remoteJid: `${phone}@s.whatsapp.net`,
        fromMe: false
      },
      message: {
        buttonsResponseMessage: {
          selectedButtonId: buttonId,
          selectedDisplayText: buttonId === 'CONFIRMAR' ? '✅ Confirmar' : 
                               buttonId === 'CANCELAR' ? '❌ Cancelar' : 
                               '📅 Reagendar'
        }
      }
    }
  };

  try {
    const response = await axios.post(`${BASE_URL}/webhook/evolution`, payload);
    console.log('✅ Resposta:', response.data);
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

/**
 * Testa mensagem de texto
 */
async function testText(phone, text) {
  console.log(`\n🧪 Testando texto "${text}" para ${phone}\n`);

  const payload = {
    event: 'messages.upsert',
    data: {
      key: {
        remoteJid: `${phone}@s.whatsapp.net`,
        fromMe: false
      },
      message: {
        conversation: text
      }
    }
  };

  try {
    const response = await axios.post(`${BASE_URL}/webhook/evolution`, payload);
    console.log('✅ Resposta:', response.data);
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

/**
 * Testa escolha de reagendamento
 */
async function testRescheduleChoice(phone, choice) {
  console.log(`\n🧪 Testando escolha de reagendamento ${choice} para ${phone}\n`);

  const payload = {
    event: 'messages.upsert',
    data: {
      key: {
        remoteJid: `${phone}@s.whatsapp.net`,
        fromMe: false
      },
      message: {
        conversation: choice
      }
    }
  };

  try {
    const response = await axios.post(`${BASE_URL}/webhook/evolution`, payload);
    console.log('✅ Resposta:', response.data);
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

/**
 * Testa mensagem própria (deve ser ignorada)
 */
async function testFromMe(phone) {
  console.log(`\n🧪 Testando mensagem própria (deve ser ignorada)\n`);

  const payload = {
    event: 'messages.upsert',
    data: {
      key: {
        remoteJid: `${phone}@s.whatsapp.net`,
        fromMe: true  // Mensagem enviada por nós
      },
      message: {
        conversation: 'teste'
      }
    }
  };

  try {
    const response = await axios.post(`${BASE_URL}/webhook/evolution`, payload);
    console.log('✅ Resposta:', response.data);
    console.log('✅ Mensagem própria foi ignorada corretamente');
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

// Executar teste
try {
  if (!phone) {
    console.log('\n❌ Uso: node test-webhook.js [button|text|reagendar|fromme] <phone> [value]\n');
    console.log('Exemplos:');
    console.log('  node test-webhook.js button 5531999999999 CONFIRMAR');
    console.log('  node test-webhook.js button 5531999999999 CANCELAR');
    console.log('  node test-webhook.js button 5531999999999 REAGENDAR');
    console.log('  node test-webhook.js text 5531999999999 "sim, confirmo"');
    console.log('  node test-webhook.js text 5531999999999 "não posso ir"');
    console.log('  node test-webhook.js reagendar 5531999999999 1');
    console.log('  node test-webhook.js fromme 5531999999999\n');
    console.log('Variável de ambiente:');
    console.log('  TEST_URL=http://localhost:3000 (padrão)\n');
    process.exit(1);
  }

  switch (testType) {
    case 'button':
      if (!value) {
        console.log('❌ Especifique o botão: CONFIRMAR, CANCELAR ou REAGENDAR\n');
        process.exit(1);
      }
      await testButton(phone, value);
      break;
    
    case 'text':
      if (!value) {
        console.log('❌ Especifique o texto da mensagem\n');
        process.exit(1);
      }
      await testText(phone, value);
      break;
    
    case 'reagendar':
      if (!value) {
        console.log('❌ Especifique a opção: 1, 2 ou 3\n');
        process.exit(1);
      }
      await testRescheduleChoice(phone, value);
      break;
    
    case 'fromme':
      await testFromMe(phone);
      break;
    
    default:
      console.log('\n❌ Tipo inválido. Use: button, text, reagendar ou fromme\n');
      process.exit(1);
  }

  console.log('\n✅ Teste concluído!\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Erro:', error.message, '\n');
  process.exit(1);
}
