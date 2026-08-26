# Especificación de Migración — SvelteKit + CouchDB + Centrifugo

## 1. Objetivo

Migrar la Trivia Elifarma de una aplicación frontend estática con Alpine.js y Firebase a una arquitectura moderna con **SvelteKit** como framework, **CouchDB** para persistencia de estado y **Centrifugo** para mensajería en tiempo real.

### 1.1 Motivación

| Problema actual | Solución propuesta |
|-----------------|-------------------|
| Alpine.js no escala; lógica dispersa en HTML | SvelteKit con componentes tipados y estado reactivo |
| Firebase como dependencia externa propietaria | CouchDB (self-hosted) + Centrifugo (self-hosted) |
| Sin backend propio; toda la lógica vive en el cliente | Backend Node.js con SvelteKit endpoints |
| Temporizador en el cliente (impreciso) | Temporizador server-side authoritative |
| Sin autenticación ni control de acceso | Tokens JWT para Centrifugo + roles en CouchDB |
| Sin persistencia de historial | CouchDB almacena cada sesión, ronda y resultado |
| Sin tests | SvelteKit soporta Vitest nativamente |
| Sin build | SvelteKit incluye Vite con tree-shaking, code-splitting y SSR |

---

## 2. Arquitectura Propuesta

### 2.1 Diagrama general

```
┌─────────────────────────────────────────────────────────────┐
│                      SvelteKit App                          │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Pantalla │  │ Control  │  │  Mando   │                  │
│  │  /juego  │  │ /control │  │ /jugar   │                  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
│       │              │              │                        │
│       └──────────────┼──────────────┘                        │
│                      │                                      │
│              ┌───────┴───────┐                              │
│              │  SvelteKit    │                              │
│              │  Server API   │                              │
│              │  (endpoints)  │                              │
│              └───┬───────┬───┘                              │
│                  │       │                                  │
└──────────────────┼───────┼──────────────────────────────────┘
                   │       │
          ┌────────┴──┐ ┌─┴──────────┐
          │  CouchDB  │ │ Centrifugo │
          │           │ │            │
          │ - Estado  │ │ - Pub/Sub  │
          │ - Historial│ │ - Presence │
          │ - Config  │ │ - RPC      │
          └───────────┘ └────────────┘
```

### 2.2 Responsabilidades

| Componente | Responsabilidad |
|-----------|----------------|
| **SvelteKit** | SSR/SSG, rutas, API REST, lógica de negocio server-side, autenticación |
| **CouchDB** | Persistencia de estado del juego, configuración, historial de sesiones |
| **Centrifugo** | Mensajería en tiempo real (WebSocket), presencia de jugadores, suscripciones por canal |

---

## 3. Estructura del Proyecto SvelteKit

```
trivia-sveltekit/
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db.js              # Cliente CouchDB
│   │   │   ├── centrifugo.js      # Cliente Centrifugo (admin API)
│   │   │   └── game-engine.js     # Motor del juego server-side
│   │   ├── stores/
│   │   │   ├── game.js            # Store Svelte del estado del juego
│   │   │   ├── player.js          # Store del jugador conectado
│   │   │   └── centrifugo.js      # Cliente Centrifugo reactivo
│   │   ├── components/
│   │   │   ├── pantalla/
│   │   │   │   ├── Inicio.svelte
│   │   │   │   ├── Espera.svelte
│   │   │   │   ├── Carrera.svelte
│   │   │   │   ├── Pregunta.svelte
│   │   │   │   ├── Podio.svelte
│   │   │   │   └── Puntajes.svelte
│   │   │   ├── mando/
│   │   │   │   ├── Registro.svelte
│   │   │   │   ├── SexoSelector.svelte
│   │   │   │   ├── NombreInput.svelte
│   │   │   │   ├── Espera.svelte
│   │   │   │   ├── Pregunta.svelte
│   │   │   │   └── Final.svelte
│   │   │   ├── control/
│   │   │   │   ├── Jugadores.svelte
│   │   │   │   ├── Preguntas.svelte
│   │   │   │   ├── Juego.svelte
│   │   │   │   └── PantallaButtons.svelte
│   │   │   └── shared/
│   │   │       ├── Cronometro.svelte
│   │   │       ├── TablaPosiciones.svelte
│   │   │       ├── Confetti.svelte
│   │   │       └── QRCode.svelte
│   │   ├── types/
│   │   │   └── game.ts            # Tipos TypeScript compartidos
│   │   └── utils/
│   │       ├── texto.ts           # letra() y numero()
│   │       └── config.ts          # Carga configuración
│   ├── routes/
│   │   ├── +layout.svelte         # Layout raíz (carga config global)
│   │   ├── juego/
│   │   │   └── +page.svelte       # Pantalla principal
│   │   ├── control/
│   │   │   └── +page.svelte       # Panel del presentador
│   │   ├── jugar/
│   │   │   └── +page.svelte       # Mando del jugador
│   │   └── api/
│   │       ├── juego/
│   │       │   ├── +server.ts      # GET/POST estado del juego
│   │       │   ├── pregunta/+server.ts
│   │       │   ├── respuesta/+server.ts
│   │       │   └── reiniciar/+server.ts
│   │       ├── jugadores/
│   │       │   ├── +server.ts      # GET lista, POST registro
│   │       │   └── [id]/
│   │       │       └── +server.ts  # GET/PUT jugador individual
│   │       ├── config/
│   │       │   └── +server.ts      # GET configuración
│   │       └── centrifugo/
│   │           └── token/+server.ts # Genera tokens JWT para Centrifugo
│   └── app.html
├── static/
│   ├── img/                        # Assets estáticos
│   ├── fnt/                        # Fuentes
│   └── snd/                        # Sonidos
├── tests/
│   ├── unit/                       # Tests unitarios (Vitest)
│   └── e2e/                        # Tests end-to-end (Playwright)
├── svelte.config.js
├── vite.config.ts
├── package.json
└── tsconfig.json
```

---

## 4. Modelo de Datos en CouchDB

### 4.1 Base de datos: `trivia`

CouchDB almacena documentos JSON. Cada documento tiene `_id` y `_rev`.

### 4.2 Documentos

#### 4.2.1 Configuración del evento

```json
{
  "_id": "config/evento-actual",
  "tipo": "config",
  "evento": "visa-trivia",
  "marca": {
    "nombre": "Trivia Visa",
    "colores": { "primario": "#1434CB", "secundario": "#063b9e", "acento": "#DD6126" },
    "logos": { "principal": "/img/visa/logo.svg" }
  },
  "segundos": 5,
  "maximoJugadores": 3,
  "urlJugadores": "/jugar"
}
```

#### 4.2.2 Estado del juego (singleton)

```json
{
  "_id": "juego/estado",
  "tipo": "juego",
  "pagina": "inicio",
  "pregunta": null,
  "respuesta": "",
  "tiempo": 0,
  "tiempoRestante": 0,
  "comando": "",
  "ganador": null,
  "ronda": 0,
  "preguntasUtilizadas": [],
  "updatedAt": "2026-08-25T12:00:00Z"
}
```

#### 4.2.3 Jugador

```json
{
  "_id": "jugador/abc123",
  "tipo": "jugador",
  "eventoId": "evento-actual",
  "indice": 0,
  "etiqueta": "A",
  "nombre": "María",
  "sexo": "F",
  "puntaje": 0,
  "respuesta": null,
  "tiempoRespuesta": 0,
  "pagina": "espera",
  "conectado": true,
  "createdAt": "2026-08-25T12:00:00Z",
  "updatedAt": "2026-08-25T12:01:00Z"
}
```

#### 4.2.4 Pregunta (del banco)

```json
{
  "_id": "pregunta/29",
  "tipo": "pregunta",
  "numero": 29,
  "contenido": "¿Cuáles son las etapas del journey viajero cubiertas por Visa?",
  "respuestas": [
    "Antes y después del viaje.",
    "Antes y durante el viaje.",
    "En el aeropuerto y durante el viaje.",
    "Todas las anteriores."
  ],
  "correcta": 3
}
```

#### 4.2.5 Registro de sesión (historial)

```json
{
  "_id": "sesion/2026-08-25-001",
  "tipo": "sesion",
  "fecha": "2026-08-25T12:00:00Z",
  "evento": "visa-trivia",
  "jugadores": [
    { "etiqueta": "A", "nombre": "María", "puntaje": 3 },
    { "etiqueta": "B", "nombre": "Carlos", "puntaje": 2 },
    { "etiqueta": "C", "nombre": "Ana", "puntaje": 1 }
  ],
  "ganador": "A",
  "preguntasUsadas": [29, 35, 42, 50, 55, 60],
  "duracion": "00:15:30"
}
```

### 4.3 Vistas (Design Documents)

```json
{
  "_id": "_design/jugadores",
  "views": {
    "porEvento": {
      "map": "function(doc) { if(doc.tipo === 'jugador') emit([doc.eventoId, doc.indice], doc); }"
    },
    "ranking": {
      "map": "function(doc) { if(doc.tipo === 'jugador') emit(doc.puntaje, { nombre: doc.nombre, puntaje: doc.puntaje, tiempo: doc.tiempoRespuesta }); }",
      "reduce": "_stats"
    }
  }
}
```

### 4.4 Cambios Feed (Changes)

CouchDB expone un endpoint `_changes` que notifica modificaciones en la base de datos. El backend de SvelteKit lo consume y re-publica los cambios relevantes a través de Centrifugo:

```
CouchDB _changes → SvelteKit (bridge) → Centrifugo → Clientes
```

---

## 5. Centrifugo — Mensajería en Tiempo Real

### 5.1 Configuración

```json
{
  "admin": true,
  "admin_password": "***",
  "admin_secret": "***",
  "api_key": "***",
  "token_hmac_secret_key": "***",
  "allow_anonymous_connect_without_token": false,
  "publish": true,
  "presence": true,
  "join_leave": true,
  "history_size": 10,
  "history_ttl": "60s"
}
```

### 5.2 Canales

| Canal | Suscriptores | Propósito |
|-------|-------------|-----------|
| `juego:{eventoId}` | Pantalla + Control + Todos los mandos | Estado global del juego (página, pregunta, tiempo) |
| `jugador:{eventoId}:{jugadorId}` | Solo un mando específico | Datos privados del jugador (su página, su respuesta) |
| `control:{eventoId}` | Solo el control | Comandos administrativos |

### 5.3 Mensajes (tipos)

```typescript
type MensajeJuego =
  | { tipo: 'pagina'; pagina: string }
  | { tipo: 'pregunta'; pregunta: Pregunta }
  | { tipo: 'respuesta'; respuesta: string }
  | { tipo: 'tiempo'; tiempo: number; tiempoRestante: number }
  | { tipo: 'comando'; comando: string }
  | { tipo: 'ganador'; ganador: string | null }
  | { tipo: 'puntaje'; jugadorId: string; puntaje: number }
  | { tipo: 'reiniciar' };

type MensajeJugador =
  | { tipo: 'pagina'; pagina: string }
  | { tipo: 'respuesta_correcta'; respuesta: string }
  | { tipo: 'resultado'; correcto: boolean; puntaje: number };
```

### 5.4 Flujo de conexión

1. El cliente abre la página de SvelteKit.
2. SvelteKit genera un token JWT para Centrifugo (con el canal y rol del usuario).
3. El cliente se conecta a Centrifugo con el token.
4. Se suscribe al canal correspondiente (`juego:{id}`, `jugador:{id}:{jid}`).
5. Recibe mensajes en tiempo real desde el servidor.

### 5.5 Presence

Centrifugo permite saber quién está conectado en un canal:

- Canal `juego:{id}`: lista de todos los participantes (pantalla, control, mandos).
- El backend usa `presence` para contar jugadores conectados y validar si hay cupo.

---

## 6. Motor del Juego Server-Side

### 6.1 Responsabilidades

El motor del juego corre en el servidor (SvelteKit endpoint o worker) y es la **fuente de verdad**:

```typescript
// src/lib/server/game-engine.ts

export class GameEngine {
  private estado: EstadoJuego;
  private db: CouchDBClient;
  private centrifugo: CentrifugoClient;

  // Acciones del presentador
  async mostrarPregunta(eventoId: string): Promise<void>;
  async mostrarRespuesta(eventoId: string): Promise<void>;
  async ocultarRespuesta(eventoId: string): Promise<void>;
  async cambiarPagina(eventoId: string, pagina: string): Promise<void>;
  async reiniciarJuego(eventoId: string): Promise<void>;

  // Acciones del jugador
  async registrarJugador(eventoId: string, datos: RegistroJugador): Promise<Jugador>;
  async responder(eventoId: string, jugadorId: string, opcion: number): Promise<void>;

  // Lógica interna
  private async iniciarTemporizador(eventoId: string): Promise<void>;
  private async evaluarRespuestas(eventoId: string): Promise<void>;
  private seleccionarPregunta(): Pregunta;
}
```

### 6.2 Temporizador server-side

A diferencia de la versión actual donde el temporizador corre en el navegador del presentador, la nueva arquitectura mueve el conteo al servidor:

1. Al llamar `mostrarPregunta()`, el servidor registra `tiempoInicio = Date.now()`.
2. Un `setInterval` en el servidor actualiza `tiempoRestante` en CouchDB cada 100ms.
3. Cada actualización se publica en el canal `juego:{id}` de Centrifugo.
4. Cuando `tiempoRestante <= 0` o todos respondieron, se llama `evaluarRespuestas()`.
5. Los clientes solo muestran el tiempo que reciben; no lo calculan.

### 6.3 Evaluación authoritative

La evaluación de respuestas la hace exclusivamente el servidor. Los mandos envían su respuesta y el servidor:

1. Registra la respuesta con timestamp.
2. Al cerrar la ronda, filtra respuestas correctas.
3. Ordena por timestamp.
4. Asigna punto al primero.
5. Publica los puntajes actualizados.

---

## 7. Migración de Componentes

### 7.1 Mapeo Alpine.js → Svelte

| Alpine.js | SvelteKit |
|-----------|-----------|
| `x-data="$aplicacion"` | `+page.svelte` con `load()` |
| `x-text="variable"` | `{variable}` |
| `x-html="contenido"` | `{@html contenido}` |
| `x-show="condicion"` | `{#if condicion}...{/if}` |
| `x-for="(item, id) in lista"` | `{#each lista as item, id}...{/each}` |
| `x-if="condicion"` | `{#if condicion}...{/if}` |
| `x-model="valor"` | `bind:value={valor}` |
| `@click="accion()"` | `on:click={() => accion()}` |
| `:class="[clase]"` | `class:clase={condicion}` o `class={clase}` |
| `:src="url"` | `src={url}` |
| `x-ref="nombre"` | `bind:this={nombre}` |
| `init()` | `onMount()` o `load()` |
| `$watch()` | `$:` (reactive statements) |
| `$nextTick()` | `tick()` de Svelte |

### 7.2 Migración de módulos

| Módulo actual | Componente Svelte destino |
|--------------|--------------------------|
| `js/trivia/pantalla.js` | `src/routes/juego/+page.svelte` + `src/lib/components/pantalla/*.svelte` |
| `js/trivia/control.js` | `src/routes/control/+page.svelte` + `src/lib/components/control/*.svelte` |
| `js/trivia/mando.js` | `src/routes/jugar/+page.svelte` + `src/lib/components/mando/*.svelte` |
| `js/util/firebase.js` | `src/lib/server/db.js` (CouchDB) + `src/lib/stores/centrifugo.js` |
| `js/util/url.js` | Router nativo de SvelteKit |
| `js/util/texto.js` | `src/lib/utils/texto.ts` (sin cambios) |
| `js/util/qr.js` | `src/lib/components/shared/QRCode.svelte` |
| `js/util/escaler.js` | CSS `aspect-ratio` + `object-fit` o componente Svelte |
| `js/loader.js` | `src/routes/+layout.svelte` con `load()` |

---

## 8. API REST de SvelteKit

### 8.1 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/config` | Configuración del evento (colores, logos, textos) |
| `GET` | `/api/juego` | Estado actual del juego |
| `POST` | `/api/juego/pagina` | Cambiar página activa |
| `POST` | `/api/juego/pregunta` | Mostrar nueva pregunta |
| `POST` | `/api/juego/respuesta` | Revelar/ocultar respuesta |
| `POST` | `/api/juego/reiniciar` | Reiniciar el juego |
| `GET` | `/api/jugadores` | Lista de jugadores |
| `POST` | `/api/jugadores` | Registrar nuevo jugador |
| `GET` | `/api/jugadores/:id` | Datos de un jugador |
| `PUT` | `/api/jugadores/:id` | Actualizar jugador (respuesta, página) |
| `POST` | `/api/centrifugo/token` | Generar token JWT para Centrifugo |

### 8.2 Autenticación

- **Control**: Token estático compartido (configurado en variables de entorno). Suficiente para un evento presencial.
- **Pantalla**: Sin autenticación (lectura pública).
- **Mando**: Sin autenticación para registro; token de Centrifugo scoped al canal del jugador.

---

## 9. Despliegue

### 9.1 Docker Compose

```yaml
services:
  trivia:
    build: .
    ports:
      - "3000:3000"
    environment:
      - COUCHDB_URL=http://couchdb:5984
      - COUCHDB_USER=admin
      - COUCHDB_PASSWORD=***
      - CENTRIFUGO_URL=http://centrifugo:8000
      - CENTRIFUGO_API_KEY=${CENTRIFUGO_API_KEY}
      - CENTRIFUGO_TOKEN_SECRET=${CENTRIFUGO_TOKEN_SECRET}
    depends_on:
      - couchdb
      - centrifugo

  couchdb:
    image: couchdb:3
    volumes:
      - couchdb_data:/opt/couchdb/data
    environment:
      - COUCHDB_USER=admin
      - COUCHDB_PASSWORD=***
    ports:
      - "5984:5984"

  centrifugo:
    image: centrifugo/centrifugo:v5
    volumes:
      - ./centrifugo/config.json:/centrifugo/config.json
    command: centrifugo --config=/centrifugo/config.json
    ports:
      - "8000:8000"

volumes:
  couchdb_data:
```

### 9.2 Consideraciones de red

- CouchDB y Centrifugo corren en la red interna de Docker; no necesitan exponerse al público.
- SvelteKit actúa como proxy: los clientes nunca se conectan directamente a CouchDB.
- Centrifugo sí necesita exposición directa para WebSocket (los clientes se conectan).
- Usar un reverse proxy (Traefik, Caddy) para TLS en producción.

---

## 10. Plan de Migración por Fases

### Fase 1: Scaffolding (1-2 días)
- Crear proyecto SvelteKit con TypeScript.
- Configurar Vitest y Playwright.
- Estructura de carpetas y tipos base.
- Migrar assets estáticos (img, fnt, snd).

### Fase 2: CouchDB (1-2 días)
- Docker Compose con CouchDB.
- Crear base de datos y design documents.
- Migrar banco de preguntas a documentos CouchDB.
- CRUD de jugadores y estado del juego.

### Fase 3: Centrifugo (1-2 días)
- Docker Compose con Centrifugo.
- Endpoint de generación de tokens.
- Cliente Centrifugo en el frontend (store Svelte).
- Suscripciones a canales.

### Fase 4: Motor del juego (2-3 días)
- GameEngine server-side.
- Temporizador server-side.
- Evaluación de respuestas.
- Lógica de selección de preguntas.

### Fase 5: Migración de UI (3-5 días)
- Componentes de pantalla (Inicio, Espera, Carrera, Pregunta, Podio).
- Componentes de mando (Registro, Espera, Pregunta, Final).
- Componentes de control (Jugadores, Preguntas, Juego).
- Migrar CSS a Svelte scoped styles.

### Fase 6: Integración y tests (2-3 días)
- Tests unitarios del motor del juego.
- Tests de integración API.
- Tests E2E con Playwright.
- Pruebas de carga con múltiples jugadores.

### Fase 7: Despliegue (1 día)
- Docker Compose final.
- Configuración de reverse proxy y TLS.
- Migración de datos de Firebase a CouchDB.
- Verificación en producción.

**Estimación total: 11-18 días de desarrollo.**

---

## 11. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Latencia CouchDB vs Firebase | Mayor latencia en lecturas | Usar caché en memoria para estado del juego; CouchDB changes feed para sincronización |
| Complejidad de Centrifugo | Curva de aprendizaje | Documentación extensa; empezar con configuración básica |
| WebSocket no soportado en algunos proxies | Clientes no se conectan | Centrifugo soporta HTTP-streaming y HTTP-longpolling como fallback |
| Migración de datos de preguntas | Pérdida de datos | Script de migración automatizado con validación |
| SSR con WebSocket | Hidratación incorrecta | Usar `browser` check de SvelteKit; solo conectar WebSocket en el cliente |
