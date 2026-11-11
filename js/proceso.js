// Página /proceso/: tema, tabla de los nueves, gráficas y tabla del SLA del caso de clase.
import { iniciarTema } from './tema.js';
import { presupuesto } from './sla.js';
import { curvaSerie, cadena, replicado } from './composicion.js';
import { pct, duracion } from './formato.js';
import { lineas, barrasLog } from './graficas.js';
import { EJEMPLOS } from './ejemplos.js';

const $ = (id) => document.getElementById(id);

const celda = (tr, texto, clase) => {
  const td = document.createElement('td');
  td.textContent = texto;
  if (clase) td.className = clase;
  tr.append(td);
};

// 1 · tabla y gráfica de los nueves
const NIVELES = [99, 99.5, 99.9, 99.95, 99.99, 99.999];
function pintarNueves() {
  const cuerpo = $('t-nueves');
  for (const n of NIVELES) {
    const p = presupuesto(n);
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = pct(n);
    tr.append(th);
    for (const k of ['dia', 'semana', 'mes', 'anio']) celda(tr, duracion(p[k].permitido), 'num');
    cuerpo.append(tr);
  }
  $('g-nueves').innerHTML = barrasLog(NIVELES.map((n) => ({
    rotulo: pct(n),
    valor: presupuesto(n).anio.permitido,
    texto: duracion(presupuesto(n).anio.permitido),
    destacar: n === 99.9,
  })));
}

// 2 · la trampa de la serie
function pintarSerie() {
  const N = 20;
  $('g-serie').innerHTML = lineas([
    { nombre: '99,9 % c/u', valores: curvaSerie(99.9, N), color: 'var(--cian)' },
    { nombre: '99,5 % c/u', valores: curvaSerie(99.5, N), color: 'var(--ambar)' },
    { nombre: '99 % c/u', valores: curvaSerie(99, N), color: 'var(--rojo)' },
  ], { yMin: 80, yMax: 100, pasoY: 5, referencia: { valor: 99.9, nombre: 'SLA 99,9 %' } });
  const c = curvaSerie(99.9, N);
  const c99 = curvaSerie(99, N);
  $('serie-cifras').textContent = `Con 5 piezas de 99,9 %: ${pct(c[4], 2)}. Con 10: ${pct(c[9], 2)}. Con 10 piezas de 99 %: ${pct(c99[9], 2)}, más de un mes de caída al año (calculado aquí).`;
}

// 3 · redundancia
function pintarRedundancia() {
  const cuerpo = $('t-redundancia');
  for (const n of [1, 2, 3]) {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = n === 1 ? '1 (sin redundancia)' : `${n} en paralelo`;
    tr.append(th);
    for (const a of [0.99, 0.995, 0.999]) celda(tr, pct(replicado(a, n) * 100, 6), 'num');
    cuerpo.append(tr);
  }
}

// 4 · SLA del caso de clase (cifras de la fuente; caída calculada aquí)
const SLA_CASO = [
  { servicio: 'Gestión de registros (fila con la errata de la mina)', pct: 99.5, horario: '24x7', resp: 'máx. 2 h laborables' },
  { servicio: 'Aviso de caídas no planificadas', pct: 98, horario: '24x7', resp: 'máx. 1 h' },
  { servicio: 'Consultas urgentes de seguridad', pct: 99.8, horario: '24x7', resp: 'máx. 30 min' },
  { servicio: 'Medidas de seguridad de los datos', pct: 99.9, horario: '24x7', resp: 'máx. 4 h laborables' },
  { servicio: 'Copias de seguridad diarias', pct: 99.7, horario: '24x7', resp: 'máx. 6 h laborables' },
  { servicio: 'Actualizaciones trimestrales', pct: 98.5, horario: null, resp: 'máx. 10 h' },
  { servicio: 'Capacitación a usuarios', pct: 97, horario: '5x8', resp: 'máx. 2 días laborables' },
  { servicio: 'Soporte técnico 24/7', pct: 99.9, horario: '24x7', resp: 'máx. 1 h' },
];
function pintarCaso() {
  const cuerpo = $('t-caso');
  for (const f of SLA_CASO) {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = f.servicio;
    tr.append(th);
    celda(tr, pct(f.pct), 'num');
    celda(tr, f.horario === '5x8' ? 'días laborables' : f.horario ? '24/7' : 'fuera del horario laboral');
    celda(tr, f.resp);
    celda(tr, f.horario ? duracion(presupuesto(f.pct, { horario: f.horario }).mes.permitido) : 'sin definir', 'num');
    cuerpo.append(tr);
  }
  const e = EJEMPLOS.clase;
  const t = cadena(e.bloques).total * 100;
  $('caso-armado').textContent = `Con los componentes supuestos del ejemplo (${e.bloques.map((b) => `${b.nombre} ${pct(b.pct)}`).join(', ')}), el total en serie es ${pct(t, 3)}: no llega al ${pct(e.objetivo)} prometido aunque cada pieza parezca «muy disponible».`;
}

iniciarTema($('tema'));
pintarNueves();
pintarSerie();
pintarRedundancia();
pintarCaso();
