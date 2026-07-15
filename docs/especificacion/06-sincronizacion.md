# Especificación — Sincronización con Firebase

## Propósito

Definir el contrato de datos entre los tres roles (pantalla, control y mando) a través de Firebase Realtime Database. Este documento es el "esqueleto" que mantiene unidos a todos los dispositivos.

> **Metáfora**: Firebase es como una pizarra compartida. Cada rol puede leer y escribir en secciones específicas; cuando alguien cambia algo, los demás ven el cambio.

## Nodo raíz

El sistema **MUST** usar como nodo raíz el valor de `evento` configurado en `opcionesJuego` (por defecto `"Elifarma"`).

### Scenario: Evento configurado

- **GIVEN** que `opcionesJuego.evento` es `"Elifarma"`
- **WHEN** cualquier módulo se conecta a Firebase
- **THEN** el sistema **MUST** leer y escribir bajo el nodo `"Elifarma"`

## Estructura de datos

```json
{
  "control": true,
  "juego": {
    "pagina": "inicio",
    "pregunta": {
      "numero": 1,
      "contenido": "¿QUÉ SABOR TIENE...?",
      "respuestas": ["FRAMBUESA", "FRESA", "PLÁTANO"],
      "correcta": 0
    },
    "respuesta": "FRAMBUESA",
    "tiempo": "5.200",
    "tiempoRestante": "9.800",
    "comando": "",
    "ganador": "A"
  },
  "jugadores": {
    "0": {
      "nombre": "Ana",
      "sexo": "F",
      "puntaje": 2,
      "respuesta": "",
      "tiempo": 0,
      "etiqueta": "A",
      "pagina": "espera",
      "estado": "parado",
      "gana": false
    },
    "1": { ... },
    "2": { ... }
  }
}
```

## Requisitos

### Requirement: Inicialización del nodo del evento

El sistema **MUST** crear el nodo del evento con una plantilla inicial si no existe.

#### Scenario: Evento inexistente

- **GIVEN** que el presentador abre `control.html`
- **WHEN** Firebase responde que el nodo del evento es nulo
- **THEN** el sistema **MUST** escribir la plantilla inicial en el nodo raíz

#### Scenario: Evento existente

- **GIVEN** que el nodo del evento ya existe
- **WHEN** el control se conecta
- **THEN** el sistema **MUST** conservar los datos existentes
- **AND** **MUST** actualizar `control: true`

### Requirement: Sincronización de jugadores

El sistema **MUST** mantener sincronizado el nodo `jugadores` entre pantalla, control y mandos.

#### Scenario: Nuevo jugador

- **GIVEN** que un mando crea un nodo en `jugadores/{id}`
- **WHEN** el control y la pantalla están escuchando
- **THEN** ambos **MUST** reflejar el nuevo jugador en menos de 2 segundos

### Requirement: Sincronización de la página del juego

El sistema **MUST** propagar cambios en `juego/pagina` a pantalla y mandos.

#### Scenario: Cambio de pantalla

- **GIVEN** que el presentador escribe `juego/pagina: "pregunta"`
- **WHEN** la pantalla y los mandos están escuchando
- **THEN** la pantalla pública **MUST** cambiar a la vista de pregunta
- **AND** los mandos **MUST** cambiar según `jugadores/{id}/pagina`

### Requirement: Sincronización de pregunta y respuesta

El sistema **MUST** propagar la pregunta activa y la respuesta revelada.

#### Scenario: Publicación de pregunta

- **GIVEN** que el control escribe `juego/pregunta`
- **WHEN** la pantalla y los mandos escuchan
- **THEN** ambos **MUST** renderizar la misma pregunta y opciones

#### Scenario: Revelación de respuesta

- **GIVEN** que el control escribe `juego/respuesta` con el texto correcto
- **WHEN** la pantalla y los mandos escuchan
- **THEN** ambos **MUST** mostrar la respuesta

### Requirement: Sincronización del temporizador

El sistema **MUST** propagar `juego/tiempo` y `juego/tiempoRestante`.

#### Scenario: Temporizador en marcha

- **GIVEN** que el control inicia el temporizador
- **WHEN** transcurren 2 segundos
- **THEN** la pantalla y los mandos **MUST** reflejar el tiempo actualizado

### Requirement: Comandos

El sistema **MAY** usar `juego/comando` para señales puntuales entre control y pantalla.

#### Scenario: Comando de inicio

- **GIVEN** que el control escribe `juego/comando: "inicio"`
- **WHEN** la pantalla lo recibe
- **THEN** la pantalla **SHOULD** reiniciar los avatares a `avance-0`

#### Scenario: Comando de avances

- **GIVEN** que el control escribe `juego/comando: "avances"`
- **WHEN** la pantalla lo recibe
- **THEN** la pantalla **SHOULD** actualizar las posiciones de los avatares

## Notas técnicas

- El cliente Firebase está en `js/util/firebase.js`.
- No hay autenticación ni reglas de seguridad en el cliente.
- `conectar(clave, objeto, propiedad)` usa `onValue` para copiar valores.
- `vigilar(clave, callback)` permite observadores personalizados.
- `actualizar(clave, valor)` usa `set` y sobrescribe el valor anterior.
- `agregar` con `number=true` genera ids secuenciales (`0`, `1`, `2`).
