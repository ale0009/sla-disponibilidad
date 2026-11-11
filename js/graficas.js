// Gráficas SVG propias para /proceso/ (funciones puras: devuelven texto SVG).

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const coma = (n, d = 1) => Number(n.toFixed(d)).toString().replace('.', ',');

/**
 * Líneas: series = [{ nombre, valores: [y1, y2, …], color, clase? }], x = 1..n.
 * Ejes con rejilla, rótulo al final de cada línea y un punto por valor.
 */
export function lineas(series, { ancho = 640, alto = 320, yMin, yMax, pasoY = 2, rotuloX = 'componentes en serie', rotuloY = '%', referencia } = {}) {
  const n = Math.max(...series.map((s) => s.valores.length));
  const todos = series.flatMap((s) => s.valores);
  const y0 = yMin ?? Math.floor(Math.min(...todos));
  const y1 = yMax ?? Math.ceil(Math.max(...todos));
  const m = { izq: 46, der: 96, arr: 12, aba: 40 };
  const w = ancho - m.izq - m.der;
  const h = alto - m.arr - m.aba;
  const X = (i) => m.izq + (n === 1 ? 0 : (i / (n - 1)) * w);
  const Y = (v) => m.arr + (1 - (v - y0) / (y1 - y0)) * h;
  const p = [];
  for (let v = y0; v <= y1 + 1e-9; v += pasoY) {
    p.push(`<line class="g-reji" x1="${m.izq}" x2="${m.izq + w}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/>`);
    p.push(`<text class="g-eje" x="${m.izq - 6}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${coma(v, 0)}</text>`);
  }
  const pasoX = n > 12 ? 5 : 1;
  for (let i = 0; i < n; i++) {
    if ((i + 1) % pasoX && i !== 0) continue;
    p.push(`<text class="g-eje" x="${X(i).toFixed(1)}" y="${m.arr + h + 18}" text-anchor="middle">${i + 1}</text>`);
  }
  p.push(`<text class="g-eje" x="${m.izq + w / 2}" y="${alto - 4}" text-anchor="middle">${esc(rotuloX)}</text>`);
  p.push(`<line class="g-base" x1="${m.izq}" x2="${m.izq + w}" y1="${m.arr + h}" y2="${m.arr + h}"/>`);
  if (referencia) {
    const yr = Y(referencia.valor).toFixed(1);
    p.push(`<line class="g-ref" x1="${m.izq}" x2="${m.izq + w}" y1="${yr}" y2="${yr}"/>`);
    p.push(`<text class="g-eje g-ref-t" x="${m.izq + w + 6}" y="${(Number(yr) + 4).toFixed(1)}">${esc(referencia.nombre)}</text>`);
  }
  for (const s of series) {
    const pts = s.valores.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`);
    p.push(`<polyline class="g-linea ${s.clase ?? ''}" points="${pts.join(' ')}" style="stroke:${s.color}"/>`);
    s.valores.forEach((v, i) => p.push(`<circle class="g-punto" cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3.2" style="fill:${s.color}"><title>${esc(s.nombre)} · ${i + 1} en serie: ${coma(v, 2)} %</title></circle>`));
    const ult = s.valores.length - 1;
    p.push(`<text class="g-rotulo" x="${X(ult) + 8}" y="${(Y(s.valores[ult]) + 4).toFixed(1)}">${esc(s.nombre)}</text>`);
  }
  return `<svg class="grafica" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="Disponibilidad total según el número de ${esc(rotuloX)} (${esc(rotuloY)})">${p.join('')}</svg>`;
}

/**
 * Barras horizontales en escala logarítmica: filas = [{ rotulo, valor (segundos), texto }].
 * Cada nueve más divide la barra entre 10: la escala log lo hace visible.
 */
export function barrasLog(filas, { ancho = 640, alto = 30, margenIzq = 92, margenDer = 150 } = {}) {
  const sep = 10;
  const h = filas.length * (alto + sep) + 4;
  const util = ancho - margenIzq - margenDer;
  const lmin = Math.floor(Math.log10(Math.min(...filas.map((f) => f.valor))));
  const lmax = Math.ceil(Math.log10(Math.max(...filas.map((f) => f.valor))));
  const W = (v) => ((Math.log10(v) - lmin) / (lmax - lmin)) * util;
  const p = [];
  filas.forEach((f, i) => {
    const y = 2 + i * (alto + sep);
    const w = Math.max(3, W(f.valor));
    p.push(`<text class="g-rotulo" x="${margenIzq - 10}" y="${y + alto / 2 + 5}" text-anchor="end">${esc(f.rotulo)}</text>`);
    p.push(`<rect class="g-barra${f.destacar ? ' g-dest' : ''}" x="${margenIzq}" y="${y}" width="${w.toFixed(1)}" height="${alto}"><title>${esc(f.rotulo)}: ${esc(f.texto)}</title></rect>`);
    p.push(`<text class="g-num tinta" x="${(margenIzq + w + 8).toFixed(1)}" y="${y + alto / 2 + 4}">${esc(f.texto)}</text>`);
  });
  return `<svg class="grafica" viewBox="0 0 ${ancho} ${h}" role="img" aria-label="Caída permitida al año por nivel de SLA, en escala logarítmica">${p.join('')}</svg>`;
}
