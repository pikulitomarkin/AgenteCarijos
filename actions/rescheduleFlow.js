import { supabase } from '../services/supabase.js';
import { sendText } from '../services/evolutionApi.js';

/**
 * Formata data para dd/MM/yyyy (dia da semana)
 */
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const [year, month, day] = dateStr.split('-');
  const weekdays = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const weekday = weekdays[date.getDay()];
  return `${day}/${month}/${year} (${weekday})`;
}

/**
 * Gera todos os horários de um slot
 */
function generateTimeSlots(startTime, endTime, intervalMinutes) {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let currentMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  while (currentMinutes < endMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;
    slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    currentMinutes += intervalMinutes;
  }
  
  return slots;
}

/**
 * Inicia fluxo de reagendamento
 * Busca horários disponíveis e oferece 3 opções ao paciente
 */
export async function rescheduleFlow(appointment, notification) {
  try {
    console.log(`[reschedule] Iniciando fluxo para appointment ${appointment.id}`);

    // 1. Buscar especialidade do médico
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('specialty, specialties')
      .eq('id', appointment.doctor_id)
      .single();

    if (doctorError) throw doctorError;

    const specialty = (doctor.specialties && doctor.specialties.length > 0) 
      ? doctor.specialties[0] 
      : doctor.specialty;

    console.log(`[reschedule] Especialidade: ${specialty}`);

    // 2. Buscar médicos com essa especialidade
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('id, name')
      .or(`specialty.eq.${specialty},specialties.cs.{${specialty}}`)
      .eq('active', true)
      .is('deleted_at', null);

    if (doctorsError) throw doctorsError;

    const doctorIds = doctors.map(d => d.id);
    console.log(`[reschedule] Encontrados ${doctorIds.length} médicos`);

    // 3. Buscar próximos schedule_slots
    const today = new Date().toISOString().split('T')[0];
    
    const { data: slots, error: slotsError } = await supabase
      .from('schedule_slots')
      .select(`
        *,
        appointments (
          time,
          status,
          deleted_at
        )
      `)
      .in('doctor_id', doctorIds)
      .gt('date', today)
      .order('date', { ascending: true })
      .limit(20);

    if (slotsError) throw slotsError;

    console.log(`[reschedule] Encontrados ${slots?.length || 0} slots`);

    // 4. Gerar horários e verificar disponibilidade
    const availableSlots = [];
    
    for (const slot of slots || []) {
      if (availableSlots.length >= 3) break;

      // Gerar todos os horários do slot
      const timeSlots = generateTimeSlots(
        slot.start_time.substring(0, 5),
        slot.end_time.substring(0, 5),
        slot.interval_minutes
      );

      // Verificar quais horários estão ocupados
      const occupiedTimes = new Set();
      if (slot.appointments) {
        for (const appt of slot.appointments) {
          if (appt.status !== 'cancelado' && !appt.deleted_at) {
            occupiedTimes.add(appt.time.substring(0, 5));
          }
        }
      }

      // Coletar horários livres
      for (const time of timeSlots) {
        if (availableSlots.length >= 3) break;
        
        if (!occupiedTimes.has(time)) {
          const doctorInfo = doctors.find(d => d.id === slot.doctor_id);
          availableSlots.push({
            doctor_id: slot.doctor_id,
            doctor_name: doctorInfo?.name || 'Médico',
            date: slot.date,
            time: time
          });
        }
      }
    }

    // 5. Se nenhum horário disponível
    if (availableSlots.length === 0) {
      console.log('[reschedule] Nenhum horário disponível');
      await sendText(
        notification.patient_phone,
        'Não encontramos horários disponíveis no momento. Entre em contato pelo (31) 3222-1000 para reagendamento.'
      );
      return;
    }

    // 6. Salvar opções na notificação
    await supabase
      .from('whatsapp_notifications')
      .update({
        status: 'aguardando_reagendamento',
        patient_response: JSON.stringify(availableSlots)
      })
      .eq('id', notification.id);

    // 7. Montar e enviar mensagem com as opções
    let message = `📅 Horários disponíveis para ${specialty}:\n\n`;
    
    availableSlots.forEach((slot, index) => {
      const formattedDate = formatDate(slot.date);
      const [hour, minute] = slot.time.split(':');
      message += `${index + 1}. ${slot.doctor_name} — ${formattedDate} às ${hour}:${minute}\n`;
    });

    message += '\nResponda com o número da opção desejada (1, 2 ou 3).';

    await sendText(notification.patient_phone, message);

    console.log(`[reschedule] Opções enviadas para ${appointment.patient_name}`);
  } catch (error) {
    console.error('[reschedule] Erro:', error);
    await sendText(
      notification.patient_phone,
      'Desculpe, ocorreu um erro ao buscar horários disponíveis. Por favor, entre em contato com a clínica para reagendar.'
    );
  }
}
