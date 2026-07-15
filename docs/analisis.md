# Análisis detallado del código — Trivia Elifarma

Este documento describe el sistema tal como está implementado. Es el resultado de leer el código fuente, no una propuesta de cambio. Sirve como base para la especificación SDD.

## 1. Naturaleza del proyecto

La Trivia Elifarma es una **aplicación web frontend pura** pensada para eventos promocionales. No tiene backend propio; la sincronización en tiempo real entre la pantalla pública, el control del presentador y los mandos de los jugadores se hace a través de **Firebase Realtime Database**.

> **Metáfora**: imagina un televisor, un control remoto del presentador y varios celulares. Todos miran la misma "sala" en Firebase; cuando el presentador cambia de pantalla, todos los dispositivos reaccionan casi al instante.

## 2. Arquitectura general

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   index.html    │◄────┤  control.html   │────►│   jugar.html    │
│  (Pantalla/TV)  │     │  (Presentador)  │     │  (Jugadores)    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   Firebase Realtime DB    │
                    │   (nodo: "Elifarma")      │
                    └───────────────────────────┘
```

### Roles

| Rol | Archivo | Responsabilidad |
|-----|---------|-----------------|
| Pantalla | `index.html` + `js/trivia/pantalla.js` | Muestra el juego al público: inicio, espera, carrera, pregunta y podio. |
| Control | `control.html` + `js/trivia/control.js` | Administra el juego: elige preguntas, inicia temporizador, revela respuestas, reinicia. |
| Mando | `jugar.html` + `js/trivia/mando.js` | Permite a un jugador registrarse y responder desde su celular. |

### Módulos compartidos

| Archivo | Función |
|---------|---------|
| `js/util/firebase.js` | Cliente único de Firebase: conexión, lectura, escritura y observadores. |
| `js/util/url.js` | Normaliza rutas con hash (`#/inicio`, `#/pregunta`). |
| `js/util/texto.js` | Convierte índices en letras (`0 → A`) y viceversa. |
| `js/util/qr.js` | Genera el QR de invitación a los jugadores. |
| `js/util/imagen.js` | Normaliza URLs de imagen: devuelve `gif1px` para `false`, `"false"`, `"null"`, `"undefined"` o valores vacíos. |
| `js/trivia/plantilla.js` | Plantilla inicial de datos en Firebase. |

## 3. Flujo de datos entre los roles

### 3.1 Inicio de una sesión

1. El presentador abre `control.html`.
2. `js/trivia/control.js` llama a `firebase.configurar(opcionesJuego, plantilla)`.
3. Si el nodo del evento no existe en Firebase, se crea con la plantilla.
4. El control escribe `control: true` para indicar que está activo.
5. La pantalla (`index.html`) también se conecta al mismo nodo y comienza a escuchar cambios.

### 3.2 Registro de jugadores

1. Un usuario abre `jugar.html`.
2. Si hay menos de `maximoJugadores` (3) registrados, puede iniciar el registro.
3. Elige sexo (`F` o `M`) y escribe un nombre (mínimo 3 caracteres).
4. Al registrar, `mando.js` agrega un nodo en `jugadores/{id}` con:
   - `nombre`, `sexo`, `puntaje: 0`, `respuesta: ""`, `tiempo: 0`, `etiqueta: "A"`, `pagina: "espera"`, `gana: false`.
5. El `id` es numérico (`0`, `1`, `2`), calculado como `snapshot.size` de `jugadores`.

### 3.3 Control de pantallas

- El presentador pulsa un botón en `control.html`.
- `control.js` escribe en `juego/pagina` el nombre de la pantalla.
- `pantalla.js` y `mando.js` escuchan `juego/pagina` y cambian su vista.

### 3.4 Ciclo de una pregunta

1. El presentador pulsa **Mostrar Pregunta**.
2. `control.js` elige una pregunta al azar de las no usadas (`disponibles`).
3. Escribe `juego/pregunta` con la pregunta seleccionada.
4. Escribe `juego/respuesta` como cadena vacía (oculta la respuesta).
5. Cambia `juego/pagina` a `"pregunta"` y la página de cada jugador a `"pregunta"`.
6. Reinicia `respuesta` y `tiempo` de cada jugador.
7. Inicia un conteo regresivo de `segundos` (15 segundos por defecto).
8. Los jugadores responden; cada respuesta guarda el índice elegido y el tiempo transcurrido.
9. El conteo se detiene cuando se acaba el tiempo o todos respondieron.
10. `control.js` evalúa: el primero en responder correctamente suma 1 punto.
11. El presentador puede pulsar **Mostrar Respuesta** para revelarla.

### 3.5 Carrera y podio

- En la pantalla `carrera`, los avatares se mueven según el puntaje (`0` a `4`).
- En `podio`, se muestran los 3 jugadores ordenados por puntaje y tiempo; suena `snd/celebra.mp3` y hay confeti.

## 4. Análisis por módulo

### 4.1 `js/trivia/pantalla.js` (pantalla pública)

**Dependencias**: lodash-es, GSAP, canvas-confetti, util/qr.js, util/firebase.js, util/url.js, util/texto.js, plantilla.js.

**Estado clave**:
- `pagina`: derivada de `url.id`.
- `jugadores`: arreglo sincronizado desde `jugadores`.
- `pregunta`, `respuestaCorrecta`, `tiempo`, `tiempoRestante`: sincronizados desde `juego/*`.
- `avatares`: objeto local con `pose` y `avance` para cada jugador.

**Observaciones**:
- Usa `Object.assign(this, opcionesJuego)` para mezclar configuración del HTML. En `index.html` y `jugar.html`, `opcionesJuego` se construye combinando opciones específicas inline con `evento` importado desde `config.json`.
- Genera el QR una sola vez en `init()` usando `qr.generar(this.urlJugadoresCompleta)`. El getter `urlJugadoresCompleta` resuelve rutas relativas (`/jugar.html`) contra `location.origin`.
- `ganadores` es un getter que ordena por `puntaje` descendente y `tiempo` ascendente.
- La animación de avance usa GSAP (`gsap.delayedCall`) y CSS (`avance-0` … `avance-4`).
- El confeti se lanza al entrar a `podio`.

**Limitaciones detectadas**:
- El avance máximo visual es 4 puntos, hardcodeado en CSS.
- No hay manejo de empates en el podio más allá del orden por tiempo.

### 4.2 `js/trivia/control.js` (panel del presentador)

**Estado clave**:
- `preguntas`: arreglo cargado desde `preguntas.json` y fusionado en `opcionesJuego`.
- `seleccionada`: índice de la pregunta actual.
- `utilizadas`: números de preguntas ya mostradas.
- `segundos`, `tiempo`, `tiempoRestante`, `tiempoInicio`.

**Getters**:
- `disponibles`: preguntas cuyo `numero` no está en `utilizadas`.
- `pregunta`: `preguntas[seleccionada]`.
- `respuestas`: jugadores con respuesta no vacía, ordenados por tiempo.

**Funciones principales**:
- `mostrarPantalla(nombre)`: escribe `juego/pagina` y, según la pantalla, actualiza la página de cada jugador.
- `seleccionarPregunta()`: elige al azar de `disponibles`.
- `mostrarPregunta()`: selecciona, publica, reinicia jugadores e inicia conteo.
- `iniciarConteo()`: intervalo de 100 ms que descuenta el tiempo restante y actualiza `juego/tiempo` y `juego/tiempoRestante` en Firebase.
- `detenerConteo()`: cancela el intervalo activo para evitar temporizadores solapados.
- `evaluarRespuestas()`: encuentra el primer jugador con respuesta correcta, le suma 1 punto y actualiza `juego/ganador`.
- `reiniciarJuego()`: limpia el nodo del evento y recarga la página.

**Observaciones**:
- El temporizador se ejecuta en el cliente del presentador; si cierra la pestaña, el conteo se detiene.
- `evaluarRespuestas` se llama cuando `tiempoRestante` llega a 0 o todos respondieron.
- El ganador se recalcula en cada pregunta.

### 4.3 `js/trivia/mando.js` (mando del jugador)

**Estado clave**:
- `jugador`: id numérico asignado al registrarse.
- `sexo`, `nombre`, `etiqueta`, `puntaje`.
- `pregunta`, `respuesta`, `tiempoRespuesta`, `correcta`.
- `pagina`: derivada de `url.id`.

**Flujo**:
- `inicio` → `sexo` → `nombre` → `espera` → `pregunta` → `final`.
- Si ya hay 3 jugadores, muestra la página `no`.
- Al registrarse, escribe en `jugadores/{id}` y luego escucha cambios de su propio nodo.
- La página se sincroniza desde `jugadores/{id}/pagina`, no directamente desde `juego/pagina`.

**Observaciones**:
- `registrable` depende de `firebase.activo && jugadores < maximoJugadores`.
- `responder(opcion)` solo guarda si `tiempo > 0`.
- `deshabilitada(id)` deshabilita botones cuando el tiempo acabó o ya se respondió otra opción.

### 4.4 `js/util/firebase.js` (cliente de Firebase)

**Responsabilidad**: encapsular toda la interacción con Firebase.

**Configuración hardcodeada**:
- `apiKey`, `authDomain`, `databaseURL`, `projectId`, etc.
- `evento` por defecto: `"demo"`.

**Métodos**:
- `configurar(opciones, plantilla)`: inicializa Firebase y crea el nodo del evento si no existe.
- `vigilar(clave, callback)`: suscripción a cambios (`onValue`).
- `conectar(clave, objeto, propiedad)`: suscripción que copia el valor directamente a una propiedad.
- `actualizar(clave, valor)`: escribe un valor (`set`).
- `obtener(clave)`, `nodo(clave)`, `lista(clave)`: lecturas puntuales.
- `agregar(clave, objeto, number)`: agrega un elemento; si `number` es true, usa id numérico.

**Observaciones**:
- No hay autenticación ni validación de reglas en el cliente.
- El nodo raíz es el nombre del evento (`this.config.evento`).
- `agregar` con `number=true` usa `lista.size` como id, lo que puede fallar si hay huecos o datos huérfanos.

### 4.5 `js/util/url.js` (rutas con hash)

- Normaliza rutas del tipo `#/inicio`, `#/pregunta`, `#/sexo`.
- `id` convierte segmentos separados por `/` en formato `segmento1:segmento2`.
- Reemplaza `$` por `!` para escapar caracteres.

### 4.6 `js/util/texto.js`

- `letra(numero)`: `0 → "A"`, `1 → "B"`, etc.
- `numero(letra)`: `"A" → 0`, `"B" → 1`, etc.

### 4.7 `js/util/qr.js`

- Usa `qr-esm` para generar un SVG QR.
- Se usa en la pantalla de espera para que los jugadores se unan.

## 5. Estructura de datos en Firebase

```json
{
  "control": true,
  "juego": {
    "pagina": "inicio",
    "pregunta": { "numero": 1, "contenido": "...", "respuestas": [...], "correcta": 0 },
    "respuesta": "FRAMBUESA",
    "tiempo": "0.000",
    "tiempoRestante": "0.000",
    "comando": "",
    "ganador": "A"
  },
  "jugadores": {
    "0": { "nombre": "Ana", "sexo": "F", "puntaje": 2, "respuesta": "", "tiempo": 0, "etiqueta": "A", "pagina": "espera", "gana": false },
    "1": { "nombre": "Luis", "sexo": "M", "puntaje": 1, ... },
    "2": { ... }
  }
}
```

## 6. Dependencias externas

| Librería | Uso | Cargada desde |
|----------|-----|---------------|
| Alpine.js 3.10.3 | Reactividad y control de vistas | CDN |
| Firebase JS SDK 9.9.1 | Realtime Database y Analytics | CDN |
| Lodash ES 4.17.21 | Manipulación de colecciones | CDN |
| GSAP 3.10.4 | Animaciones de avance | CDN |
| canvas-confetti 0.2.0-beta0 | Efecto de confeti | CDN |
| UIkit 3.15.3 | Interfaz del control | CDN |
| QR-ESM | Generación de QR | CDN |
| sanitize.css 13.0.0 | Reset CSS | CDN |

## 7. Puntos fuertes del diseño actual

- **Simpleza**: no requiere build, ni servidor propio, ni dependencias instaladas.
- **Sincronización en tiempo real**: Firebase permite que todos los dispositivos reaccionen juntos.
- **Separación clara de roles**: cada HTML tiene una responsabilidad bien definida.
- **Configuración centralizada**: `config.json` es el archivo maestro de configuración compartida (`evento`, `segundos`, `logo`, `urlJugadores`, `pantallas`, `imagenes`). `urlJugadores` puede ser relativa (ej. `/jugar.html`); la pantalla la resuelve contra `location.origin` al generar el QR. Cada HTML carga los JSON con `fetch()` dentro de un módulo ES, construye `window.opcionesJuego` y luego importa dinámicamente el punto de entrada de la página. El banco de preguntas sigue en `preguntas.json`.

## 8. Riesgos y limitaciones conocidas

| Riesgo | Impacto | Detalle |
|--------|---------|---------|
| Credenciales expuestas | Medio | La configuración de Firebase está en el cliente. |
| Sin autenticación | Alto | Cualquiera puede escribir si las reglas de Firebase lo permiten. |
| Sin manejo de desconexiones | Medio | Si el presentador cierra el navegador, el temporizador se detiene. |
| Límite de 4 puntos visuales | Bajo | CSS solo define `avance-0` a `avance-4`. |
| Conteo de jugadores por `snapshot.size` | Medio | Datos huérfanos pueden hacer que el conteo sea incorrecto. |
| Sin tests automatizados | Medio | Regresiones solo se detectan manualmente. |
| `x-html` en preguntas | Medio | Riesgo de XSS si el banco de preguntas no es confiable. |

## 9. Archivos activos vs. respaldo

### Activos (en uso)

- `index.html`, `control.html`, `jugar.html`
- `js/index.js`, `js/control.js`, `js/mando.js`, `js/jugar.js`
- `js/trivia/pantalla.js`, `js/trivia/control.js`, `js/trivia/mando.js`, `js/trivia/plantilla.js`
- `js/util/firebase.js`, `js/util/url.js`, `js/util/texto.js`, `js/util/qr.js`, `js/util/imagen.js`
- `css/base.css`, `css/pantalla.css`, `css/mando.css`

### Backup / no usados activamente

- `index.bk.html`, `index___.html`, `control copy.html`
- `js/juego.js`, `js/juego.bk2.js`, `js/juego.bk3.js`, `js/firebase.js`
- `js/util/firebase.bk.js`, `js/util/firebase.bk2.js`
- `js/trivia/plantilla.json`
