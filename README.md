# ¿Cuánto puede caerse tu servicio?

**Español** · [English](README.en.md)

Una página que hace una sola cosa: traduce un **SLA** (acuerdo de nivel de servicio) a tiempo real y comprueba si tu arquitectura puede cumplirlo.

- **Presupuesto de error:** escribes 99 %, 99,9 %, 99,95 %… y ves cuánto puede estar caído el servicio por día, semana, mes y año. Admite horario **24×7** o **5×8** y **mantenimiento excluido** (y avisa cuánto ve de verdad el usuario).
- **Armador de arquitectura:** componentes en **serie** (todos necesarios: se multiplican) con **réplicas en paralelo** (1 − (1 − A)ⁿ). Muestra la disponibilidad total, si cumple el SLA, el **eslabón débil**, qué parte de la caída causa y cuánto mejora con una copia más. Ejemplos: una tienda en línea y el caso de clase (sistema de reporte de errores de una empresa de videojuegos).
- **MTBF / MTTR:** A = MTBF / (MTBF + MTTR) y el MTTR máximo para cumplir el SLA.
- **SLA, OLA y UC** (ITIL 4), explicados en tres líneas.
- `/proceso/`: el caso de clase, las fórmulas, por qué «los nueves» engañan, la trampa de la serie (con gráficas), limitaciones, fe de erratas y fuentes.

Todo se calcula en el navegador; no hay API ni servidor.

## Cifras de referencia (calculado aquí, 24×7, año de 365 días)

| SLA | Al mes | Al año |
|---|---|---|
| 99 % | 7 h 18 min | 3 d 15 h 36 min |
| 99,5 % | 3 h 39 min | 1 d 19 h 48 min |
| 99,9 % | 43 min 48 s | **8 h 45 min 36 s** |
| 99,95 % | 21 min 54 s | 4 h 22 min 48 s |
| 99,99 % | 4 min 23 s | 52 min 34 s |

Cinco piezas de 99,9 % en serie dan 99,5 %; para llegar a 99,9 % cada una necesitaría 99,98 %.

## Uso

```bash
python3 -m http.server 8000   # y abrir http://localhost:8000
node --test                   # 20 pruebas (Node 20 o superior)
```

Para GitHub Pages basta con servir la rama `main` desde la raíz.

## Estructura

```
index.html, proceso/index.html   las dos páginas (sin build)
css/estilo.css                   línea "Tinta y trama" (claro) y "Jisseki" (oscuro)
js/sla.js                        porcentaje → presupuesto de error (horario, mantenimiento)
js/composicion.js                serie, paralelo, árbol, eslabón débil, mejoras, MTBF/MTTR
js/formato.js                    porcentajes y duraciones en español
js/ejemplos.js                   arquitecturas de ejemplo (valores supuestos)
js/graficas.js                   SVG de /proceso/
js/main.js, js/proceso.js, js/tema.js   interfaz
test/                            pruebas node --test
```

## Limitaciones

Supone fallas **independientes**: dos réplicas que comparten zona, software o configuración caen juntas y la redundancia real es menor. Mide minutos arriba, no lentitud ni errores parciales. Los porcentajes de los componentes de los ejemplos son supuestos, no SLA publicados por proveedores.

## De qué trabajo sale

Del diseño con ITIL 4 de un sistema de reporte de errores para una empresa de videojuegos (Gerencia y formulación de proyectos), con su SLA y su OLA, y de dos trabajos más sobre el modelo ITIL y la gestión de incidentes. El SLA del caso prometía 99,9 % 24/7 sin traducirlo a minutos ni comprobar la arquitectura: esta herramienta hace esas dos cosas.

## Créditos

[Mario Puerta «ale0009»](https://github.com/ale0009) × [David Rincón «Kuronoma»](https://www.linkedin.com/in/davidalexanderrinconcorredorkuronoma/). Licencia MIT.
