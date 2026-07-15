# Especificación — Interfaces visuales y recursos

## Propósito

Definir los contratos visuales del sistema: estilos CSS, recursos multimedia y convenciones de diseño que deben respetarse.

## Stack visual

| Capa | Archivo / Fuente |
|------|------------------|
| Reset CSS | sanitize.css 13.0.0 (CDN) |
| Estilos base | `css/base.css` |
| Estilos de pantalla | `css/pantalla.css` |
| Estilos de mando | `css/mando.css` |
| Framework UI del control | UIkit 3.15.3 (CDN) |
| Tipografía | Open Sans (Google Fonts) |

## Requisitos

### Requirement: Estructura base de la aplicación

El sistema **MUST** usar `#aplicacion` como contenedor principal con una cuadrícula de una sola celda que ocupe toda la ventana.

#### Scenario: Renderizado base

- **GIVEN** que cualquier HTML carga `css/base.css`
- **WHEN** se renderiza la página
- **THEN** el contenedor `#aplicacion` **MUST** ocupar el 100% del ancho y el alto de la ventana

### Requirement: Fondos

El sistema **MUST** mostrar una imagen de fondo a pantalla completa usando `object-fit: cover`.

#### Scenario: Fondo adaptable

- **GIVEN** que hay un fondo configurado
- **WHEN** se cambia el tamaño de la ventana
- **THEN** el fondo **MUST** cubrir toda el área visible sin deformarse

### Requirement: Encabezado en pantalla

El sistema **MUST** mostrar un encabezado blanco con el logo del evento en las pantallas `carrera`, `pregunta` y `podio`.

#### Scenario: Encabezado visible

- **GIVEN** que la pantalla activa es `pregunta`
- **WHEN** se renderiza
- **THEN** el sistema **MUST** mostrar el encabezado con el logo configurado

### Requirement: Tablero de jugadores

El sistema **MUST** renderizar el tablero como una cuadrícula CSS con filas fijas para hasta 3 jugadores.

#### Scenario: Tablero con 3 jugadores

- **GIVEN** que hay 3 jugadores registrados
- **WHEN** se muestra el tablero
- **THEN** el sistema **MUST** mostrar una fila por jugador con sus datos

### Requirement: Avatares de la carrera

El sistema **MUST** usar imágenes de sprite para los avatares masculino y femenino, con animación de correr.

#### Scenario: Avatar femenino corriendo

- **GIVEN** que una jugadora tiene sexo `F`
- **WHEN** su avatar avanza
- **THEN** el sistema **MUST** mostrar la imagen `img/personajes/mujer_corriendo.png`
- **AND** **MUST** animar el sprite con 10 pasos

#### Scenario: Avatar masculino corriendo

- **GIVEN** que un jugador tiene sexo `M`
- **WHEN** su avatar avanza
- **THEN** el sistema **MUST** mostrar la imagen `img/personajes/hombre_corriendo.png`
- **AND** **MUST** animar el sprite con 9 pasos

### Requirement: Posiciones del podio

El sistema **MUST** ubicar a los jugadores en posiciones fijas del podio según su orden.

#### Scenario: Primer lugar

- **GIVEN** que el jugador `A` tiene el mayor puntaje
- **WHEN** se muestra el podio
- **THEN** el sistema **MUST** ubicar al jugador `A` en la posición central superior (`puesto-1`)

### Requirement: Estilos del mando

El sistema **MUST** usar una paleta de colores consistente en el mando: naranja `#DD6126` para botones y acentos, gris plateado para fondos secundarios.

#### Scenario: Botón primario

- **GIVEN** que un botón es acción principal en el mando
- **WHEN** se renderiza
- **THEN** el sistema **MUST** mostrar fondo `#DD6126`, texto blanco y bordes redondeados

### Requirement: Opciones de respuesta

El sistema **MUST** mostrar las opciones de respuesta como botones con una letra circular y el texto al lado.

#### Scenario: Opción en mando

- **GIVEN** que hay una pregunta con 3 opciones
- **WHEN** se renderiza en el mando
- **THEN** el sistema **MUST** mostrar cada opción con una letra (`a`, `b`, `c`)
- **AND** **MUST** resaltar la opción seleccionada

## Recursos multimedia

| Recurso | Ubicación | Uso |
|---------|-----------|-----|
| Logo principal | `img/logo.png`, `img/logo_only.png` | Pantalla de inicio y encabezado |
| Fondos | `img/fondo.png`, `img/fondo_carrera.png`, `img/fondo_pregunta.png`, `img/fondo_podio.png` | Fondos por pantalla |
| Pista | `img/pista.png` | Pantalla de carrera |
| Podio | `img/podio.png` | Pantalla de podio |
| Avatares corriendo | `img/personajes/mujer_corriendo.png`, `img/personajes/hombre_corriendo.png` | Carrera |
| Avatares en podio | `img/personajes/mujer-podio.svg`, `img/personajes/hombre-podio.svg` | Podio |
| Sonido | `snd/celebra.mp3` | Celebración en podio |
| Marca | `img/stringnet.svg` | Esquina inferior izquierda |

## Notas técnicas

- `css/base.css` define la cuadrícula base, el encabezado y el fondo.
- `css/pantalla.css` usa clases como `jugador0`, `jugador1`, `jugador2`, `A`, `B`, `C`, `avance-0` … `avance-4`.
- `css/mando.css` define estilos específicos para el flujo de registro y la pregunta del jugador.
- Las letras de opción se generan dinámicamente con `letra(id).toLowerCase()`.
