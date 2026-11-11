import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  serie, paralelo, replicado, evaluar, cadena, eslabonDebil, conReplicaExtra, mejoras,
  cumple, requisitoPorComponente, curvaSerie, disponibilidadMTBF, mttrMaximo,
} from '../js/composicion.js';
import { EJEMPLOS } from '../js/ejemplos.js';
import { lineas, barrasLog } from '../js/graficas.js';

// Nombres reales de las empresas de los casos, escritos al revés para no versionarlos en claro.
const PROHIBIDAS = new RegExp(['meiuqer', 'anoiculos'].map((x) => [...x].reverse().join('')).join('|'), 'i');
const cerca = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);

test('serie multiplica: dos de 99,9 % dan 99,8001 %', () => {
  cerca(serie([0.999, 0.999]), 0.998001);
  assert.equal(serie([]), 1);
  cerca(serie([0.99, 0.95, 0.9]), 0.84645);
});

test('paralelo: dos de 99 % dan 99,99 %', () => {
  cerca(paralelo([0.99, 0.99]), 0.9999);
  cerca(paralelo([0.9, 0.8]), 0.98);
  assert.equal(paralelo([]), 0);
  cerca(replicado(0.995, 2), 0.999975);
  cerca(replicado(0.9, 3), 0.999);
  assert.throws(() => replicado(0.9, 0));
});

test('evaluar un árbol mixto (serie de un paralelo y una hoja)', () => {
  const arbol = { tipo: 'serie', hijos: [{ tipo: 'paralelo', hijos: [{ a: 0.99 }, { a: 0.99 }] }, { a: 0.999 }] };
  cerca(evaluar(arbol), 0.9999 * 0.999);
  assert.throws(() => evaluar({ hijos: [] }));
});

test('cadena: el total coincide con evaluar() y las cuotas suman 1', () => {
  const bloques = [{ nombre: 'a', pct: 99.9 }, { nombre: 'b', pct: 99, replicas: 2 }, { nombre: 'c', pct: 99.5 }];
  const { total, detalle } = cadena(bloques);
  cerca(total, evaluar({ tipo: 'serie', hijos: [0.999, { tipo: 'paralelo', hijos: [0.99, 0.99] }, 0.995] }));
  cerca(detalle.reduce((s, d) => s + d.cuota, 0), 1);
  assert.equal(detalle[0].replicas, 1);
});

test('el eslabón débil es el de menor disponibilidad efectiva, contando réplicas', () => {
  const bloques = [{ nombre: 'web', pct: 99, replicas: 2 }, { nombre: 'bd', pct: 99.5 }, { nombre: 'dns', pct: 99.99 }];
  assert.equal(eslabonDebil(bloques), 1); // web duplicada (99,99 %) ya no es la débil
  assert.equal(eslabonDebil([]), -1);
});

test('duplicar el eslabón débil es la mejora más grande', () => {
  const bloques = EJEMPLOS.tienda.bloques;
  const debil = eslabonDebil(bloques);
  const lista = mejoras(bloques);
  assert.equal(lista[0].i, debil);
  assert.ok(lista.every((m, k) => k === 0 || m.ganancia <= lista[k - 1].ganancia));
  cerca(lista[0].despues, conReplicaExtra(bloques, debil));
  assert.ok(conReplicaExtra(bloques, debil) > cadena(bloques).total);
});

test('cumple tolera el error de coma flotante', () => {
  assert.ok(cumple(99.9, 99.9));
  assert.ok(cumple(100 * 0.999, 99.9));
  assert.ok(!cumple(99.89, 99.9));
});

test('requisito por componente: 5 en serie para 99,9 % necesitan 99,98 % cada uno', () => {
  const r = requisitoPorComponente(99.9, 5);
  cerca(r, 99.97999, 1e-5);
  cerca(serie(Array(5).fill(r / 100)) * 100, 99.9, 1e-9);
  assert.throws(() => requisitoPorComponente(99.9, 0));
});

test('la trampa de la serie: 10 componentes de 99 % dan menos de 91 %', () => {
  const c = curvaSerie(99, 10);
  assert.equal(c.length, 10);
  cerca(c[0], 99);
  assert.ok(c[9] < 91 && c[9] > 90);
  assert.ok(c.every((v, i) => i === 0 || v < c[i - 1]));
});

test('MTBF/MTTR: 999 h entre fallas y 1 h de arreglo dan 99,9 %', () => {
  cerca(disponibilidadMTBF(999, 1), 99.9);
  cerca(disponibilidadMTBF(720, 0), 100);
  cerca(mttrMaximo(999, 99.9), 1, 1e-9);
  assert.throws(() => disponibilidadMTBF(0, 1));
});

test('los ejemplos precargados son coherentes y ninguno cumple su SLA sin cambios', () => {
  for (const [id, e] of Object.entries(EJEMPLOS)) {
    assert.ok(e.bloques.length >= 4, id);
    for (const b of e.bloques) assert.ok(b.pct > 90 && b.pct < 100, `${id}/${b.nombre}`);
    assert.ok(!cumple(cadena(e.bloques).total * 100, e.objetivo), id);
    assert.doesNotMatch(JSON.stringify(e), PROHIBIDAS);
  }
});

test('gráficas: una polilínea por serie y una barra por fila, con texto escapado', () => {
  const svg = lineas([{ nombre: 'A & B', valores: curvaSerie(99.9, 5), color: 'red' }, { nombre: 'c', valores: curvaSerie(99, 5), color: 'blue' }], { yMin: 94, yMax: 100 });
  assert.equal((svg.match(/<polyline/g) || []).length, 2);
  assert.equal((svg.match(/<circle/g) || []).length, 10);
  assert.match(svg, /A &amp; B/);
  const barras = barrasLog([{ rotulo: '99 %', valor: 315360, texto: 'x' }, { rotulo: '99,9 %', valor: 31536, texto: 'y' }]);
  assert.equal((barras.match(/<rect/g) || []).length, 2);
});
