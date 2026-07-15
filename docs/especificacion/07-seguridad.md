# Especificación — Seguridad y límites

## Propósito

Documentar los riesgos de seguridad, las limitaciones técnicas y las restricciones de diseño que cualquier modificación futura debe respetar o explicitamente abordar.

## Riesgos de seguridad

### Requirement: Protección de credenciales

El sistema **SHOULD** evitar propagar innecesariamente las credenciales de Firebase, aunque por naturaleza son públicas en el cliente.

#### Scenario: Credenciales en el cliente

- **GIVEN** que `js/util/firebase.js` contiene `apiKey`, `databaseURL`, etc.
- **WHEN** un usuario inspecciona el código
- **THEN** las credenciales **MAY** ser visibles
- **AND** el sistema **MUST NOT** almacenar en el repositorio claves adicionales de servicios privados

### Requirement: Prevención de XSS

El sistema **MUST** asegurar que el contenido de las preguntas provenga de una fuente confiable, dado que se renderiza con `x-html`.

#### Scenario: Pregunta con HTML

- **GIVEN** que una pregunta contiene etiquetas HTML
- **WHEN** se renderiza en pantalla o mando
- **THEN** el navegador **MUST** interpretar esas etiquetas
- **AND** el sistema **SHOULD** validar o sanitizar el banco de preguntas antes de publicarlo

### Requirement: Control de acceso a Firebase

El sistema **SHOULD** depender de las reglas de seguridad de Firebase Realtime Database para limitar escrituras no deseadas.

#### Scenario: Escritura no autorizada

- **GIVEN** que el sistema se despliega públicamente
- **WHEN** un usuario malintencionado intenta escribir en el nodo del evento
- **THEN** las reglas de Firebase **SHOULD** bloquear la operación

## Límites conocidos

### Requirement: Número máximo de jugadores

El sistema **MUST** soportar hasta 3 jugadores simultáneos.

#### Scenario: Límite de jugadores

- **GIVEN** que `maximoJugadores` es 3
- **WHEN** un cuarto jugador intenta registrarse
- **THEN** el sistema **MUST** rechazarlo mostrando la pantalla `no`

### Requirement: Límite visual de puntos

El sistema **MUST** representar visualmente puntajes de 0 a 4 en la carrera.

#### Scenario: Puntaje alto

- **GIVEN** que un jugador tiene 5 puntos
- **WHEN** se muestra la carrera
- **THEN** el sistema **SHOULD** mostrar el avatar en la posición máxima (`avance-4`)
- **AND** **MAY** requerir ajustes en CSS para representar más puntos

### Requirement: Dependencia de conectividad

El sistema **MUST** requerir conexión a Internet para funcionar.

#### Scenario: Sin conexión

- **GIVEN** que el dispositivo pierde la conexión a Internet
- **WHEN** intenta sincronizar con Firebase
- **THEN** el sistema **MAY** dejar de reflejar cambios
- **AND** **SHOULD** mostrar una indicación de desconexión en futuras versiones

### Requirement: Temporizador del presentador

El sistema **MUST** ejecutar el temporizador en el navegador del presentador.

#### Scenario: Cierre del control

- **GIVEN** que una pregunta está en curso
- **WHEN** el presentador cierra `control.html`
- **THEN** el temporizador **MAY** detenerse
- **AND** la evaluación **MAY** no ocurrir automáticamente

## Consideraciones de calidad

### Requirement: Ausencia de tests

El sistema actual **MAY** no contar con tests automatizados.

#### Scenario: Regresión

- **GIVEN** que se modifica un módulo
- **WHEN** no hay tests
- **THEN** el cambio **SHOULD** ser verificado manualmente en pantalla, control y mando

### Requirement: Archivos de respaldo

El sistema **SHOULD** mantener separados los archivos activos de los respaldos.

#### Scenario: Modificación accidental

- **GIVEN** que existen archivos `.bk`, `.bk2`, `.bk3` y `copy`
- **WHEN** se edita código
- **THEN** el desarrollador **MUST** confirmar que está editando el archivo activo
- **AND** **SHOULD** eliminar respaldos obsoletos tras validar con el cliente
