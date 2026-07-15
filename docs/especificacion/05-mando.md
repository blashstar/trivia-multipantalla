# Especificación — Mando del jugador (`jugar.html`)

## Propósito

Definir el comportamiento del mando que usa cada jugador para registrarse y responder. El mando es la interfaz más cercana al participante del evento.

## Alcance

- Entrada: `jugar.html` con `js/trivia/mando.js`.
- Responsabilidad: registrar jugadores, mostrar la pregunta, capturar respuestas y reflejar el estado personal del jugador.

## Requisitos

### Requirement: Inicialización del mando

El sistema **MUST** cargar la configuración del evento (que combina opciones inline con `evento` importado desde `config.json`), interpretar la URL actual y conectar los datos globales del juego.

#### Scenario: Mando nuevo

- **GIVEN** que `config.json` existe junto a `jugar.html`
- **WHEN** se abre `jugar.html`
- **THEN** el sistema **MUST** cargar `config.json` con `fetch()` dentro de un módulo ES
- **AND** **MUST** construir `window.opcionesJuego` combinando las opciones inline con `config`
- **AND** **MUST** aplicar `window.opcionesJuego`
- **AND** **MUST** interpretar el hash de la URL
- **AND** **MUST** sincronizar `juego/pregunta`, `juego/respuesta`, `juego/tiempo` y `juego/tiempoRestante`

#### Scenario: config.json no disponible

- **GIVEN** que `config.json` no se puede cargar con `fetch`
- **WHEN** se abre `jugar.html`
- **THEN** el sistema **MUST** usar el objeto `opcionesJuego` inline como fallback
- **AND** **MUST** registrar el error en la consola

### Requirement: Control de cupos

El sistema **MUST** impedir que un cuarto jugador se registre.

#### Scenario: Cupo disponible

- **GIVEN** que hay 1 jugador registrado
- **WHEN** un nuevo jugador abre `jugar.html`
- **THEN** el sistema **MUST** mostrar la pantalla `inicio`

#### Scenario: Cupo lleno

- **GIVEN** que hay 3 jugadores registrados
- **WHEN** un nuevo jugador abre `jugar.html`
- **THEN** el sistema **MUST** mostrar la pantalla `no`
- **AND** **MUST** impedir el registro

#### Scenario: Liberación de cupo

- **GIVEN** que el cupo estaba lleno
- **WHEN** un jugador se desconecta y quedan 2 jugadores
- **THEN** el sistema **MUST** permitir que un nuevo jugador vea la pantalla `inicio`

### Requirement: Flujo de registro

El sistema **MUST** guiar al jugador a través de las pantallas `inicio`, `sexo`, `nombre` y `espera`.

#### Scenario: Registro completo

- **GIVEN** que hay cupo disponible
- **WHEN** el jugador pulsa "Iniciar", elige sexo, escribe un nombre de al menos 3 caracteres y pulsa "Continuar"
- **THEN** el sistema **MUST** crear el jugador en Firebase
- **AND** **MUST** asignarle una etiqueta (`A`, `B` o `C`)
- **AND** **MUST** mostrar la pantalla `espera`

#### Scenario: Nombre muy corto

- **GIVEN** que el jugador está en la pantalla `nombre`
- **WHEN** escribe menos de 3 caracteres
- **THEN** el sistema **MUST** deshabilitar el botón "Continuar"

### Requirement: Sincronización de página personal

El sistema **MUST** cambiar la vista del jugador según el campo `jugadores/{id}/pagina` en Firebase.

#### Scenario: El presentador muestra una pregunta

- **GIVEN** que el jugador está en `espera`
- **WHEN** el presentador publica una pregunta
- **THEN** el sistema **MUST** cambiar la vista del jugador a `pregunta`
- **AND** **MUST** limpiar la respuesta previa y el tiempo de respuesta local

#### Scenario: El presentador muestra el podio

- **GIVEN** que el jugador está en `pregunta`
- **WHEN** el presentador cambia a `podio`
- **THEN** el sistema **MUST** cambiar la vista del jugador a `final`

### Requirement: Respuesta del jugador

El sistema **MUST** permitir al jugador seleccionar una opción y guardar su respuesta junto con el tiempo transcurrido.

#### Scenario: Responder a tiempo

- **GIVEN** que la pregunta está visible y `tiempo > 0`
- **WHEN** el jugador pulsa una opción
- **THEN** el sistema **MUST** guardar el índice de la opción en `jugadores/{id}/respuesta`
- **AND** **MUST** guardar el tiempo en `jugadores/{id}/tiempo`
- **AND** **MUST** mostrar visualmente cuál opción eligió

#### Scenario: Intentar responder dos veces

- **GIVEN** que el jugador ya respondió
- **WHEN** intenta pulsar otra opción
- **THEN** el sistema **MUST** ignorar la nueva selección
- **AND** **MUST** mantener deshabilitadas las demás opciones

#### Scenario: Tiempo agotado

- **GIVEN** que el tiempo llegó a cero
- **WHEN** el jugador intenta pulsar una opción
- **THEN** el sistema **MUST** ignorar la pulsación

### Requirement: Retroalimentación visual

El sistema **SHOULD** mostrar al jugador su propia respuesta y el tiempo que tardó.

#### Scenario: Respuesta registrada

- **GIVEN** que el jugador ya respondió
- **WHEN** la respuesta se guarda
- **THEN** el sistema **MUST** mostrar un mensaje con la letra elegida y el tiempo en segundos

### Requirement: Determinación de ganador en el mando

El sistema **MUST** indicar en el mando si el jugador ganó el evento.

#### Scenario: Jugador ganador

- **GIVEN** que el evento terminó
- **AND** `juego/ganador` coincide con la etiqueta del jugador
- **WHEN** el mando muestra la pantalla `final`
- **THEN** el sistema **MUST** mostrar el mensaje "Ganaste"

#### Scenario: Jugador no ganador

- **GIVEN** que el evento terminó
- **AND** `juego/ganador` no coincide con la etiqueta del jugador
- **WHEN** el mando muestra la pantalla `final`
- **THEN** el sistema **MUST** mostrar el mensaje "Juego Finalizado"

### Requirement: Manejo de desconexión

El sistema **SHOULD** detectar si el nodo del jugador desaparece de Firebase.

#### Scenario: Jugador eliminado

- **GIVEN** que el jugador está registrado
- **WHEN** su nodo `jugadores/{id}` desaparece
- **THEN** el sistema **MUST** limpiar `jugador`, `sexo` y `nombre`
- **AND** **SHOULD** permitir que el jugador vuelva a registrarse si hay cupo

## Notas técnicas

- El módulo se registra como `$aplicacion` en Alpine.
- El id del jugador se calcula como `snapshot.size` del nodo `jugadores` al momento de registrar.
- La etiqueta se obtiene con `letra(item.key)`.
- `registrable` depende de `firebase.activo && jugadores < maximoJugadores`.
- La navegación interna del mando sin jugador registrado usa `url.navegar`; con jugador registrado, escribe en `jugadores/{id}/pagina`.
- `deshabilitada(id)` devuelve true si `restante == 0`, ya se respondió otra opción, o el id no es la respuesta actual.
- Las imágenes del mando (`imagenes.fondo`, `imagenes.femenino`, `imagenes.masculino`) se renderizan mediante el método `imagen(clave)`, que usa `urlImagen(...)` para devolver `gif1px` cuando el valor es `false`, `"false"`, `"null"`, `"undefined"`, vacío o no es string.
