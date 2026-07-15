# Léxico del proyecto — Trivia Elifarma

Este documento define los términos, abreviaturas y convenciones usados en la documentación y en el código.

## Términos del negocio

| Término | Significado |
|---------|-------------|
| **Evento** | Instancia de una trivia. Corresponde al nodo raíz en Firebase (ej. `"Elifarma"`). |
| **Partida** | Una sesión completa desde el inicio hasta el podio. |
| **Ronda** | Una pregunta individual dentro de una partida. |
| **Banco de preguntas** | Conjunto de preguntas configuradas en `preguntas.json` y usadas por `control.html`. |
| **Presentador** | Persona que dirige el evento usando `control.html`. |
| **Pantalla** | Dispositivo que muestra el juego al público usando `index.html`. |
| **Mando** | Dispositivo del jugador usando `jugar.html`. |
| **Jugador** | Participante registrado en el nodo `jugadores/{id}`. |

## Términos técnicos

| Término | Significado |
|---------|-------------|
| **Alpine.js** | Framework reactivo usado para el estado y la UI. |
| **Firebase Realtime Database** | Base de datos en la nube que sincroniza datos en tiempo real. |
| **Hash URL** | Ruta interna basada en el fragmento de la URL (`#/inicio`). |
| **Getter** | Función que se comporta como una propiedad de solo lectura en JavaScript. |
| **Módulo ES** | Archivo JavaScript cargado con `<script type="module">`. |
| **Plantilla** | Estructura inicial de datos usada para crear un evento nuevo en Firebase. |
| **Snapshot** | Captura de un valor de Firebase en un instante dado. |
| **Throttle** | Técnica para limitar la frecuencia de ejecución de una función. |

## Convenciones de código

| Convención | Descripción |
|------------|-------------|
| **Idioma** | Código y comentarios en español. |
| **Variables globales de configuración** | `opcionesJuego` en cada HTML; en el mando se expone como `window.opcionesJuego`. |
| **Registro de módulos Alpine** | Los módulos se registran como `$aplicacion`. |
| **Etiquetas de jugador** | Letras `A`, `B`, `C` correspondientes a ids numéricos `0`, `1`, `2`. |
| **Letras de opción** | Minúsculas `a`, `b`, `c` generadas desde índices `0`, `1`, `2`. |

## Abreviaturas

| Abreviatura | Significado |
|-------------|-------------|
| **CSS** | Cascading Style Sheets |
| **HTML** | HyperText Markup Language |
| **JS** | JavaScript |
| **QR** | Quick Response (código de respuesta rápida) |
| **CDN** | Content Delivery Network |
| **SDK** | Software Development Kit |
| **UI** | User Interface |
| **XSS** | Cross-Site Scripting |
