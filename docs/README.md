# Documentación — Trivia Elifarma

Índice de especificaciones y documentos técnicos del proyecto.

## Documentos

| # | Documento | Descripción |
|---|-----------|-------------|
| 01 | [Especificaciones del Juego](./01-especificaciones-del-juego.md) | Análisis completo: arquitectura, mecánica, flujo de juego, estructura de datos, configuración, despliegue, limitaciones. |
| 02 | [Migración SvelteKit + CouchDB + Centrifugo](./02-migracion-sveltekit-couchdb-centrifugo.md) | Especificación técnica para portar el juego de Alpine.js + Firebase a SvelteKit con CouchDB y Centrifugo. Incluye estructura del proyecto, modelo de datos, API, motor server-side y plan de migración por fases. |
| 03 | [Mejoras y Optimizaciones](./03-mejoras-y-optimizaciones.md) | Propuestas de mejora organizadas por área: mecánica de juego, UX/UI, técnicas, infraestructura, seguridad, rendimiento y accesibilidad. Incluye matriz de priorización y métricas de éxito. |

## Resumen del Proyecto

**Trivia Elifarma** es una aplicación web de trivia multijugador en tiempo real para eventos presenciales. Tres roles (pantalla, control, mando) se sincronizan vía Firebase Realtime Database.

- **Stack actual**: HTML + CSS + Alpine.js + Firebase
- **Stack propuesto**: SvelteKit + CouchDB + Centrifugo
- **Estado**: Documentación completa; migración planificada
