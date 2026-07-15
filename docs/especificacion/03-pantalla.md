# Especificación — Pantalla principal (`index.html`)

## Propósito

Definir el comportamiento de la pantalla pública: qué muestra en cada estado, cómo reacciona a los cambios de Firebase y qué recursos visuales utiliza.

## Alcance

- Entrada: `index.html` con `js/trivia/pantalla.js`.
- Responsabilidad: reflejar visualmente el estado del juego.
- No gestiona lógica de negocio (temporizador, evaluación); solo la muestra.

## Requisitos

### Requirement: Inicialización

El sistema **MUST** cargar la configuración del evento desde `opcionesJuego` (que combina opciones inline con `config` cargado desde `config.json`), generar el QR de invitación con una URL absoluta y conectarse a Firebase al iniciar la pantalla.

#### Scenario: Carga inicial

- **GIVEN** que `config.json` existe junto a `index.html`
- **WHEN** se abre `index.html`
- **THEN** el sistema **MUST** cargar `config.json` con `fetch()` dentro de un módulo ES
- **AND** **MUST** construir `window.opcionesJuego` combinando las opciones inline con `config`
- **AND** **MUST** aplicar `opcionesJuego` sobre el estado interno
- **AND** **MUST** generar el QR apuntando a la URL absoluta obtenida de `urlJugadores`
- **AND** **MUST** sincronizar `jugadores`, `juego/pregunta`, `juego/respuesta`, `juego/tiempo` y `juego/tiempoRestante`

#### Scenario: config.json no disponible

- **GIVEN** que `config.json` no se puede cargar con `fetch`
- **WHEN** se abre `index.html`
- **THEN** el sistema **MUST** usar el objeto `opcionesJuego` inline como fallback
- **AND** **MUST** registrar el error en la consola

### Requirement: Fondos por pantalla

El sistema **MUST** mostrar un fondo diferente según la pantalla activa, definido en `opcionesJuego.pantallas`.

#### Scenario: Cambio de fondo

- **GIVEN** que la pantalla activa es `carrera`
- **WHEN** `juego/pagina` cambia a `pregunta`
- **THEN** el sistema **MUST** actualizar la imagen de fondo a la configurada para `pregunta`
- **AND** si no hay fondo configurado, **MUST** usar una imagen transparente de 1 píxel

### Requirement: Pantalla de inicio

El sistema **MUST** mostrar el logo del evento cuando la pantalla activa sea `inicio`.

#### Scenario: Bienvenida

- **GIVEN** que `juego/pagina` es `"inicio"`
- **WHEN** la pantalla se renderiza
- **THEN** el sistema **MUST** mostrar el logo centrado en pantalla completa

### Requirement: Pantalla de espera

El sistema **MUST** mostrar el QR de invitación y el tablero de jugadores registrados.

#### Scenario: Esperando jugadores

- **GIVEN** que `juego/pagina` es `"espera"`
- **AND** `urlJugadores` es `"/jugar.html"`
- **WHEN** hay jugadores registrados
- **THEN** el sistema **MUST** resolver `urlJugadores` contra `location.origin`
- **AND** **MUST** mostrar el QR apuntando a la URL absoluta resultante
- **AND** **MUST** mostrar una tabla con etiqueta, nombre, puntaje, respuesta y tiempo de cada jugador

#### Scenario: urlJugadores ya es absoluta

- **GIVEN** que `urlJugadores` es `"https://ejemplo.com/jugar.html"`
- **WHEN** se genera el QR
- **THEN** el sistema **MUST** usar la URL tal cual, sin modificarla

### Requirement: Pantalla de carrera

El sistema **MUST** mostrar los avatares de los jugadores sobre una pista y animar su posición según el puntaje.

#### Scenario: Carrera con avance

- **GIVEN** que `juego/pagina` es `"carrera"`
- **WHEN** un jugador tiene puntaje 2
- **THEN** el sistema **MUST** ubicar su avatar en la posición `avance-2` definida en CSS
- **AND** **MUST** reproducir una animación de correr durante el desplazamiento

### Requirement: Pantalla de pregunta

El sistema **MUST** mostrar el contenido de la pregunta, sus opciones etiquetadas como a, b, c y, opcionalmente, la respuesta correcta.

#### Scenario: Pregunta visible

- **GIVEN** que `juego/pagina` es `"pregunta"` y hay una pregunta activa
- **WHEN** la pantalla se renderiza
- **THEN** el sistema **MUST** mostrar el texto de la pregunta
- **AND** **MUST** listar las opciones con letras en minúscula
- **AND** **MUST** mostrar el cronómetro con el tiempo restante redondeado hacia arriba

#### Scenario: Respuesta revelada

- **GIVEN** que `juego/respuesta` no está vacío
- **WHEN** la pantalla de pregunta se renderiza
- **THEN** el sistema **MUST** mostrar un recuadro con el texto de la respuesta correcta

### Requirement: Pantalla de podio

El sistema **MUST** mostrar los jugadores ordenados por puntaje, con animación de confeti y sonido de celebración.

#### Scenario: Podio completo

- **GIVEN** que `juego/pagina` es `"podio"`
- **WHEN** hay 3 jugadores con puntajes distintos
- **THEN** el sistema **MUST** mostrar los avatares en posiciones de 1.°, 2.° y 3.° lugar
- **AND** **MUST** mostrar el nombre de cada uno en mayúsculas
- **AND** **MUST** lanzar confeti

### Requirement: Tablero de jugadores

El sistema **MUST** mostrar siempre el tablero de jugadores en las pantallas `espera`, `carrera` y `pregunta`.

#### Scenario: Tablero visible

- **GIVEN** que la pantalla activa es `espera` o `carrera`
- **WHEN** hay jugadores registrados
- **THEN** el sistema **MUST** renderizar el tablero con los datos actualizados

### Requirement: Ordenamiento del tablero

El sistema **MUST** ordenar el tablero por puntaje descendente y, en empate, por tiempo ascendente.

#### Scenario: Empate en puntaje

- **GIVEN** que dos jugadores tienen puntaje 2
- **AND** el jugador `B` tiene menor tiempo total acumulado
- **WHEN** se muestra el tablero
- **THEN** el jugador `B` **MUST** aparecer por encima del jugador `A`

## Notas técnicas

- El módulo se registra como `$aplicacion` en Alpine.
- `pagina` es un getter que lee `url.id`.
- `fondo` es un getter que usa `urlImagen(pantallas[pagina]?.fondo)`. Si el valor es `false`, `"false"`, `"null"`, `"undefined"`, vacío o no es string, devuelve `gif1px`.
- `logo` se renderiza mediante el getter `logoCompleto`, que usa `urlImagen(logo)` con el mismo comportamiento.
- `ganadores` ordena con `_.orderBy(jugadores, ['puntaje', 'tiempo'], ['desc', 'asc'])`.
- Los avatares usan clases CSS como `A`, `B`, `C`, `F`, `M`, `parado`, `corriendo` y `avance-0` … `avance-4`.
- El confeti usa `canvas-confetti` disparado desde `mostrarConfetti()`.
