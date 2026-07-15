# Especificación — Panel del presentador (`control.html`)

## Propósito

Definir el comportamiento del panel desde el cual el presentador dirige el evento: cambio de pantallas, gestión del banco de preguntas, temporizador, evaluación y reinicio.

## Alcance

- Entrada: `control.html` con `js/trivia/control.js`.
- Responsabilidad: orquestar el flujo del juego y publicar estado en Firebase.
- No es responsable de la renderización visual del público ni de los mandos.

## Requisitos

### Requirement: Inicialización del control

El sistema **MUST** cargar las opciones generales y visuales desde `config.json`, el banco de preguntas desde `preguntas.json`, fusionarlos en `opcionesJuego`, conectar el estado de los jugadores y marcar el control como activo.

#### Scenario: Control inicia sesión

- **GIVEN** que `config.json` y `preguntas.json` existen junto a `control.html`
- **WHEN** se abre `control.html`
- **THEN** el sistema **MUST** importar `config.json` y `preguntas.json` como módulos ES
- **AND** **MUST** construir `window.opcionesJuego` combinando ambos
- **AND** **MUST** aplicar `opcionesJuego` al módulo de control
- **AND** **MUST** configurar Firebase con la plantilla inicial
- **AND** **MUST** escribir `control: true`
- **AND** **MUST** sincronizar el nodo `jugadores`

#### Scenario: Archivos JSON no disponibles

- **GIVEN** que `config.json` o `preguntas.json` no se pueden cargar
- **WHEN** se abre `control.html`
- **THEN** el sistema **MUST** mantener el objeto `opcionesJuego` fallback definido inline
- **AND** **MUST** permitir que el control arranque, aunque sin preguntas disponibles

### Requirement: Cambio de pantalla pública

El sistema **MUST** permitir al presentador cambiar la pantalla que ven el público y los jugadores.

#### Scenario: Cambiar a espera

- **GIVEN** que el presentador está en el panel de control
- **WHEN** pulsa el botón "Espera"
- **THEN** el sistema **MUST** escribir `juego/pagina: "espera"`
- **AND** **MUST** escribir `jugadores/{id}/pagina: "espera"` para cada jugador

#### Scenario: Cambiar a podio

- **GIVEN** que el presentador está en el panel de control
- **WHEN** pulsa el botón "Podio"
- **THEN** el sistema **MUST** escribir `juego/pagina: "podio"`
- **AND** **MUST** escribir `jugadores/{id}/pagina: "final"` para cada jugador
- **AND** **MUST** reproducir `snd/celebra.mp3`

### Requirement: Selección de pregunta

El sistema **MUST** elegir una pregunta al azar entre las que aún no se han usado en la partida actual.

#### Scenario: Primera pregunta

- **GIVEN** que no se ha mostrado ninguna pregunta
- **WHEN** el presentador pulsa "Mostrar Pregunta"
- **THEN** el sistema **MUST** elegir una pregunta aleatoria del banco completo
- **AND** **MUST** agregar su `numero` a la lista de utilizadas

#### Scenario: Segunda pregunta

- **GIVEN** que ya se mostró la pregunta con `numero: 5`
- **WHEN** el presentador pulsa "Mostrar Pregunta"
- **THEN** el sistema **MUST** excluir la pregunta 5 de la selección
- **AND** **MUST** elegir entre las restantes

### Requirement: Publicación de pregunta

El sistema **MUST** publicar la pregunta seleccionada en Firebase, reiniciar las respuestas de los jugadores e iniciar el temporizador.

#### Scenario: Publicar pregunta

- **GIVEN** que el presentador pulsa "Mostrar Pregunta"
- **WHEN** se selecciona una pregunta disponible
- **THEN** el sistema **MUST** escribir `juego/pregunta` con la pregunta
- **AND** **MUST** escribir `juego/respuesta` como cadena vacía
- **AND** **MUST** escribir `juego/pagina: "pregunta"`
- **AND** **MUST** escribir `jugadores/{id}/pagina: "pregunta"` para cada jugador
- **AND** **MUST** reiniciar `respuesta` y `tiempo` de cada jugador
- **AND** **MUST** iniciar el conteo regresivo desde `segundos`

### Requirement: Temporizador

El sistema **MUST** ejecutar un conteo regresivo de `segundos` y publicar el tiempo transcurrido y el tiempo restante en Firebase.

#### Scenario: Conteo normal

- **GIVEN** que una pregunta fue publicada con `segundos: 15`
- **WHEN** transcurren 5 segundos
- **THEN** el sistema **MUST** haber escrito `juego/tiempo` cercano a `"5.000"`
- **AND** `juego/tiempoRestante` cercano a `"10.000"`

#### Scenario: Todos responden antes del tiempo

- **GIVEN** que una pregunta está activa
- **WHEN** todos los jugadores registrados han respondido
- **THEN** el sistema **MUST** detener el temporizador
- **AND** **MUST** ejecutar `evaluarRespuestas`

#### Scenario: Tiempo agotado

- **GIVEN** que una pregunta está activa
- **WHEN** el contador llega a cero
- **THEN** el sistema **MUST** detener el temporizador
- **AND** **MUST** ejecutar `evaluarRespuestas`

### Requirement: Revelar y ocultar respuesta

El sistema **MUST** permitir al presentador mostrar u ocultar la respuesta correcta.

#### Scenario: Revelar

- **GIVEN** que hay una pregunta activa
- **WHEN** el presentador pulsa "Mostrar Respuesta"
- **THEN** el sistema **MUST** escribir `juego/respuesta` con el texto de la opción correcta

#### Scenario: Ocultar

- **GIVEN** que la respuesta está visible
- **WHEN** el presentador pulsa "Ocultar Respuesta"
- **THEN** el sistema **MUST** escribir `juego/respuesta` como cadena vacía

### Requirement: Evaluación de respuestas

El sistema **MUST** otorgar un punto al primer jugador que responda correctamente y actualizar el ganador general.

#### Scenario: Ganador por velocidad

- **GIVEN** que los jugadores `A` y `B` respondieron correctamente
- **AND** `A` fue más rápido
- **WHEN** se ejecuta la evaluación
- **THEN** el sistema **MUST** incrementar en 1 el puntaje de `A`
- **AND** **MUST** actualizar `juego/ganador` con la etiqueta del jugador líder

#### Scenario: Sin respuestas correctas

- **GIVEN** que nadie respondió correctamente
- **WHEN** se ejecuta la evaluación
- **THEN** el sistema **MUST** no modificar ningún puntaje

### Requirement: Listado de respuestas en el control

El sistema **MUST** mostrar en el panel las respuestas registradas, ordenadas por tiempo.

#### Scenario: Panel de respuestas

- **GIVEN** que los jugadores han respondido
- **WHEN** el presentador observa la pestaña "Juego"
- **THEN** el sistema **MUST** listar etiqueta, nombre, letra de respuesta y tiempo de cada jugador que haya respondido

### Requirement: Reinicio del juego

El sistema **MUST** permitir al presentador reiniciar completamente el evento.

#### Scenario: Reinicio

- **GIVEN** que una partida ha finalizado
- **WHEN** el presentador pulsa "Reiniciar Juego"
- **THEN** el sistema **MUST** limpiar `jugadores`, `juego/pregunta`, `juego/ganador` y `juego/comando`
- **AND** **MUST** volver a `juego/pagina: "inicio"`
- **AND** **SHOULD** recargar la página del control

## Notas técnicas

- El banco de preguntas se define en `preguntas.json` y se fusiona en `opcionesJuego.preguntas` al cargar `control.html`.
- `config.json` centraliza `evento`, `segundos`, `logo`, `urlJugadores`, `pantallas` e `imagenes`.
- `modulo` se define inline en cada HTML porque varía por página (`control`, `pantalla`, `mando`).
- Los JSON se cargan con `fetch()` dentro de un módulo ES; una vez listos, se importa dinámicamente el punto de entrada de la página. Esto evita depender de import assertions y garantiza el orden de inicialización.
- Se mantiene un objeto fallback inline en cada HTML para que la página no quede sin datos si los JSON no cargan.
- `disponibles` se calcula como `preguntas` cuyo `numero` no está en `utilizadas`.
- El temporizador usa `_.throttle` con 100 ms de intervalo.
- `tiempo` y `tiempoRestante` se publican como cadenas con 3 decimales.
- `evaluarRespuestas` filtra jugadores con `respuesta === pregunta.correcta` y ordena por `tiempo` ascendente.
