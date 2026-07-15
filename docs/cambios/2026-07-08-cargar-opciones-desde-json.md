# Cambio: Cargar opcionesJuego desde JSON en control.html

**Fecha**: 2026-07-08
**Tipo**: Modificación
**Área afectada**: `control.html`, `index.html`, `jugar.html`, `config.json`, `preguntas.json`

## Resumen

Se externalizó la configuración compartida del evento en `config.json` y el banco de preguntas en `preguntas.json`. Las tres páginas principales ahora importan al menos `config.json` como módulo ES y construyen `window.opcionesJuego` a partir de él:

- `control.html`: usa `config.json` + `preguntas.json`.
- `index.html`: importa `config.json` y fusiona toda su configuración; mantiene inline `modulo` y `pantallas` como fallback. La pantalla resuelve `urlJugadores` contra `location.origin` al generar el QR.
- `jugar.html`: importa `config.json` y fusiona `evento`; mantiene inline `modulo` e `imagenes`.

Anteriormente, `opcionesJuego` se definía completamente inline en cada HTML.

## Motivación

- Facilitar la edición del banco de preguntas sin tocar HTML.
- Separar datos de presentación.
- Permitir que el banco de preguntas sea generado o versionado de forma independiente.

## Cambios realizados

### Archivos nuevos

- `config.json`
- `preguntas.json`

### Archivos modificados

- `control.html`: reemplaza el bloque inline de `opcionesJuego` por un fallback inline + módulo ES que importa `config.json` y `preguntas.json`.
- `index.html`: cambia `const opcionesJuego` por `window.opcionesJuego` y agrega un módulo ES que importa `config.json` para actualizar `evento`.
- `jugar.html`: agrega un módulo ES que importa `config.json` para actualizar `evento`.

### Documentación actualizada

- `docs/README.md`: se agregó entrada al registro de cambios.
- `docs/analisis.md`: se actualizó la descripción del origen de la configuración.
- `docs/especificacion/04-control.md`: se actualizó el requisito de inicialización y las notas técnicas.
- `docs/especificacion/03-pantalla.md`: se actualizó el requisito de inicialización de la pantalla.
- `docs/especificacion/05-mando.md`: se actualizó el requisito de inicialización del mando.
- `AGENTS.md`: se actualizaron las instrucciones de configuración.

## Consideraciones

- Los JSON se cargan con `fetch()` dentro de un módulo ES, y luego se importa dinámicamente el punto de entrada de la página (`js/control.js`, `js/index.js`, `js/mando.js`). Esto garantiza que `window.opcionesJuego` se construya antes de que Alpine inicie.
- El objeto fallback inline garantiza que ninguna página se quede sin `opcionesJuego` si `fetch` falla.
- La carga con `fetch` es compatible con navegadores que no soportan import assertions.
- En `index.html` y `jugar.html`, el `modulo` se mantiene inline; el resto de la configuración se fusiona desde `config.json`.
- `urlJugadores` puede ser una ruta relativa (ej. `/jugar.html`); `js/trivia/pantalla.js` la convierte en URL absoluta usando `location.origin` antes de generar el QR.
- Los archivos JSON deben ubicarse en la misma carpeta que los HTML y servirse con un servidor estático que envíe el tipo MIME correcto (`application/json`).

## Verificación

1. Abrir `control.html`, `index.html` y `jugar.html` con un servidor estático.
2. En la consola del navegador de cada una, ejecutar `window.opcionesJuego`.
3. Confirmar que contiene `evento` y las opciones específicas de cada página.
4. En `control.html`: confirmar que la pestaña "Preguntas" muestra el banco completo y que "Mostrar Pregunta" funciona.
5. En `index.html`: confirmar que el QR apunta a la URL absoluta resultante de resolver `urlJugadores` contra `location.origin`.
6. En `jugar.html`: confirmar que el flujo de registro sigue funcionando.

## Referencias

- Especificación del control: [`docs/especificacion/04-control.md`](../especificacion/04-control.md)
- Análisis del código: [`docs/analisis.md`](../analisis.md)
