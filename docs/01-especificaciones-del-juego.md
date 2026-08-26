# Especificaciones del Juego — Trivia Elifarma

## 1. Visión General

**Trivia Elifarma** es una aplicación web de trivia multijugador en tiempo real diseñada para eventos promocionales presenciales. Un presentador proyecta preguntas en una pantalla gigante mientras los jugadores responden desde sus teléfonos móviles. El sistema sincroniza estado, evalúa respuestas y muestra resultados en vivo.

### 1.1 Características clave

- **Tres roles separados**: Pantalla (proyector/TV), Control (presentador), Mando (jugador).
- **Tiempo real**: Los jugadores ven la misma pregunta simultáneamente y compiten por velocidad.
- **Sin backend propio**: Toda la comunicación se realiza a través de Firebase Realtime Database.
- **Frontend puro**: HTML + CSS + JavaScript con Alpine.js como framework reactivo.
- **Sin build**: No hay bundler, transpilador ni gestor de paquetes. Los archivos se sirven estáticamente.

### 1.2 Stack tecnológico actual

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework reactivo | Alpine.js | 3.10.3 |
| Base de datos en tiempo real | Firebase Realtime Database | SDK 9.9.1 |
| CSS | CSS3 plano (sin preprocesadores) | — |
| Animaciones (pantalla) | GSAP | 3.10.4 |
| Confeti (podio) | canvas-confetti | 0.2.0-beta0 |
| UI del control | UIkit | 3.15.3 |
| Utilidades | Lodash ES | 4.17.21 |
| Generación QR | QR-ESM | — |
| Despliegue | Docker + Nginx (Dokploy) | — |

---

## 2. Arquitectura

### 2.1 Diagrama de roles

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   PANTALLA       │     │   CONTROL        │     │   MANDO (×N)     │
│   index.html     │     │   control.html   │     │   jugar.html     │
│                  │     │                  │     │                  │
│  - Muestra el    │     │  - Administra    │     │  - Registra      │
│    juego al      │     │    el flujo del  │     │  - Recibe        │
│    público       │     │    juego         │     │    preguntas     │
│  - QR de acceso  │     │  - Temporizador  │     │  - Envía         │
│  - Carrera       │     │  - Evaluación    │     │    respuestas    │
│  - Podio         │     │  - Preguntas     │     │  - Ve su         │
│                  │     │                  │     │    puntaje       │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │  Firebase Realtime DB     │
                    │  (nodo del evento)        │
                    └───────────────────────────┘
```

### 2.2 Estructura de datos en Firebase

Todos los datos viven bajo un nodo raíz con el nombre del evento (ej. `Elifarma` o `visa-trivia`).

```
{evento}/
├── control: boolean              # true cuando el presentador está conectado
├── juego/
│   ├── pagina: string            # "inicio" | "espera" | "carrera" | "pregunta" | "podio" | "puntajes" | "#"
│   ├── pregunta: object | null   # { numero, contenido, respuestas[], correcta }
│   ├── respuesta: string         # Texto de la respuesta correcta (vacío = no revelada)
│   ├── tiempo: number            # Segundos transcurridos desde que se mostró la pregunta
│   ├── tiempoRestante: number    # Segundos restantes (redondeado a 3 decimales)
│   ├── comando: string           # "inicio" | "avances" | "" (señales efímeras)
│   └── ganador: string|false     # Etiqueta del ganador ("A", "B", "C") o false
└── jugadores/
    ├── 0/
    │   ├── nombre: string
    │   ├── sexo: "F" | "M"
    │   ├── puntaje: number
    │   ├── respuesta: string|""  # Índice de la opción elegida (como string)
    │   ├── tiempo: number        # Segundos al momento de responder
    │   ├── estado: string        # "parado" | "corriendo"
    │   ├── pagina: string        # Página actual del mando ("espera", "pregunta", "final")
    │   ├── etiqueta: string      # "A", "B", "C"
    │   └── gana: boolean
    ├── 1/
    └── 2/
```

### 2.3 Flujo de sincronización

1. **Control** escribe `juego/pagina` → todos los clientes leen el cambio vía listener.
2. **Pantalla** escucha `juego/pagina` y navega a la vista correspondiente.
3. **Mandos** escuchan `jugadores/{id}/pagina` y el control escribe la página de cada jugador al cambiar de pantalla.
4. **Control** escribe `juego/pregunta` → todos reciben la pregunta.
5. **Mandos** envían `jugadores/{id}/respuesta` y `jugadores/{id}/tiempo`.
6. **Control** evalúa al cerrar el temporizador y actualiza puntajes.

---

## 3. Mecánica del Juego

### 3.1 Flujo completo

```
INICIO → ESPERA → (CARRERA) → PREGUNTA → EVALUACIÓN → ... → PODIO/PUNTAJES
   ↑                                                          │
   └──────────────────────────────────────────────────────────┘
                        (reinicio)
```

### 3.2 Pantallas

#### 3.2.1 Inicio (`inicio`)
- Muestra logo del evento y tarjeta visual.
- Pantalla estática de bienvenida antes de que los jugadores se conecten.

#### 3.2.2 Espera (`espera`)
- Muestra un **código QR** grande que apunta a la URL del mando (`jugar.html`).
- Texto con instrucciones para los jugadores.
- El presentador puede ver cuántos jugadores se han registrado.
- Título y subtítulos dinámicos desde `brand.json`.

#### 3.2.3 Carrera (`carrera`)
- Vista de pista con personajes animados que representan a cada jugador.
- Los personajes avanzan según el puntaje (0-4 posiciones CSS).
- Animación de sprite sheet al avanzar (clases `corriendo`/`parado`).
- Posiciones fijas por etiqueta: A (arriba), B (medio), C (abajo).
- **Limitación**: el avance visual está hardcodeado a 4 posiciones (`avance-0` a `avance-4`).

#### 3.2.4 Pregunta (`pregunta`)
- Muestra el contenido de la pregunta y las opciones de respuesta.
- Cronómetro visible con cuenta regresiva.
- Al revelar la respuesta correcta, la opción se ilumina con animación de pulso.
- En la pantalla, las opciones son visuales (no interactivas).

#### 3.2.5 Podio (`podio`)
- Tabla de posiciones ordenada por puntaje (desc) y tiempo (asc).
- Efecto de confeti con canvas-confetti.
- Muestra icono de copa y nombres de los jugadores.

#### 3.2.6 Puntajes (`puntajes`)
- Vista idéntica al podio pero sin confeti.
- Se usa para mostrar la clasificación parcial entre rondas.

#### 3.2.7 Ninguna (`#`)
- Pantalla negra vacía. Se usa para ocultar la proyección.

### 3.3 Mando del Jugador

#### 3.3.1 Flujo de registro
1. **Inicio**: El jugador pulsa un botón para comenzar.
2. **Sexo**: Selecciona Femenino o Masculino (determina el avatar).
3. **Nombre**: Ingresa su nombre (mínimo 3 caracteres, máximo 16).
4. **Registro**: Se escribe en Firebase como `jugadores/{n}` con ID numérico secuencial.
5. **Espera**: Ve su etiqueta (A/B/C), nombre y puntaje actual.

#### 3.3.2 Flujo de pregunta
1. El mando recibe la página `pregunta` desde Firebase.
2. Muestra el contenido y las opciones.
3. El jugador pulsa una opción → se guarda `respuesta` (índice) y `tiempo` (segundos transcurridos).
4. Las opciones se deshabilitan después de responder o cuando se acaba el tiempo.
5. Muestra confirmación: "Has contestado 'X' en Y segundos".

#### 3.3.3 Final
1. El mando recibe la página `final`.
2. Muestra si el jugador es el ganador o un mensaje de "Juego Finalizado".
3. Muestra el puntaje final.

#### 3.3.4 Capacidad máxima
- El mando verifica `jugadores.length` contra `maximoJugadores` (por defecto 3).
- Si está lleno, muestra pantalla "Lo sentimos, ya no puedes unirte".

### 3.4 Panel de Control (Presentador)

#### 3.4.1 Pestaña Jugadores
- Lista todos los jugadores registrados con nombre, puntaje, tiempo y respuesta.

#### 3.4.2 Pestaña Preguntas
- Muestra todas las preguntas disponibles del banco (`preguntas.json`).
- Cada pregunta muestra contenido, opciones y respuesta correcta.

#### 3.4.3 Pestaña Juego
- **Mostrar Pregunta**: Selecciona una pregunta aleatoria del banco, la escribe en Firebase, resetea respuestas de todos los jugadores, inicia el temporizador.
- **Mostrar Respuesta**: Revela la respuesta correcta en la pantalla.
- **Ocultar Respuesta**: Oculta la respuesta correcta.
- **Reiniciar Juego**: Borra todos los jugadores, resetea el estado y recarga la página.
- Muestra tiempo máximo, tiempo transcurrido y tiempo restante.

#### 3.4.4 Botones de Pantalla
- **Ninguna**: Pantalla negra.
- **Inicio**: Muestra la pantalla de inicio.
- **Espera**: Muestra el QR e instrucciones.
- **Puntajes**: Muestra la tabla de clasificación.
- **Podio**: Muestra el podio con confeti.

Al cambiar de pantalla, el control actualiza la `pagina` de cada jugador para sincronizar los mandos.

### 3.5 Sistema de Evaluación

1. El temporizador corre en intervalos de 100ms.
2. Cuando el tiempo llega a 0 **o todos los jugadores han respondido**, se detiene.
3. Se filtran los jugadores que respondieron correctamente (`respuesta == pregunta.correcta`).
4. Se ordenan por tiempo ascendente.
5. **Solo el primer jugador en responder correctamente** recibe 1 punto.
6. Se recalcula el líder actual y se actualiza `juego/ganador`.

### 3.6 Banco de Preguntas

- Archivo `preguntas.json` en la raíz.
- 40 preguntas disponibles (numeradas 29-68).
- Cada pregunta tiene: `numero`, `contenido`, `respuestas[]`, `correcta` (índice base 0).
- Las preguntas se seleccionan aleatoriamente sin repetición dentro de una ronda.
- Cuando se agotan las preguntas disponibles, el contador de utilizadas se resetea.
- El tiempo por pregunta es configurable (por defecto 5 segundos en `config.json`).

---

## 4. Configuración

### 4.1 Archivos de configuración

| Archivo | Propósito |
|---------|-----------|
| `config.json` | Configuración técnica: evento, tiempos, URLs, fondos por pantalla |
| `brand.json` | Identidad de marca: nombre, colores, logos, textos, máximo de jugadores |
| `preguntas.json` | Banco de preguntas del juego |
| `env.js` (generado) | Credenciales de Firebase inyectadas en runtime |

### 4.2 Jerarquía de configuración

```
brand.json + config.json → loader.js → window.opcionesJuego → Object.assign(en módulo Alpine)
```

`loader.js` carga `config.json` y `brand.json` en paralelo, los fusiona con `opcionesJuego` y mapea `jugadores.maximo` a `maximoJugadores` por compatibilidad.

### 4.3 Identidad visual dinámica

`brand.json` define colores que se inyectan como CSS custom properties en `:root`:

```css
--color-primario: #1434CB;
--color-secundario: #063b9e;
--color-acento: #DD6126;
--color-fondo: #000000;
--color-texto: #ffffff;
```

Estos valores pueden ser sobrescritos por la configuración cargada en runtime.

---

## 5. Escalado y Responsive

### 5.1 Pantalla (index.html)
- Diseño fijo de **1920×1080px**.
- El módulo `escaler.js` calcula un factor de escala para ajustar al viewport manteniendo aspect ratio 16:9.
- Usa `transform: translate() scale()` para centrar y escalar.

### 5.2 Mando (jugar.html)
- Usa `100vw × 100dvh` con `transform: none` (sobrescribe las reglas de `base.css`).
- Diseño responsive con unidades fluidas (`clamp()`, `vw`, `dvh`).
- Optimizado para pantallas móviles en orientación vertical.

### 5.3 Control (control.html)
- Usa UIkit para layout responsive.
- No requiere escalado especial; es una herramienta administrativa.

---

## 6. Despliegue

### 6.1 Docker
- Imagen `nginx:alpine`.
- `entrypoint.sh` genera `env.js` desde `env.js.template` usando `envsubst`.
- Expone puerto 80.
- Configurado para Dokploy con red `dokploy-network`.

### 6.2 Variables de entorno

Todas las credenciales de Firebase se inyectan vía variables de entorno:

```
FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_DATABASE_URL,
FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID,
FIREBASE_APP_ID, FIREBASE_MEASUREMENT_ID
```

---

## 7. Dependencias Externas (CDN)

| Recurso | URL Base |
|---------|----------|
| Alpine.js | cdnjs.cloudflare.com |
| Firebase SDK | gstatic.com + cdnjs.cloudflare.com |
| Lodash ES | cdn.jsdelivr.net |
| GSAP | cdn.jsdelivr.net/gh/greensock |
| canvas-confetti | cdn.jsdelivr.net/npm |
| UIkit | cdn.jsdelivr.net |
| Sanitize.css | cdnjs.cloudflare.com |
| QR-ESM | cdn.jsdelivr.net/gh |
| Fuentes (Scotia, Visa Dialect) | Servidas localmente desde `/fnt/` |

---

## 8. Consideraciones de Seguridad

1. **Sin autenticación**: No hay sistema de login. Cualquiera con la URL puede acceder.
2. **Reglas de Firebase**: Si las reglas de Realtime Database permiten escritura anónima, cualquiera puede modificar el estado del juego.
3. **XSS potencial**: El contenido de las preguntas se renderiza con `x-html` (innerHTML). Si la fuente de preguntas no es confiable, hay riesgo de XSS.
4. **Credenciales**: Ya no están hardcodeadas; se inyectan en runtime. Los archivos con credenciales históricas están en `.gitignore`.
5. **Sin HTTPS forzado**: Depende del hosting. El despliegue Docker no configura TLS directamente.
6. **IDs predecibles**: Los jugadores usan IDs numéricos secuenciales (0, 1, 2). Las etiquetas son letras consecutivas (A, B, C).

---

## 9. Limitaciones Conocidas

1. **Sin tests automatizados**: No hay suite de tests.
2. **Sin build ni linting**: No hay validación de código en CI/CD.
3. **Sin manejo de desconexiones**: Si un jugador pierde conexión, no hay reconexión automática ni manejo de estado.
4. **Avance limitado a 4 posiciones**: El CSS solo define clases `avance-0` a `avance-4`.
5. **Conteo de jugadores frágil**: Depende de `snapshot.size` de Firebase; datos huérfanos pueden causar conteo incorrecto.
6. **Temporizador en el cliente**: El conteo del tiempo corre en el navegador del presentador. Si su reloj se desincroniza, afecta a todos.
7. **Evaluación centralizada**: Solo el control evalúa respuestas. Si el presentador cierra su navegador, el juego se detiene.
8. **Pantalla y Puntajes duplicados**: El CSS de `#puntajes` es una copia casi idéntica de `#podio` (≈350 líneas duplicadas).
9. **Sin persistencia de resultados**: Al reiniciar, todos los datos se borran de Firebase.
10. **Un solo evento**: La estructura solo soporta un evento activo a la vez por proyecto de Firebase.
