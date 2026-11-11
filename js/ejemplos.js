// Arquitecturas de ejemplo. Las disponibilidades de cada componente son SUPUESTOS
// razonables para mostrar el cálculo (no son mediciones ni el SLA de ningún proveedor).

export const EJEMPLOS = {
  tienda: {
    nombre: 'Tienda en línea',
    objetivo: 99.9,
    horario: '24x7',
    nota: 'Valores de ejemplo, no medidos. Dos servidores web detrás de un balanceador.',
    bloques: [
      { nombre: 'DNS', pct: 99.99, replicas: 1 },
      { nombre: 'Nube (región)', pct: 99.95, replicas: 1 },
      { nombre: 'Balanceador de carga', pct: 99.99, replicas: 1 },
      { nombre: 'Servidor web', pct: 99.5, replicas: 2 },
      { nombre: 'Base de datos', pct: 99.5, replicas: 1 },
      { nombre: 'Pasarela de pago', pct: 99.9, replicas: 1 },
    ],
  },
  clase: {
    nombre: 'Caso de clase: reporte de errores',
    objetivo: 99.9,
    horario: '24x7',
    nota: 'Sistema de reporte de errores de una empresa de videojuegos (trabajo de clase, ITIL 4). El 99,9 % 24/7 es el de la fila de soporte técnico de su SLA; los componentes y sus cifras son supuestos de este ejemplo.',
    bloques: [
      { nombre: 'DNS', pct: 99.99, replicas: 1 },
      { nombre: 'Inicio de sesión (SSO)', pct: 99.9, replicas: 1 },
      { nombre: 'API de reportes', pct: 99.5, replicas: 1 },
      { nombre: 'Base de datos de errores', pct: 99.9, replicas: 1 },
      { nombre: 'Mesa de ayuda en la nube (SaaS)', pct: 99.9, replicas: 1 },
    ],
  },
};

export const EJEMPLO_INICIAL = 'tienda';
