# Especificación — Flujo de juego

## Propósito

Describir el ciclo de vida completo de una partida, desde que se abre el evento hasta que se muestra el podio. Este documento actúa como el "guion" que unen la pantalla, el control y los mandos.

> **Metáfora**: una partida es como una carrera de relevos. El presentador da la salida (pregunta), los jugadores corren (responden), se mide el tiempo y el primero en llegar correctamente avanza un puesto. Al final, los tres mejores suben al podio.

## Estados del juego

El juego puede encontrarse en una de las siguientes pantallas:

| Pantalla | Significado | Quién la activa |
|----------|-------------|-----------------|
| `#` (ninguna) | Pantalla en negro. | Presentador. |
| `inicio` | Logo de bienvenida. | Presentador. |
| `espera` | Muestra QR para unirse y tablero de jugadores. | Presentador (o automático al finalizar pregunta). |
| `carrera` | Muestra avatares sobre una pista. | Presentador. |
| `pregunta` | Muestra pregunta y opciones. | Presentador. |
| `podio` | Muestra ganadores finales. | Presentador. |

## Ciclo de una partida

```
inicio
  │
  ▼
espera ──► jugadores se registran
  │
  ▼
pregunta ──► jugadores responden ──► evaluación
  │
  ▼
carrera (opcional)
  │
  ▼
podio
```

## Requisitos

### Requirement: Secuencia inicial del evento

El sistema **MUST** iniciar la partida en la pantalla `inicio` tras crear el nodo del evento en Firebase.

#### Scenario: Evento nuevo

- **GIVEN** que el presentador abre `control.html` por primera vez para un evento
- **WHEN** el sistema termina de configurar Firebase
- **THEN** `juego/pagina` **MUST** ser `"inicio"`
- **AND** la pantalla pública **MUST** mostrar el logo de bienvenida

### Requirement: Fase de registro

El sistema **MUST** permitir que los jugadores se registren desde `jugar.html` mientras haya cupo y el evento no haya comenzado una pregunta.

#### Scenario: Registro exitoso

- **GIVEN** que hay 1 jugador registrado
- **WHEN** un segundo jugador completa nombre y sexo y pulsa continuar
- **THEN** el sistema **MUST** crear el nodo `jugadores/1` con `etiqueta: "B"`
- **AND** el jugador **MUST** ver la pantalla de espera

#### Scenario: Cupo lleno

- **GIVEN** que ya hay 3 jugadores registrados
- **WHEN** un cuarto jugador abre `jugar.html`
- **THEN** el sistema **MUST** mostrar la pantalla `no`
- **AND** **MUST** impedir que inicie el registro

### Requirement: Publicación de una pregunta

El sistema **MUST** permitir al presentador publicar una pregunta no utilizada, iniciando automáticamente un temporizador.

#### Scenario: Publicación normal

- **GIVEN** que hay jugadores registrados y el juego está en espera
- **WHEN** el presentador pulsa "Mostrar Pregunta"
- **THEN** el sistema **MUST** elegir una pregunta al azar del banco no usado
- **AND** **MUST** escribir `juego/pregunta` con la pregunta seleccionada
- **AND** **MUST** reiniciar `respuesta` y `tiempo` de cada jugador
- **AND** **MUST** iniciar el temporizador desde `segundos`

### Requirement: Respuesta de los jugadores

El sistema **MUST** permitir que cada jugador elija una única opción mientras el tiempo no haya terminado.

#### Scenario: Respuesta a tiempo

- **GIVEN** que la pregunta está visible y el tiempo restante es mayor a cero
- **WHEN** un jugador pulsa una opción
- **THEN** el sistema **MUST** guardar el índice de la opción y el tiempo transcurrido en `jugadores/{id}`
- **AND** **MUST** deshabilitar las demás opciones para ese jugador

#### Scenario: Tiempo agotado

- **GIVEN** que la pregunta está visible
- **WHEN** el temporizador llega a cero
- **THEN** el sistema **MUST** bloquear nuevas respuestas
- **AND** **MUST** evaluar las respuestas ya registradas

### Requirement: Evaluación de respuestas

El sistema **MUST** otorgar 1 punto al primer jugador que responda correctamente, usando el tiempo como desempate.

#### Scenario: Un ganador por pregunta

- **GIVEN** que dos jugadores respondieron correctamente
- **AND** el jugador `A` respondió en 3.2 segundos
- **AND** el jugador `B` respondió en 4.1 segundos
- **WHEN** finaliza el tiempo o todos respondieron
- **THEN** el sistema **MUST** sumar 1 punto al jugador `A`
- **AND** **MUST** actualizar `juego/ganador` con la etiqueta del jugador con mayor puntaje acumulado

#### Scenario: Nadie acierta

- **GIVEN** que ningún jugador respondió correctamente
- **WHEN** finaliza el tiempo
- **THEN** el sistema **MUST** no sumar puntos a nadie
- **AND** **MUST** mantener el puntaje anterior

### Requirement: Revelación de respuesta

El sistema **MUST** permitir al presentador revelar u ocultar la respuesta correcta en la pantalla pública.

#### Scenario: Revelar respuesta

- **GIVEN** que una pregunta está activa
- **WHEN** el presentador pulsa "Mostrar Respuesta"
- **THEN** el sistema **MUST** escribir en `juego/respuesta` el texto de la opción correcta
- **AND** la pantalla pública **MUST** mostrar ese texto

#### Scenario: Ocultar respuesta

- **GIVEN** que la respuesta está visible
- **WHEN** el presentador pulsa "Ocultar Respuesta"
- **THEN** el sistema **MUST** escribir en `juego/respuesta` una cadena vacía
- **AND** la pantalla pública **MUST** dejar de mostrar el texto

### Requirement: Carrera

El sistema **SHOULD** mostrar una carrera animada donde la posición de cada avatar refleje su puntaje acumulado.

#### Scenario: Avance tras acierto

- **GIVEN** que un jugador acaba de sumar un punto
- **WHEN** el presentador muestra la pantalla `carrera`
- **THEN** el avatar de ese jugador **MUST** moverse a la posición correspondiente a su puntaje

### Requirement: Podio final

El sistema **MUST** mostrar los jugadores ordenados por puntaje (y tiempo como desempate) cuando el presentador active la pantalla `podio`.

#### Scenario: Fin del evento

- **GIVEN** que el presentador pulsa "Podio"
- **WHEN** la pantalla pública cambia a `podio`
- **THEN** el sistema **MUST** mostrar los 3 jugadores en orden de puntaje
- **AND** **MUST** reproducir el sonido de celebración
- **AND** **MUST** lanzar el efecto de confeti
- **AND** los mandos de los jugadores **MUST** mostrar la pantalla `final`

### Requirement: Reinicio del juego

El sistema **MUST** permitir al presentador reiniciar el evento, limpiando jugadores, puntajes y preguntas usadas.

#### Scenario: Reinicio completo

- **GIVEN** que una partida ha terminado
- **WHEN** el presentador pulsa "Reiniciar Juego"
- **THEN** el sistema **MUST** limpiar `jugadores`, `juego/pregunta`, `juego/ganador` y `juego/comando`
- **AND** **MUST** volver a la pantalla `inicio`
- **AND** **SHOULD** recargar la página del control
