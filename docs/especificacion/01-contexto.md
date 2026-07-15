# Especificación — Contexto

## Propósito

Este documento describe el entorno en el que opera la Trivia Elifarma: quiénes interactúan con ella, qué se espera de cada interacción y qué restricciones técnicas condicionan el diseño.

## Actores

| Actor | Descripción | Dispositivo típico |
|-------|-------------|---------------------|
| **Presentador** | Persona que dirige el evento, elige preguntas y controla el flujo. | Computadora o tablet con `control.html`. |
| **Público** | Asistentes al evento que observan la competencia. | Pantalla, proyector o TV con `index.html`. |
| **Jugador** | Participante que responde desde su celular. | Celular con `jugar.html`. |
| **Firebase** | Servicio de terceros que actúa como "sala común" de sincronización. | Infraestructura externa. |

## Objetivos del negocio

1. Generar engagement en eventos promocionales de Elifarma.
2. Permitir que varios jugadores compitan en tiempo real respondiendo preguntas de producto.
3. Ofrecer una experiencia visual atractiva (carrera, podio, confeti) sin requerir instalación de apps.
4. Facilitar la configuración del evento cambiando solo unas pocas variables en los archivos HTML.

## Restricciones técnicas

- El sistema **MUST** funcionar como frontend puro, sin backend propio.
- El sistema **MUST** usar Firebase Realtime Database como único mecanismo de sincronización.
- El sistema **MUST** poder servirse desde cualquier hosting estático.
- No se permite proceso de build: los archivos HTML, CSS y JS se sirven tal cual.
- El número máximo de jugadores simultáneos está fijado en 3.

## Alcance

### Dentro del alcance

- Registro de hasta 3 jugadores por evento.
- Banco de preguntas configurable en `preguntas.json` y usado por `control.html`.
- Temporizador por pregunta.
- Evaluación de respuestas y asignación de puntos.
- Visualización de carrera, pregunta y podio.
- Generación de QR para unirse al juego.

### Fuera del alcance (actual)

- Autenticación de jugadores.
- Panel de administración con múltiples presentadores.
- Persistencia histórica de partidas.
- Estadísticas de eventos pasados.
- Soporte para más de 3 jugadores sin cambios en CSS y lógica.

## Escenarios de negocio

### Scenario: Apertura de un evento

- **GIVEN** que el presentador abre `control.html` y el nodo del evento no existe en Firebase
- **WHEN** el sistema inicializa la conexión
- **THEN** el sistema **MUST** crear el nodo del evento con la plantilla inicial
- **AND** el sistema **MUST** marcar `control: true`

### Scenario: Un jugador se une al evento

- **GIVEN** que el evento está activo y hay menos de 3 jugadores registrados
- **WHEN** un jugador abre `jugar.html`, elige sexo, escribe su nombre y se registra
- **THEN** el sistema **MUST** asignarle un id numérico, una etiqueta (`A`, `B` o `C`) y mostrarlo en la pantalla de espera

### Scenario: Inicio de una ronda de preguntas

- **GIVEN** que hay al menos un jugador registrado
- **WHEN** el presentador pulsa "Mostrar Pregunta"
- **THEN** el sistema **MUST** publicar una pregunta no usada, iniciar el temporizador y cambiar la vista de todos los dispositivos a la pregunta
