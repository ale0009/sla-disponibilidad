import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerPorcentaje, nueves, presupuesto, segundosDeServicio, disponibilidadVista } from '../js/sla.js';
import { duracion, pct } from '../js/formato.js';

const cerca = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);

test('leerPorcentaje acepta coma, punto y el signo %', () => {
  assert.equal(leerPorcentaje('99,9'), 99.9);
  assert.equal(leerPorcentaje('99.95 %'), 99.95);
  assert.equal(leerPorcentaje(' 99,99% '), 99.99);
  assert.equal(leerPorcentaje('100'), 100);
  assert.equal(leerPorcentaje(99.5), 99.5);
});

test('leerPorcentaje rechaza lo que no es un porcentaje válido', () => {
  for (const malo of ['', 'abc', '0', '-5', '101', '99,9,9', '1e2', null, undefined, NaN]) {
    assert.equal(leerPorcentaje(malo), null, String(malo));
  }
});

test('99,9 % 24×7 son 8 h 45 min 36 s al año y 43 min 48 s al mes', () => {
  const p = presupuesto(99.9);
  cerca(p.anio.permitido, 8 * 3600 + 45 * 60 + 36);
  cerca(p.mes.permitido, 43 * 60 + 48);
  cerca(p.dia.permitido, 86.4);
  assert.equal(duracion(p.anio.permitido, { completo: true }), '8 h 45 min 36 s');
});

test('cada nueve divide el presupuesto entre 10', () => {
  const a = presupuesto(99).anio.permitido;
  const b = presupuesto(99.9).anio.permitido;
  const c = presupuesto(99.99).anio.permitido;
  cerca(a / b, 10, 1e-6);
  cerca(b / c, 10, 1e-6);
  assert.equal(duracion(presupuesto(99.99).anio.permitido), '52 min 34 s');
});

test('nueves: 99,9 → 3, 99,95 → 3,3, 100 → infinito', () => {
  cerca(nueves(99.9), 3, 1e-9);
  cerca(nueves(99.95), 3.30103, 1e-5);
  assert.equal(nueves(100), Infinity);
});

test('horario 5×8: solo cuentan 40 horas por semana', () => {
  const s = segundosDeServicio('5x8');
  assert.equal(s.dia, 8 * 3600);
  assert.equal(s.semana, 40 * 3600);
  const p = presupuesto(99.9, { horario: '5x8' });
  cerca(p.semana.permitido, 144); // 0,1 % de 40 h = 2 min 24 s
  cerca(p.anio.permitido / presupuesto(99.9).anio.permitido, 40 / 168, 1e-9);
  assert.throws(() => segundosDeServicio('7x25'));
});

test('el mantenimiento excluido se descuenta y se suma a lo que ve el usuario', () => {
  const sin = presupuesto(99.9).mes;
  const con = presupuesto(99.9, { mantenimientoHorasMes: 4 }).mes;
  cerca(con.mantenimiento, 4 * 3600);
  assert.ok(con.permitido < sin.permitido);
  cerca(con.permitido, (sin.servicio - 4 * 3600) * 0.001);
  cerca(con.visible, con.permitido + 4 * 3600);
  assert.ok(disponibilidadVista(99.9, { mantenimientoHorasMes: 4 }) < 99.5);
  assert.throws(() => presupuesto(99.9, { mantenimientoHorasMes: 1000 }));
  assert.throws(() => presupuesto(120));
});

test('formato: porcentaje con coma y duraciones cortas', () => {
  assert.equal(pct(99.9), '99,9 %');
  assert.equal(pct(99.99996, 3), '99,99996 %'); // no se redondea a 100 %
  assert.equal(pct(100), '100 %');
  assert.equal(duracion(86.4), '1 min 26 s');
  assert.equal(duracion(3 * 86400 + 15 * 3600 + 36 * 60), '3 d 15 h');
  assert.equal(duracion(0.2), 'menos de 1 s');
  assert.equal(duracion(-1), '–');
});
