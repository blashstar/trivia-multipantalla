# Documentación SDD — Trivia Elifarma

Esta carpeta contiene la especificación técnica y funcional de la **Trivia Elifarma**, redactada bajo el enfoque de **Spec Driven Development (SDD)**. El objetivo es describir *qué* hace el sistema, *cómo* se comporta ante cada evento y *qué* contratos debe respetar cualquier modificación futura.

> **Nota sobre el alcance**: Esta especificación documenta el sistema **tal como está construido hoy**. No es una propuesta de cambio; es la línea base contra la que futuros cambios pueden medirse.

## 📂 Estructura de la documentación

| Documento | Propósito |
|-----------|-----------|
| [`analisis.md`](./analisis.md) | Análisis detallado del código existente: arquitectura, flujo de datos, dependencias y observaciones. |
| [`cambios/2026-07-08-cargar-opciones-desde-json.md`](./cambios/2026-07-08-cargar-opciones-desde-json.md) | Registro del cambio que externaliza `opcionesJuego` a `config.json` y `preguntas.json`. |
| [`especificacion/README.md`](./especificacion/README.md) | Resumen de la especificación y mapa de capacidades del sistema. |
| [`especificacion/01-contexto.md`](./especificacion/01-contexto.md) | Contexto del negocio, actores, objetivos y restricciones. |
| [`especificacion/02-flujo-juego.md`](./especificacion/02-flujo-juego.md) | Flujo completo de una partida: desde el inicio hasta el podio. |
| [`especificacion/03-pantalla.md`](./especificacion/03-pantalla.md) | Especificación de la pantalla principal (`index.html`). |
| [`especificacion/04-control.md`](./especificacion/04-control.md) | Especificación del panel del presentador (`control.html`). |
| [`especificacion/05-mando.md`](./especificacion/05-mando.md) | Especificación del mando del jugador (`jugar.html`). |
| [`especificacion/06-sincronizacion.md`](./especificacion/06-sincronizacion.md) | Contratos de sincronización con Firebase Realtime Database. |
| [`especificacion/07-seguridad.md`](./especificacion/07-seguridad.md) | Consideraciones de seguridad, riesgos y límites conocidos. |
| [`especificacion/08-interfaces.md`](./especificacion/08-interfaces.md) | Contratos visuales, CSS y recursos multimedia. |
| [`lexico.md`](./lexico.md) | Glosario de términos, abreviaturas y convenciones. |

## 🧭 Cómo usar esta documentación

1. **Para entender el sistema**: comienza por [`analisis.md`](./analisis.md) y [`especificacion/02-flujo-juego.md`](./especificacion/02-flujo-juego.md).
2. **Para modificar una pantalla**: lee la especificación correspondiente (`03`, `04` o `05`) y luego [`06-sincronizacion.md`](./especificacion/06-sincronizacion.md).
3. **Para agregar una funcionalidad**: escribe primero un delta de esta especificación; cualquier cambio debe respetar los requisitos aquí documentados.

## ✅ Convenciones usadas

- Los requisitos usan palabras clave del [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119): **MUST/SHALL** (obligatorio), **SHOULD** (recomendado), **MAY** (opcional).
- Los escenarios siguen el formato **Given / When / Then**.
- El código, nombres de archivos y rutas se mantienen en español, como en el proyecto.
