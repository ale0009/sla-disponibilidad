// Formato en español (coma decimal). Funciones puras.

/** Porcentaje con coma decimal, sin ceros sobrantes: 99.9 → «99,9 %». */
export function pct(valor, decimales = 3) {
  if (!Number.isFinite(valor)) return '–';
  // No redondear hacia 100 % si no es exactamente 100: se perderían los nueves.
  let d = decimales;
  while (d < 8 && valor < 100 && Number(valor.toFixed(d)) >= 100) d++;
  const txt = Number(valor.toFixed(d)).toString().replace('.', ',');
  return `${txt} %`;
}

/**
 * Duración legible: 31536 → «8 h 45 min 36 s»; 86.4 → «1 min 26 s».
 * Muestra como mucho dos unidades significativas (días y horas, horas y minutos…),
 * salvo `completo: true`, que muestra todas hasta los segundos.
 */
export function duracion(segundos, { completo = false } = {}) {
  if (!Number.isFinite(segundos) || segundos < 0) return '–';
  let s = Math.round(segundos);
  if (s === 0) return segundos > 0 ? 'menos de 1 s' : '0 s';
  const partes = [];
  const unidades = [['d', 86400], ['h', 3600], ['min', 60], ['s', 1]];
  for (const [u, v] of unidades) {
    const n = Math.floor(s / v);
    s -= n * v;
    if (n > 0) partes.push(`${n} ${u}`);
    else if (partes.length && !completo) break; // «2 h 0 min» no: se corta en el primer hueco
  }
  return (completo ? partes : partes.slice(0, 2)).join(' ');
}

/** Número con coma decimal y punto de miles: 2085.71 → «2.085,7». */
export function num(valor, decimales = 1) {
  return valor.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: decimales });
}
