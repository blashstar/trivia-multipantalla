# Guía para agentes de código — Trivia Elifarma

Este documento describe el proyecto tal como está construido. Léelo antes de modificar cualquier archivo.

## 1. Resumen del proyecto

Aplicación web de trivia multijugador en tiempo real, desarrollada para eventos promocionales de Elifarma. Es **frontend puro** (HTML, CSS y JavaScript), sin backend propio. La sincronización entre la pantalla principal, el control del presentador y los mandos de los jugadores se realiza a través de **Firebase Realtime Database**.

El repositorio no incluye herramientas de build ni gestor de paquetes: todos los archivos se sirven estáticamente.

## 2. Estructura de archivos

```
├── index.html              # Pantalla principal del juego (proyector / TV)
├── control.html            # Panel del presentador / administrador
├── jugar.html              # Mando del jugador (alias del mando)
├── control copy.html       # Copia de respaldo del control con otra trivia
├── index.bk.html           # Backups de versiones anteriores
├── index___.html
├── notas.txt               # Fragmento de configuración de Firebase
├── css/
│   ├── base.css            # Estilos base compartidos por todos los módulos
│   ├── pantalla.css        # Estilos de la pantalla principal
│   └── mando.css           # Estilos del mando del jugador
├── js/
│   ├── index.js            # Punto de entrada de index.html
│   ├── control.js          # Punto de entrada de control.html
│   ├── mando.js            # Punto de entrada de jugar.html
│   ├── jugar.js            # Otro punto de entrada para el mando
│   ├── juego.js            # Módulo base heredado (no usado activamente)
│   ├── juego.bk2.js        # Backups del módulo base
│   ├── juego.bk3.js
│   ├── firebase.js         # Wrapper simple de Firebase (no usado actualmente)
│   ├── trivia/
│   │   ├── pantalla.js     # Lógica de Alpine para index.html
│   │   ├── control.js      # Lógica de Alpine para control.html
│   │   ├── mando.js        # Lógica de Alpine para jugar.html
│   │   ├── plantilla.js    # Plantilla inicial de datos en Firebase
│   │   └── plantilla.json  # Variante JSON de la plantilla
│   └── util/
│       ├── firebase.js     # Cliente de Firebase Realtime Database usado en producción
│       ├── firebase.bk.js  # Backups del cliente Firebase
│       ├── firebase.bk2.js
│       ├── url.js          # Utilidad de rutas basadas en hash (#/pagina)
│       ├── texto.js        # Funciones letra() y numero() (A↔0)
│       └── qr.js           # Generador de SVG QR para unirse al juego
├── img/                    # Fondos, logos, personajes y pistas
├── snd/celebra.mp3         # Efecto de sonido del podio
├── Dockerfile              # Imagen Docker para despliegue en Dokploy
├── docker-compose.yml      # Orquestación del servicio para Dokploy
├── entrypoint.sh           # Genera env.js e inicia Nginx
├── env.js.template         # Template de configuración de Firebase
├── .env.example            # Ejemplo de variables de entorno
├── .gitignore              # Archivos excluidos del repositorio Git
├── .dockerignore           # Archivos excluidos de la imagen Docker
└── trivia/.vscode/settings.json  # Palabras adicionales para el corrector
```

## 3. Stack tecnológico

- **HTML5** semántico con atributos de Alpine.js (`x-data`, `x-if`, `x-for`, etc.).
- **CSS3** plano, sin preprocesadores. Cada módulo carga `base.css` más su hoja específica.
- **JavaScript ES modules** cargados con `<script type="module">`.
- **Alpine.js 3.10.3** como framework reactivo (desde CDN).
- **Firebase JS SDK 9.9.1** con Realtime Database y Analytics.
- **Lodash ES 4.17.21** para utilidades de colecciones y manipulación.
- **GSAP 3.10.4** para animaciones de avance de personajes.
- **canvas-confetti 0.2.0-beta0** para el efecto de confeti en el podio.
- **UIkit 3.15.3** solo en `control.html` para la interfaz del presentador.
- **QR-ESM** para generar el código QR de invitación a los jugadores.

No hay `package.json`, `vite.config`, `webpack` ni ningún otro archivo de build.

## 4. Arquitectura y módulos

La aplicación tiene tres roles que se ejecutan en páginas distintas:

### 4.1 `index.html` — Pantalla
- Muestra el juego al público: inicio, espera, carrera, pregunta y podio.
- Recibe el estado desde Firebase (`juego/pagina`, `juego/pregunta`, `juego/respuesta`, `juego/tiempo`, `juego/tiempoRestante`).
- Muestra un tablero con los jugadores y un avance de personajes sobre una pista.
- Genera un QR para que los jugadores ingresen a `jugar.html`.

### 4.2 `control.html` — Control del presentador
- Interfaz de administración con UIkit.
- Permite cambiar de pantalla, mostrar preguntas, revelar respuestas y reiniciar el juego.
- Define el banco de preguntas en el archivo `preguntas.json`, que se importa como módulo ES y se fusiona en `opcionesJuego.preguntas`.
- Controla el temporizador de cada pregunta y evalúa quién respondió primero correctamente.

### 4.3 `jugar.html` / `jugar.js` — Mando del jugador
- Flujo de registro: inicio → selección de sexo → nombre → espera → pregunta → final.
- Se conecta a Firebase y se registra como jugador en `jugadores/{id}`.
- Recibe la página activa desde el nodo del jugador y muestra la pregunta actual.
- El primer jugador en responder correctamente gana un punto.

### 4.4 Sincronización
- Los tres módulos comparten el mismo proyecto de Firebase.
- Cada evento se almacena bajo una raíz con el nombre del evento (ej. `Elifarma`).
- Estructura típica de la base de datos:
  ```json
  {
    "control": true,
    "juego": {
      "pagina": "inicio",
      "pregunta": { ... },
      "respuesta": "",
      "tiempo": "0.000",
      "tiempoRestante": "0.000",
      "comando": "",
      "ganador": ""
    },
    "jugadores": {
      "0": { "nombre": "...", "sexo": "M", "puntaje": 0, "respuesta": "", "tiempo": 0, "etiqueta": "A", "pagina": "espera" },
      "1": { ... },
      "2": { ... }
    }
  }
  ```

## 5. Cómo ejecutar y probar

1. Sirve la carpeta raíz con cualquier servidor estático. Ejemplos:
   - Python: `python -m http.server 8080`
   - Node: `npx serve .`
   - VS Code: extensión Live Server.
2. Abre `http://localhost:8080/index.html` en una ventana (pantalla).
3. Abre `http://localhost:8080/control.html` en otra ventana (control).
4. Abre `http://localhost:8080/jugar.html` en dispositivos de jugadores.

> Importante: el acceso a Firebase requiere conexión a Internet y el proyecto configurado en `js/util/firebase.js`. Si las credenciales caducan o el proyecto se elimina, la aplicación no sincronizará.

## 6. Convenciones de código

- Idioma del código y comentarios: **español**.
- Los módulos principales de Alpine se encuentran en `js/trivia/` y se registran como `$aplicacion` en los puntos de entrada.
- Cada HTML define una variable global `opcionesJuego` (o `window.opcionesJuego`) que se fusiona con el objeto del módulo en `init()` mediante `Object.assign`.
- Los campos de estado son propiedades directas del objeto Alpine (`jugadores`, `pregunta`, `pagina`, etc.).
- Las rutas internas usan hash (`#/inicio`, `#/pregunta`). La utilidad `js/util/url.js` normaliza y formatea esas rutas.
- Las letras de opción se generan con `letra(id)` y se convierten a minúsculas en la interfaz.
- IDs de jugador: numéricos (`0`, `1`, `2`); su etiqueta visible es `A`, `B`, `C`.

## 7. Puntos clave para modificar

- **Banco de preguntas**: edita el archivo `preguntas.json` en la raíz del proyecto. Cada pregunta tiene:
  - `numero`: identificador numérico.
  - `contenido`: texto de la pregunta.
  - `respuestas`: arreglo de opciones.
  - `correcta`: índice (base 0) de la respuesta correcta.
- **Tiempo por pregunta**: cambia `segundos` en `opcionesJuego` de `control.html`.
- **Máximo de jugadores**: ajusta `maximoJugadores` en `js/trivia/pantalla.js` y `js/trivia/mando.js`.
- **Configuración general**: edita `config.json` (`evento`, `segundos`, `logo`, `urlJugadores`, `pantallas`, `imagenes`); todas las páginas lo importan.
- **Módulo de página**: edita `modulo` en `opcionesJuego` de cada HTML (`control`, `pantalla`, `mando`).
- **Estilos**: modifica `css/base.css` para cambios globales y `css/pantalla.css` / `css/mando.css` para cambios específicos.

## 8. Consideraciones de seguridad

- Las credenciales de Firebase (`apiKey`, `databaseURL`, etc.) ya **no están hardcodeadas** en el código fuente. Se inyectan en tiempo de ejecución mediante variables de entorno, generando el archivo `env.js` al iniciar el contenedor. No subas `env.js` ni archivos `.env` al repositorio.
- Los archivos `notas.txt`, `js/firebase.js` y los backups (`*.bk*`) aún contienen credenciales históricas; están excluidos del repositorio mediante `.gitignore` y no deben subirse.
- No hay autenticación ni reglas de seguridad implementadas en el código. Si se despliega públicamente, cualquiera puede escribir en el nodo del evento si las reglas de Firebase lo permiten.
- No se procesan datos sensibles, pero el contenido de las preguntas (`contenido`, `respuestas`) se renderiza con `x-html`. Asegúrate de que provenga de una fuente confiable para evitar XSS.

## 9. Backups y archivos no usados

El proyecto contiene varios archivos de respaldo que no forman parte del flujo activo:

- `index.bk.html`, `index___.html`
- `control copy.html`
- `js/juego.bk2.js`, `js/juego.bk3.js`
- `js/util/firebase.bk.js`, `js/util/firebase.bk2.js`
- `js/firebase.js` (wrapper sin las funciones de `util/firebase.js`)

Antes de borrarlos, confirma que el cliente no los necesita como referencia histórica.

## 10. Despliegue

No existe proceso de build ni CI/CD. Para publicar:

### Opción A: hosting estático tradicional

1. Sube todos los archivos de la carpeta raíz a un hosting estático (Firebase Hosting, Netlify, Vercel, servidor Apache/Nginx, etc.).
2. Asegúrate de que las rutas relativas (`css/...`, `js/...`, `img/...`) se resuelvan correctamente.
3. Actualiza `urlJugadores` en `config.json`. Puede ser una ruta relativa como `/jugar.html`; la pantalla la resolverá automáticamente contra el host actual. Solo usa una URL absoluta si el mando está en otro dominio.
4. Verifica que el proyecto de Firebase esté activo y las reglas de Realtime Database permitan lectura/escritura.

### Opción B: Docker y Dokploy

El proyecto incluye configuración lista para Docker:

- `Dockerfile`: usa `nginx:alpine`, instala `envsubst` y copia los archivos estáticos a `/usr/share/nginx/html`.
- `entrypoint.sh`: genera `env.js` desde `env.js.template` usando variables de entorno, y luego inicia Nginx.
- `docker-compose.yml`: define el servicio `trivia` expuesto en el puerto `80` y recibe las variables de entorno de Firebase.
- `.env.example`: lista las variables de entorno necesarias.
- `.dockerignore`: excluye backups, documentación, configuración de editores, credenciales y archivos de Docker del contexto de build.

Pasos para desplegar en Dokploy:

1. Asegúrate de que `urlJugadores` en `config.json` sea relativo (por ejemplo `/jugar.html`) para que funcione con el dominio asignado por Dokploy.
2. En Dokploy, crea una aplicación tipo "Docker Compose" o "Dockerfile" y apunta al repositorio.
3. Si usas Docker Compose, Dokploy detectará `docker-compose.yml`. Si usas Dockerfile, selecciona `Dockerfile` como origen.
4. Configura las variables de entorno en Dokploy con los valores de tu proyecto de Firebase:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_DATABASE_URL`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   - `FIREBASE_MEASUREMENT_ID`
5. Configura el dominio/puerto que Dokploy exponga. El contenedor escucha en el puerto `80`.
6. Verifica que el proyecto de Firebase esté activo y las reglas de Realtime Database permitan lectura/escritura.

Comandos locales de verificación:

```bash
# Construir la imagen
docker build -t trivia .

# Ejecutar localmente en http://localhost:8080
docker run -p 8080:80 trivia

# O con Docker Compose
docker compose up --build
```

## 11. Limitaciones conocidas

- Sin tests automatizados.
- Sin sistema de build ni linting.
- Sin manejo robusto de desconexiones ni reconexiones.
- El puntaje máximo visual en la carrera está limitado a 4 puntos (`avance-0` … `avance-4`) en CSS.
- El conteo de jugadores en el mando depende de `snapshot.size` de Firebase; si hay datos huérfanos, puede contar incorrectamente.
