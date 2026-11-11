// Disponibilidad compuesta. Funciones puras; trabajan con fracciones (0,999 = 99,9 %).
// Supuesto de todo el módulo: las fallas de los componentes son independientes.

/** Serie: todos son necesarios, así que se multiplican. Lista vacía → 1. */
export function serie(lista) {
  return lista.reduce((a, x) => a * x, 1);
}

/** Paralelo (redundancia): basta con uno vivo. 1 − Π(1 − A). Lista vacía → 0. */
export function paralelo(lista) {
  if (!lista.length) return 0;
  return 1 - lista.reduce((a, x) => a * (1 - x), 1);
}

/** n copias iguales en paralelo. */
export function replicado(a, n = 1) {
  if (!Number.isInteger(n) || n < 1) throw new Error(`Réplicas no válidas: ${n}`);
  return 1 - (1 - a) ** n;
}

/**
 * Evalúa un árbol: { a } es una hoja; { tipo: 'serie' | 'paralelo', hijos: [...] } combina.
 * Sirve para arquitecturas que no son una sola cadena.
 */
export function evaluar(nodo) {
  if (typeof nodo === 'number') return nodo;
  if (typeof nodo.a === 'number') return nodo.a;
  const hijos = (nodo.hijos ?? []).map(evaluar);
  if (nodo.tipo === 'serie') return serie(hijos);
  if (nodo.tipo === 'paralelo') return paralelo(hijos);
  throw new Error(`Nodo sin tipo: ${JSON.stringify(nodo)}`);
}

/**
 * Bloques en serie, cada uno con n réplicas en paralelo:
 * [{ nombre, pct, replicas }]. Devuelve el total y el detalle por bloque.
 */
export function cadena(bloques) {
  const detalle = bloques.map((b) => {
    const a = b.pct / 100;
    const n = b.replicas ?? 1;
    return { ...b, replicas: n, a, efectiva: replicado(a, n) };
  });
  const total = serie(detalle.map((d) => d.efectiva));
  const caidaTotal = detalle.reduce((s, d) => s + (1 - d.efectiva), 0);
  for (const d of detalle) d.cuota = caidaTotal > 0 ? (1 - d.efectiva) / caidaTotal : 0;
  return { total, detalle };
}

/** Índice del eslabón débil: el bloque con menor disponibilidad efectiva (el primero si empatan). */
export function eslabonDebil(bloques) {
  if (!bloques.length) return -1;
  const { detalle } = cadena(bloques);
  let peor = 0;
  detalle.forEach((d, i) => { if (d.efectiva < detalle[peor].efectiva) peor = i; });
  return peor;
}

/** Total si el bloque i recibe una réplica más (un segundo en paralelo, un tercero…). */
export function conReplicaExtra(bloques, i) {
  const copia = bloques.map((b, j) => (j === i ? { ...b, replicas: (b.replicas ?? 1) + 1 } : b));
  return cadena(copia).total;
}

/** Para cada bloque, cuánto sube el total al duplicarlo. Ordenado de mayor a menor ganancia. */
export function mejoras(bloques) {
  const antes = cadena(bloques).total;
  return bloques
    .map((b, i) => {
      const despues = conReplicaExtra(bloques, i);
      return { i, nombre: b.nombre, antes, despues, ganancia: despues - antes };
    })
    .sort((x, y) => y.ganancia - x.ganancia || x.i - y.i);
}

/** ¿El total cumple el objetivo? (ambos en %). Tolera el error de coma flotante. */
export function cumple(totalPct, objetivoPct) {
  return totalPct + 1e-9 >= objetivoPct;
}

/** Disponibilidad mínima que necesitaría cada uno de n componentes iguales en serie para llegar al objetivo. */
export function requisitoPorComponente(objetivoPct, n) {
  if (n < 1) throw new Error('Se necesita al menos un componente.');
  return 100 * (objetivoPct / 100) ** (1 / n);
}

/** Curva de la trampa de la serie: A^n para n = 1..nMax (en %). */
export function curvaSerie(pct, nMax) {
  return Array.from({ length: nMax }, (_, k) => 100 * (pct / 100) ** (k + 1));
}

// ---------- MTBF / MTTR ----------

/** A = MTBF / (MTBF + MTTR), en %. Las dos cifras en la misma unidad (horas). */
export function disponibilidadMTBF(mtbf, mttr) {
  if (!(mtbf > 0) || !(mttr >= 0)) throw new Error('MTBF debe ser > 0 y MTTR ≥ 0.');
  return (100 * mtbf) / (mtbf + mttr);
}

/** MTTR máximo para alcanzar un objetivo con un MTBF dado: MTBF · (1 − A) / A. */
export function mttrMaximo(mtbf, objetivoPct) {
  const a = objetivoPct / 100;
  return (mtbf * (1 - a)) / a;
}
