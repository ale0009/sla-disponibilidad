// Interfaz de «¿Cuánto puede caerse tu servicio?». La lógica vive en sla.js y composicion.js.
import { iniciarTema } from './tema.js';
import { leerPorcentaje, nueves, presupuesto, disponibilidadVista, PERIODOS, NOMBRE_PERIODO } from './sla.js';
import { cadena, eslabonDebil, conReplicaExtra, cumple, requisitoPorComponente, disponibilidadMTBF, mttrMaximo } from './composicion.js';
import { pct, duracion } from './formato.js';
import { EJEMPLOS, EJEMPLO_INICIAL } from './ejemplos.js';

const $ = (id) => document.getElementById(id);
const ANIO = 365 * 86400;
const MAX_COMPONENTES = 12;
const MAX_REPLICAS = 5;

const estado = { sla: 99.9, horario: '24x7', mant: 0, bloques: [], ejemplo: null };

// ---------------- 1 · SLA → presupuesto ----------------

function nivelTexto(n) {
  if (n === Infinity) return { chip: '100 %', txt: 'Ningún servicio real lo cumple.' };
  const r = Math.round(n * 10) / 10;
  const entero = Math.abs(r - Math.round(r)) < 0.05;
  const chip = `${entero ? Math.round(r) : String(r).replace('.', ',')} nueves`;
  let txt = 'Básico: caídas de horas al mes.';
  if (n >= 2.9) txt = 'Exigente: necesita guardias y monitoreo.';
  if (n >= 3.9) txt = 'Muy exigente: necesita redundancia en todo.';
  if (n >= 4.9) txt = 'Extremo: pocos servicios del mundo lo logran.';
  return { chip, txt };
}

function pintarPresupuesto() {
  const entrada = $('sla');
  const valor = leerPorcentaje(entrada.value);
  entrada.setAttribute('aria-invalid', valor === null ? 'true' : 'false');
  const ayuda = $('ayuda-sla');
  if (valor === null) {
    ayuda.textContent = 'Escribe un porcentaje entre 0 y 100, por ejemplo 99,9.';
    ayuda.classList.add('error');
    return false;
  }
  ayuda.textContent = 'Acuerdo de nivel de servicio (SLA): el porcentaje del tiempo que prometes que el servicio funciona.';
  ayuda.classList.remove('error');
  estado.sla = valor;

  let p;
  try {
    p = presupuesto(valor, { horario: estado.horario, mantenimientoHorasMes: estado.mant });
    $('mant').setAttribute('aria-invalid', 'false');
  } catch {
    $('mant').setAttribute('aria-invalid', 'true');
    return false;
  }
  $('caida-anio').textContent = duracion(p.anio.permitido);
  const nv = nivelTexto(nueves(valor));
  $('nivel').textContent = nv.chip;
  $('nivel-txt').textContent = nv.txt;

  const dl = $('periodos');
  dl.replaceChildren(...PERIODOS.flatMap((k) => {
    const dt = document.createElement('dt');
    dt.textContent = k === 'dia' && estado.horario === '5x8' ? 'Día hábil' : NOMBRE_PERIODO[k];
    const dd = document.createElement('dd');
    dd.textContent = duracion(p[k].permitido);
    const div = document.createElement('div');
    div.append(dt, dd);
    return [div];
  }));

  const aviso = $('aviso-mant');
  if (estado.mant > 0) {
    aviso.hidden = false;
    aviso.textContent = `Ojo: con ${String(estado.mant).replace('.', ',')} h de mantenimiento al mes fuera del SLA, un usuario puede ver hasta ${duracion(p.anio.visible)} sin servicio al año. Eso es ${pct(disponibilidadVista(valor, { horario: estado.horario, mantenimientoHorasMes: estado.mant }), 2)} real, no ${pct(valor)}.`;
  } else {
    aviso.hidden = true;
  }
  document.querySelectorAll('[data-sla]').forEach((b) => b.setAttribute('aria-pressed', String(leerPorcentaje(b.dataset.sla) === valor)));
  return true;
}

// ---------------- 2 · armador ----------------

function boton(texto, clase, etiqueta) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = clase;
  b.textContent = texto;
  if (etiqueta) b.setAttribute('aria-label', etiqueta);
  return b;
}

function pintarCadena() {
  const ol = $('cadena');
  ol.replaceChildren(...estado.bloques.map((b, i) => {
    const li = document.createElement('li');
    li.className = 'eslabon';
    li.dataset.i = i;
    li.style.setProperty('--n', Math.min(b.replicas, 3));

    const cab = document.createElement('div');
    cab.className = 'eslabon-cab';
    const num = document.createElement('span');
    num.className = 'eslabon-num';
    num.textContent = String(i + 1);
    const tag = document.createElement('span');
    tag.className = 'tag-debil';
    tag.textContent = 'Eslabón débil';
    const quitar = boton('×', 'quitar', `Quitar ${b.nombre || 'componente'}`);
    quitar.addEventListener('click', () => { estado.bloques.splice(i, 1); pintarCadena(); actualizar(); });
    cab.append(num, tag, quitar);

    const nombre = document.createElement('input');
    nombre.type = 'text';
    nombre.className = 'eslabon-nombre';
    nombre.value = b.nombre;
    nombre.maxLength = 40;
    nombre.setAttribute('aria-label', `Nombre del componente ${i + 1}`);
    nombre.addEventListener('input', () => { b.nombre = nombre.value; actualizar(); });

    const fila = document.createElement('div');
    fila.className = 'eslabon-fila';
    const campo = document.createElement('label');
    campo.className = 'con-unidad';
    const a = document.createElement('input');
    a.type = 'text';
    a.inputMode = 'decimal';
    a.className = 'eslabon-pct';
    a.value = String(b.pct).replace('.', ',');
    a.setAttribute('aria-label', `Disponibilidad de ${b.nombre || `componente ${i + 1}`} en %`);
    a.addEventListener('input', () => {
      const v = leerPorcentaje(a.value);
      a.setAttribute('aria-invalid', v === null ? 'true' : 'false');
      if (v !== null) b.pct = v;
      b.invalido = v === null;
      actualizar();
    });
    const u = document.createElement('span');
    u.textContent = '%';
    campo.append(a, u);

    const rep = document.createElement('div');
    rep.className = 'replicas';
    rep.setAttribute('role', 'group');
    rep.setAttribute('aria-label', `Réplicas de ${b.nombre || `componente ${i + 1}`}`);
    const menos = boton('−', 'mini paso', 'Quitar una réplica');
    const cuenta = document.createElement('span');
    cuenta.className = 'cuenta';
    cuenta.textContent = `×${b.replicas}`;
    cuenta.title = 'Copias en paralelo';
    const mas = boton('+', 'mini paso', 'Añadir una réplica en paralelo');
    menos.disabled = b.replicas <= 1;
    mas.disabled = b.replicas >= MAX_REPLICAS;
    menos.addEventListener('click', () => { b.replicas = Math.max(1, b.replicas - 1); pintarCadena(); actualizar(); });
    mas.addEventListener('click', () => { b.replicas = Math.min(MAX_REPLICAS, b.replicas + 1); pintarCadena(); actualizar(); });
    rep.append(menos, cuenta, mas);
    fila.append(campo, rep);

    const ef = document.createElement('p');
    ef.className = 'eslabon-ef';
    li.append(cab, nombre, fila, ef);
    return li;
  }));
  $('anadir').disabled = estado.bloques.length >= MAX_COMPONENTES;
}

function cargarEjemplo(id) {
  estado.ejemplo = id;
  if (id === 'vacio') {
    estado.bloques = [{ nombre: 'Servidor', pct: 99.9, replicas: 1 }];
    $('nota-ejemplo').textContent = '';
  } else {
    const e = EJEMPLOS[id];
    estado.bloques = e.bloques.map((b) => ({ ...b }));
    estado.horario = e.horario;
    document.querySelector(`input[name="horario"][value="${e.horario}"]`).checked = true;
    $('sla').value = String(e.objetivo).replace('.', ',');
    const nota = $('nota-ejemplo');
    nota.replaceChildren();
    const chip = document.createElement('span');
    chip.className = 'chip chip-ejemplo';
    chip.textContent = `Ejemplo: ${e.nombre}`;
    nota.append(chip, ` ${e.nota}`);
  }
  document.querySelectorAll('[data-ejemplo]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ejemplo === id)));
  pintarCadena();
  actualizar();
}

function pintarResultado() {
  const res = $('resultado');
  const validos = estado.bloques.filter((b) => !b.invalido);
  const lis = [...document.querySelectorAll('.eslabon')];
  if (!estado.bloques.length) {
    res.dataset.tono = 'vacio';
    $('total').textContent = '–';
    $('sello').textContent = 'Añade al menos un componente';
    for (const id of ['res-caida', 'res-debil', 'res-mejora']) $(id).textContent = '';
    $('duplicar').hidden = true;
    return;
  }
  if (validos.length !== estado.bloques.length) {
    res.dataset.tono = 'vacio';
    $('sello').textContent = 'Revisa los porcentajes marcados en rojo';
    return;
  }
  const { total, detalle } = cadena(estado.bloques);
  const debil = eslabonDebil(estado.bloques);
  const tPct = total * 100;
  const ok = cumple(tPct, estado.sla);

  detalle.forEach((d, i) => {
    const li = lis[i];
    if (!li) return;
    li.classList.toggle('debil', i === debil && estado.bloques.length > 1);
    li.querySelector('.eslabon-ef').textContent = d.replicas > 1
      ? `con ${d.replicas} copias: ${pct(d.efectiva * 100, 4)}`
      : `cae ${duracion((1 - d.efectiva) * ANIO)} al año`;
  });

  res.dataset.tono = ok ? 'frio' : 'rojo';
  $('total').textContent = pct(tPct, 3);
  $('sello').textContent = ok ? `Cumple el SLA de ${pct(estado.sla)}` : `No cumple el SLA de ${pct(estado.sla)}`;
  const caidaTotal = (1 - total) * ANIO;
  const permitido = (1 - estado.sla / 100) * ANIO;
  $('res-caida').textContent = ok
    ? `Caída esperada: ${duracion(caidaTotal)} al año (24×7). Te sobran ${duracion(permitido - caidaTotal)} del presupuesto.`
    : `Caída esperada: ${duracion(caidaTotal)} al año (24×7), frente a ${duracion(permitido)} que permite el SLA: te pasas ${duracion(caidaTotal - permitido)}.`;

  // Medidor en «nueves»: de 0 a (nueves del SLA + 1). La marca es el SLA.
  const tope = nueves(estado.sla) === Infinity ? 6 : nueves(estado.sla) + 1;
  const escala = (p) => Math.max(0, Math.min(1, Math.min(nueves(p), tope) / tope));
  $('medidor-i').style.width = `${(escala(tPct) * 100).toFixed(1)}%`;
  $('medidor-meta').style.left = `${(escala(estado.sla) * 100).toFixed(1)}%`;
  $('medidor').setAttribute('aria-label', `Total ${pct(tPct, 3)} frente al SLA ${pct(estado.sla)}`);

  if (estado.bloques.length > 1) {
    const d = detalle[debil];
    $('res-debil').innerHTML = '';
    const s = document.createElement('strong');
    s.textContent = d.nombre || `Componente ${debil + 1}`;
    $('res-debil').append('Eslabón débil: ', s, ` (${pct(d.efectiva * 100, 3)}), causa el ${Math.round(d.cuota * 100)} % de la caída.`);
  } else {
    $('res-debil').textContent = '';
  }
  const dup = $('duplicar');
  if (debil >= 0 && estado.bloques[debil].replicas < MAX_REPLICAS) {
    const despues = conReplicaExtra(estado.bloques, debil);
    const ahorro = (despues - total) * ANIO;
    const nombre = detalle[debil].nombre || `componente ${debil + 1}`;
    const cual = estado.bloques[debil].replicas === 1 ? 'un segundo' : 'otro';
    const cumpleDespues = cumple(despues * 100, estado.sla);
    let txt = `Con ${cual} «${nombre}» en paralelo: ${pct(despues * 100, 3)} (${duracion(ahorro)} menos de caída al año)`;
    txt += cumpleDespues ? ' y ya cumple.' : '.';
    if (!cumpleDespues && !ok) {
      const req = requisitoPorComponente(estado.sla, estado.bloques.length);
      txt += ` Para llegar a ${pct(estado.sla)} con ${estado.bloques.length} piezas en serie, cada una necesita en promedio ${pct(req, 3)}.`;
    }
    $('res-mejora').textContent = txt;
    dup.hidden = false;
    dup.textContent = `Duplicar «${nombre}»`;
  } else {
    $('res-mejora').textContent = '';
    dup.hidden = true;
  }
}

function actualizar() {
  pintarPresupuesto();
  pintarResultado();
}

// ---------------- 3 · MTBF / MTTR ----------------

function pintarMTBF() {
  const mtbf = Number($('mtbf').value);
  const mttr = Number($('mttr').value);
  const out = $('mtbf-res');
  if (!(mtbf > 0) || !(mttr >= 0)) {
    out.textContent = 'Escribe un MTBF mayor que 0 y un MTTR de 0 o más.';
    out.classList.add('error');
    return;
  }
  out.classList.remove('error');
  const a = disponibilidadMTBF(mtbf, mttr);
  const max = mttrMaximo(mtbf, estado.sla);
  out.replaceChildren();
  const s = document.createElement('strong');
  s.textContent = pct(a, 3);
  out.append('Disponibilidad: ', s, `. Para cumplir ${pct(estado.sla)} con una falla cada ${String(mtbf).replace('.', ',')} h, cada arreglo debe tardar como mucho ${duracion(max * 3600)}.`);
}

// ---------------- eventos ----------------

iniciarTema($('tema'));
$('sla').addEventListener('input', () => { actualizar(); pintarMTBF(); });
document.querySelectorAll('[data-sla]').forEach((b) => b.addEventListener('click', () => {
  $('sla').value = b.dataset.sla;
  actualizar();
  pintarMTBF();
}));
document.querySelectorAll('input[name="horario"]').forEach((r) => r.addEventListener('change', () => {
  estado.horario = r.value;
  actualizar();
}));
$('mant').addEventListener('input', () => {
  const v = Number($('mant').value);
  estado.mant = Number.isFinite(v) && v >= 0 ? v : 0;
  actualizar();
});
document.querySelectorAll('[data-ejemplo]').forEach((b) => b.addEventListener('click', () => { cargarEjemplo(b.dataset.ejemplo); pintarMTBF(); }));
$('anadir').addEventListener('click', () => {
  if (estado.bloques.length >= MAX_COMPONENTES) return;
  estado.bloques.push({ nombre: 'Nuevo componente', pct: 99.9, replicas: 1 });
  pintarCadena();
  actualizar();
  const ultimo = document.querySelector('.eslabon:last-child .eslabon-nombre');
  ultimo?.focus();
  ultimo?.select();
});
$('duplicar').addEventListener('click', () => {
  const i = eslabonDebil(estado.bloques);
  if (i < 0) return;
  estado.bloques[i].replicas = Math.min(MAX_REPLICAS, estado.bloques[i].replicas + 1);
  pintarCadena();
  actualizar();
});
$('mtbf').addEventListener('input', pintarMTBF);
$('mttr').addEventListener('input', pintarMTBF);

estado.horario = document.querySelector('input[name="horario"]:checked').value;
cargarEjemplo(EJEMPLO_INICIAL);
pintarMTBF();
