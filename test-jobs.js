import 'dotenv/config';
import { supabase } from './services/supabase.js';
import { sendButtons } from './services/evolutionApi.js';

/**
 * Script para testar os jobs manualmente
 * Uso: node test-jobs.js [3dias|24h|imediato] [appointment_id]
 */

const jobType = process.argv[2];
const appointmentId = process.argv[3];

/**
 * Normaliza telefone
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
 * Formata data
 */
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR');
}

/**
 * Testa job 3 dias antes
 */
async function test3Days() {
  console.log('\n🧪 Testando job 3 dias antes...\n');
  
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 3);
  const dateStr = targetDate.toISOString().split('T')[0];

  console.log(`📅 Data alvo: ${dateStr}\n`);

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('id, patient_name, patient_phone, doctor_name, date, time, status')
    .eq('date', dateStr)
    .eq('status', 'agendado')
    .is('deleted_at', null);

  if (error) throw error;

  console.log(`✅ Encontrados ${appointments?.length || 0} agendamentos\n`);

  for (const apt of appointments || []) {
    console.log(`👤 ${apt.patient_name} - ${apt.patient_phone}`);
    
    if (!apt.patient_phone) {
      console.log('   ⚠️  Sem telefone - PULADO\n');
      continue;
    }

    // Verificar duplicata
    const { data: existing } = await supabase
      .from('whatsapp_notifications')
      .select('id')
      .eq('appointment_id', apt.id)
      .eq('notification_type', '3dias')
      .single();

    if (existing) {
      console.log('   ⚠️  Já enviado - PULADO\n');
      continue;
    }

    const normalizedPhone = normalizePhone(apt.patient_phone);
    const formattedDate = formatDate(apt.date);
    const [hour, minute] = apt.time.substring(0, 5).split(':');

    console.log(`   📱 Telefone normalizado: ${normalizedPhone}`);
    console.log(`   📅 ${formattedDate} às ${hour}:${minute}`);
    console.log('   📤 Enviando...');

    await sendButtons(
      normalizedPhone,
      'Confirmação de Consulta',
      `Prezado(a) ${apt.patient_name},\n\nVocê possui uma consulta em 3 dias:\n\n🩺 Médico: ${apt.doctor_name}\n📅 Data: ${formattedDate}\n🕐 Horário: ${hour}:${minute}\n📍 Rua dos Carijós, 141 - 6º Andar, Centro - BH\n\nPor favor, confirme sua presença:`,
      'Clínica Carijós — Especialidades Médicas'
    );

    await supabase.from('whatsapp_notifications').insert({
      appointment_id: apt.id,
      patient_phone: normalizedPhone,
      patient_name: apt.patient_name,
      doctor_name: apt.doctor_name,
      appointment_date: apt.date,
      appointment_time: apt.time,
      notification_type: '3dias',
      status: 'enviado'
    });

    console.log('   ✅ Enviado!\n');
  }
}

/**
 * Testa job 24h antes
 */
async function test24h() {
  console.log('\n🧪 Testando job 24h antes...\n');
  
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 1);
  const dateStr = targetDate.toISOString().split('T')[0];

  console.log(`📅 Data alvo: ${dateStr}\n`);

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('id, patient_name, patient_phone, doctor_name, date, time, status')
    .eq('date', dateStr)
    .in('status', ['agendado', 'confirmado'])
    .is('deleted_at', null);

  if (error) throw error;

  console.log(`✅ Encontrados ${appointments?.length || 0} agendamentos\n`);

  for (const apt of appointments || []) {
    console.log(`👤 ${apt.patient_name} - ${apt.patient_phone} (${apt.status})`);
    
    if (!apt.patient_phone) {
      console.log('   ⚠️  Sem telefone - PULADO\n');
      continue;
    }

    // Verificar duplicata
    const { data: existing } = await supabase
      .from('whatsapp_notifications')
      .select('id')
      .eq('appointment_id', apt.id)
      .eq('notification_type', '24h')
      .single();

    if (existing) {
      console.log('   ⚠️  Já enviado - PULADO\n');
      continue;
    }

    const normalizedPhone = normalizePhone(apt.patient_phone);
    const formattedDate = formatDate(apt.date);
    const [hour, minute] = apt.time.substring(0, 5).split(':');

    console.log(`   📱 Telefone normalizado: ${normalizedPhone}`);
    console.log(`   📅 ${formattedDate} às ${hour}:${minute}`);
    console.log('   📤 Enviando...');

    await sendButtons(
      normalizedPhone,
      'Confirmação de Consulta',
      `Prezado(a) ${apt.patient_name},\n\nVocê possui uma consulta em 3 dias:\n\n🩺 Médico: ${apt.doctor_name}\n📅 Data: ${formattedDate}\n🕐 Horário: ${hour}:${minute}\n📍 Rua dos Carijós, 141 - 6º Andar, Centro - BH\n\nPor favor, confirme sua presença:`,
      'Clínica Carijós — Especialidades Médicas'
    );

    await supabase.from('whatsapp_notifications').insert({
      appointment_id: apt.id,
      patient_phone: normalizedPhone,
      patient_name: apt.patient_name,
      doctor_name: apt.doctor_name,
      appointment_date: apt.date,
      appointment_time: apt.time,
      notification_type: '24h',
      status: 'enviado'
    });

    console.log('   ✅ Enviado!\n');
  }
}

/**
 * Testa notificação imediata
 */
async function testImmediate(aptId) {
  console.log('\n🧪 Testando notificação imediata...\n');
  
  if (!aptId) {
    console.log('❌ Uso: node test-jobs.js imediato <appointment_id>\n');
    process.exit(1);
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .select('id, patient_name, patient_phone, doctor_name, date, time, status')
    .eq('id', aptId)
    .single();

  if (error) throw error;
  if (!appointment) {
    console.log('❌ Agendamento não encontrado\n');
    process.exit(1);
  }

  console.log(`👤 ${appointment.patient_name} - ${appointment.patient_phone}`);
  console.log(`📅 ${appointment.date} às ${appointment.time}`);
  console.log(`📊 Status: ${appointment.status}\n`);

  if (!appointment.patient_phone) {
    console.log('❌ Sem telefone\n');
    process.exit(1);
  }

  if (appointment.status === 'cancelado') {
    console.log('❌ Agendamento cancelado\n');
    process.exit(1);
  }

  // Verificar duplicata
  const { data: existing } = await supabase
    .from('whatsapp_notifications')
    .select('id')
    .eq('appointment_id', appointment.id)
    .eq('notification_type', 'imediato')
    .single();

  if (existing) {
    console.log('⚠️  Já enviado anteriormente\n');
    process.exit(0);
  }

  const normalizedPhone = normalizePhone(appointment.patient_phone);
  const formattedDate = formatDate(appointment.date);
  const [hour, minute] = appointment.time.substring(0, 5).split(':');

  console.log(`📱 Telefone normalizado: ${normalizedPhone}`);
  console.log('📤 Enviando...\n');

  await sendButtons(
    normalizedPhone,
    'Agendamento Confirmado',
    `Prezado(a) ${appointment.patient_name},\n\nSeu agendamento foi realizado:\n\n🩺 Médico: ${appointment.doctor_name}\n📅 Data: ${formattedDate}\n🕐 Horário: ${hour}:${minute}\n📍 Rua dos Carijós, 141 - 6º Andar, Centro - BH\n\nConfirme sua presença:`,
    'Clínica Carijós — Especialidades Médicas'
  );

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

  console.log('✅ Enviado!\n');
}

// Executar teste
try {
  switch (jobType) {
    case '3dias':
      await test3Days();
      break;
    case '24h':
      await test24h();
      break;
    case 'imediato':
      await testImmediate(appointmentId);
      break;
    default:
      console.log('\n❌ Uso: node test-jobs.js [3dias|24h|imediato] [appointment_id]\n');
      console.log('Exemplos:');
      console.log('  node test-jobs.js 3dias');
      console.log('  node test-jobs.js 24h');
      console.log('  node test-jobs.js imediato abc-123-def\n');
      process.exit(1);
  }
  
  console.log('✅ Teste concluído!\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Erro:', error.message, '\n');
  process.exit(1);
}
