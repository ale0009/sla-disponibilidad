// SLA → presupuesto de error. Funciones puras (sin DOM).
// Convención: un año = 365 días, un mes = 1/12 de año (30,42 días), una semana = 7 días.
// Así 99,9 % 24×7 da 8 h 45 min 36 s al año, la cifra que se cita siempre.

export const HORA = 3600;
export const DIA = 24 * HORA;
export const ANIO_DIAS = 365;
export const SEMANAS_ANIO = ANIO_DIAS / 7; // 52,14

/** Horarios de servicio: horas por día de servicio y días de servicio por semana. */
export const HORARIOS = {
  '24x7': { nombre: '24×7', horasDia: 24, diasSemana: 7, texto: 'todo el día, todos los días' },
  '5x8': { nombre: '5×8', horasDia: 8, diasSemana: 5, texto: 'lunes a viernes, 8 horas al día' },
};

export const PERIODOS = ['dia', 'semana', 'mes', 'anio'];
export const NOMBRE_PERIODO = { dia: 'Día', semana: 'Semana', mes: 'Mes', anio: 'Año' };

/**
 * Lee un porcentaje escrito por una persona: «99,9», «99.95 %», «99,99%».
 * Devuelve un número en (0, 100] o null si no es válido.
 */
export function leerPorcentaje(texto) {
  if (typeof texto === 'number') return Number.isFinite(texto) && texto > 0 && texto <= 100 ? texto : null;
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim().replace(/\s*%$/, '').replace(',', '.');
  if (!/^\d{1,3}(\.\d+)?$/.test(limpio)) return null;
  const n = Number(limpio);
  return n > 0 && n <= 100 ? n : null;
}

/** «Cuántos nueves»: −log10(1 − A). 99,9 % → 3; 99,95 % → 3,3. Con A = 1 devuelve Infinity. */
export function nueves(pct) {
  const caida = 1 - pct / 100;
  if (caida <= 0) return Infinity;
  return -Math.log10(caida);
}

/** Segundos de servicio programado en cada periodo, según el horario. */
export function segundosDeServicio(horario = '24x7') {
  const h = HORARIOS[horario];
  if (!h) throw new Error(`Horario desconocido: ${horario}`);
  const porDiaServicio = h.horasDia * HORA;
  const semana = porDiaServicio * h.diasSemana;
  const anio = semana * SEMANAS_ANIO;
  return { dia: porDiaServicio, semana, mes: anio / 12, anio };
}

/**
 * Presupuesto de error: cuánto puede estar caído el servicio sin romper el SLA.
 * - pct: el SLA (por ejemplo 99.9).
 * - horario: '24x7' o '5x8'. En 5×8 «día» es un día hábil de 8 horas.
 * - mantenimientoHorasMes: ventanas de mantenimiento planificado que el contrato excluye.
 *   Se descuentan del tiempo de servicio antes de aplicar el porcentaje y se reparten
 *   en proporción al tiempo de servicio de cada periodo.
 * Devuelve, por periodo, { servicio, mantenimiento, permitido, visible } en segundos:
 * «permitido» es la caída no planificada que admite el SLA y «visible» la suma de
 * permitido + mantenimiento (lo que de verdad ve un usuario sin servicio).
 */
export function presupuesto(pct, { horario = '24x7', mantenimientoHorasMes = 0 } = {}) {
  if (leerPorcentaje(pct) === null) throw new Error(`Porcentaje no válido: ${pct}`);
  const base = segundosDeServicio(horario);
  const mantMes = Math.max(0, Number(mantenimientoHorasMes) || 0) * HORA;
  if (mantMes >= base.mes) throw new Error('El mantenimiento ocupa todo el tiempo de servicio del mes.');
  const fraccionCaida = 1 - pct / 100;
  const salida = {};
  for (const p of PERIODOS) {
    const mantenimiento = mantMes * (base[p] / base.mes);
    const medido = base[p] - mantenimiento;
    const permitido = medido * fraccionCaida;
    salida[p] = { servicio: base[p], mantenimiento, permitido, visible: permitido + mantenimiento };
  }
  return salida;
}

/**
 * Disponibilidad que de verdad ve un usuario cuando el SLA excluye el mantenimiento,
 * medida sobre el tiempo de servicio programado (calculado aquí).
 */
export function disponibilidadVista(pct, opciones = {}) {
  const { anio } = presupuesto(pct, opciones);
  return 100 * (1 - anio.visible / anio.servicio);
}
