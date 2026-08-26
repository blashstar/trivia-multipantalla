# Mejoras y Optimizaciones Propuestas — Trivia Elifarma

## 1. Resumen Ejecutivo

Este documento recopila mejoras organizadas por prioridad y área de impacto, aplicables tanto a la versión actual (Alpine.js + Firebase) como a la versión migrada (SvelteKit + CouchDB + Centrifugo).

---

## 2. Mejoras de Mecánica de Juego

### 2.1 Sistema de Puntuación Avanzado

**Problema actual**: Solo el primer jugador en responder correctamente gana 1 punto. Esto desincentiva a los jugadores que no son los más rápidos.

**Propuesta**: Implementar un sistema de puntuación escalonado.

```
1.º en responder correctamente → 3 puntos
2.º en responder correctamente → 2 puntos
3.º en responder correctamente → 1 punto
Todos los demás correctos    → 1 punto
```

**Beneficio**: Mayor competencia y emoción; los jugadores lentos también tienen incentivo por responder bien.

### 2.2 Modo de Rondas con Categorías

**Problema actual**: Todas las preguntas se mezclan sin temática.

**Propuesta**: Agrupar preguntas por categoría y jugar rondas temáticas.

```json
{
  "ronda": 1,
  "categoria": "Beneficios de Viaje",
  "preguntas": [29, 30, 31, 32, 36, 37]
}
```

**Beneficio**: Mayor engagement temático; el presentador puede adaptar las categorías al público.

### 2.3 Efecto de "Robo de Punto"

**Propuesta**: Si un jugador responde incorrectamente y otro responde correctamente después, el segundo puede "robar" el punto si lo hace dentro de un tiempo bonus de 2 segundos.

**Beneficio**: Mecánica más dinámica que premia la precisión sobre la velocidad pura.

### 2.4 Comodín / Lifeline

**Propuesta**: Cada jugador tiene un comodín por partida que le permite:
- Eliminar una respuesta incorrecta (50/50).
- Duplicar el tiempo para responder.

**Beneficio**: Estrategia adicional; los jugadores deben decidir cuándo usar su comodín.

### 2.5 Racha de Respuestas (Streak)

**Propuesta**: Bonus por respuestas consecutivas correctas.

```
3 correctas seguidas → +1 punto bonus
5 correctas seguidas → +2 puntos bonus
```

**Beneficio**: Incentiva la consistencia y añade tensión.

---

## 3. Mejoras de UX/UI

### 3.1 Animaciones de Transición entre Pantallas

**Problema actual**: Los cambios de pantalla son instantáneos (sin transición).

**Propuesta**: Transiciones suaves con fade, slide o zoom entre páginas.

```svelte
<!-- SvelteKit -->
<Transition type="fade" duration={300}>
  {#if pagina === 'pregunta'}
    <Pregunta />
  {/if}
</Transition>
```

### 3.2 Feedback Visual Inmediato en el Mando

**Problema actual**: Al responder, el mando muestra un texto plano "Has contestado X en Y segundos".

**Propuesta**:
- Animación de confirmación (check verde / X roja).
- Vibración háptica en móviles (API `navigator.vibrate()`).
- Sonido de confirmación.
- Contador regresivo circular animado.

### 3.3 Pantalla de "¡Preparados!"

**Propuesta**: Antes de cada pregunta, mostrar una cuenta regresiva de 3 segundos con animación.

```
3... 2... 1... ¡PREGUNTA!
```

**Beneficio**: Los jugadores se preparan mentalmente; mayor impacto dramático.

### 3.4 Indicador de Conexión

**Problema actual**: Si un jugador pierde conexión, no hay feedback visual.

**Propuesta**: Banner superior que indica el estado de conexión:
- Verde: conectado.
- Amarillo: reconectando.
- Rojo: desconectado.

### 3.5 Modo Espectador

**Propuesta**: Permitir que personas que no pueden jugar (cupos llenos) vean la pantalla desde sus teléfonos como "espectadores" sin poder responder.

**Beneficio**: Nadie se siente excluido del evento.

### 3.6 Sonidos del Juego

**Propuesta**: Efectos de sonido para momentos clave.

| Momento | Sonido |
|---------|--------|
| Mostrar pregunta | Tensión / tick-tock |
| Responder correctamente | Ding / aplauso |
| Responder incorrectamente | Buzz |
| Cuenta regresiva final | Beep acelerado |
| Podio | Fanfarria |
| Nuevo jugador se une | Pop |

---

## 4. Mejoras Técnicas

### 4.1 Tipado con TypeScript

**Problema actual**: JavaScript sin tipos; errores en runtime no detectados.

**Propuesta**: Definir interfaces para todas las entidades del juego.

```typescript
interface Jugador {
  id: string;
  indice: number;
  etiqueta: string;
  nombre: string;
  sexo: 'F' | 'M';
  puntaje: number;
  respuesta: number | null;
  tiempoRespuesta: number;
  pagina: PaginaJugador;
  conectado: boolean;
}

interface Pregunta {
  numero: number;
  contenido: string;
  respuestas: string[];
  correcta: number;
}

type PaginaJuego = 'inicio' | 'espera' | 'carrera' | 'pregunta' | 'podio' | 'puntajes' | '#';
type PaginaJugador = 'inicio' | 'sexo' | 'nombre' | 'espera' | 'pregunta' | 'final' | 'no';
```

### 4.2 Tests Automatizados

**Propuesta**: Implementar tres niveles de testing.

| Tipo | Herramienta | Cobertura |
|------|------------|-----------|
| Unitarios | Vitest | Motor del juego, utilidades, stores |
| Integración | Vitest + Supertest | API endpoints, CouchDB |
| E2E | Playwright | Flujos completos (registro → pregunta → podio) |

**Tests prioritarios**:
1. Evaluación de respuestas (correcta, incorrecta, empate, sin respuestas).
2. Temporizador (inicio, pausa, final, todos respondieron).
3. Registro de jugadores (límite alcanzado, duplicados).
4. Selección de preguntas (sin repetición, reseteo de utilizadas).

### 4.3 Eliminación de CSS Duplicado

**Problema actual**: `#podio` y `#puntajes` tienen ≈350 líneas de CSS idénticas.

**Propuesta**: Unificar en una clase compartida `.tabla-resultado` y usar modificadores.

```css
.tabla-resultado { /* estilos compartidos */ }
.tabla-resultado--podio { /* solo confeti */ }
.tabla-resultado--puntajes { /* sin confeti */ }
```

### 4.4 Avance Dinámico de Personajes

**Problema actual**: El avance está hardcodeado a 5 posiciones CSS (`avance-0` a `avance-4`).

**Propuesta**: Calcular la posición con porcentajes dinámicos basados en el puntaje relativo.

```javascript
const porcentaje = puntaje / maxPuntaje;
const left = `${10 + porcentaje * 80}%`;
```

**Beneficio**: Soporta cualquier número de preguntas y jugadores sin tocar CSS.

### 4.5 Code Splitting por Ruta

**Propuesta**: En SvelteKit, cada ruta (`/juego`, `/control`, `/jugar`) carga solo el código que necesita.

- Pantalla: ~50KB (GSAP + confetti).
- Control: ~30KB (UIkit).
- Mando: ~20KB (mínimo para móvil).

**Beneficio**: Carga inicial más rápida, especialmente en móviles con datos limitados.

### 4.6 Service Worker para Offline

**Propuesta**: Un service worker que cachee los assets estáticos (CSS, fuentes, imágenes).

```javascript
// Cache fonts and images on first load
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('trivia-v1').then(cache =>
      cache.addAll(['/fnt/VisaDialect-Regular.woff2', '/img/mando/fondo.svg'])
    )
  );
});
```

**Beneficio**: Si la red falla durante el evento, los mandos ya tienen los assets cargados.

### 4.7 Compresión de Assets

**Propuesta**: Habilitar gzip/brotli en Nginx para CSS, JS y SVG.

```nginx
gzip on;
gzip_types text/css application/javascript image/svg+xml;
gzip_min_length 256;
```

**Beneficio**: Reducción del 60-80% en el tamaño de los assets transferidos.

---

## 5. Mejoras de Infraestructura

### 5.1 Multi-Evento

**Problema actual**: Solo un evento activo a la vez por proyecto de Firebase.

**Propuesta**: Estructurar los datos por evento para soportar múltiples trivias simultáneas.

```
trivia/
├── evento-A/
│   ├── juego/
│   └── jugadores/
└── evento-B/
    ├── juego/
    └── jugadores/
```

**Beneficio**: Un mismo despliegue puede servir múltiples eventos simultáneamente.

### 5.2 Panel de Administración Web

**Propuesta**: Crear una ruta `/admin` en SvelteKit para:
- Crear y editar eventos.
- Gestionar bancos de preguntas (CRUD).
- Ver historial de sesiones y resultados.
- Exportar resultados a CSV/Excel.
- Configurar parámetros del juego sin tocar código.

### 5.3 Historial y Reportes

**Propuesta**: Guardar cada sesión de juego con todos los datos (preguntas, respuestas, tiempos, puntajes).

**Beneficio**:
- Analizar qué preguntas fueron más difíciles.
- Generar reportes para el cliente post-evento.
- Leaderboard histórico entre eventos.

### 5.4 Health Checks y Monitoreo

**Propuesta**: Endpoints de health check para cada servicio.

```
GET /api/health → { status: 'ok', couchdb: 'ok', centrifugo: 'ok', uptime: '2h 15m' }
```

**Beneficio**: Detección temprana de problemas durante el evento.

### 5.5 Backup Automático de CouchDB

**Propuesta**: Script de backup que corra cada hora y al finalizar cada sesión.

```bash
#!/bin/bash
curl -X GET "http://localhost:5984/trivia/_all_docs" > "backup-$(date +%Y%m%d-%H%M%S).json"
```

**Beneficio**: Protección contra pérdida de datos.

---

## 6. Mejoras de Seguridad

### 6.1 Rate Limiting en el Mando

**Problema actual**: Un jugador puede enviar respuestas infinitas.

**Propuesta**: Limitar a 1 respuesta por pregunta por jugador. El servidor descarta respuestas duplicadas.

### 6.2 Validación de Input

**Propuesta**: Validar en el servidor:
- Nombre: 3-16 caracteres, solo letras y espacios.
- Respuesta: índice válido (0-3).
- Tiempo: dentro del rango permitido.

### 6.3 Protección contra Trampa

**Propuesta**:
- Timestamp server-side para cada respuesta (no confiar en el tiempo del cliente).
- Detectar si un jugador envía una respuesta antes de que se muestre la pregunta.
- Limitar la frecuencia de peticiones por IP.

### 6.4 HTTPS Obligatorio

**Propuesta**: Configurar TLS en el reverse proxy (Caddy con Let's Encrypt automático, o Traefik con ACME).

### 6.5 Sanitización de HTML

**Problema actual**: `x-html` renderiza contenido sin sanitizar.

**Propuesta**: Usar una librería como `DOMPurify` o sanitizar en el servidor antes de guardar en la base de datos.

```typescript
import DOMPurify from 'dompurify';
const contenidoLimpio = DOMPurify.sanitize(pregunta.contenido);
```

---

## 7. Mejoras de Rendimiento

### 7.1 Lazy Loading de Assets

**Propuesta**: Cargar imágenes y sonidos solo cuando la pantalla los necesita.

```svelte
<!-- Cargar el sprite de carrera solo cuando se muestra la pantalla de carrera -->
{#if pagina === 'carrera'}
  <img src="/img/pista.png" alt="" loading="eager" />
{/if}
```

### 7.2 Reducción de Dependencias CDN

**Problema actual**: 8+ dependencias cargadas desde CDN en cada página.

**Propuesta**: Con SvelteKit, bundlear solo lo necesario por ruta.

| Ruta | Dependencias necesarias |
|------|------------------------|
| `/juego` | GSAP, canvas-confetti, QR |
| `/control` | UIkit |
| `/jugar` | Ninguna externa |

**Beneficio**: Menos requests HTTP y menor tamaño total.

### 7.3 Optimización de Imágenes

**Propuesta**:
- Convertir PNG a WebP/AVIF (los personajes corriendo son sprites PNG pesados).
- Usar SVG para iconos (ya se hace parcialmente).
- Lazy loading para imágenes fuera del viewport.

### 7.4 Debounce en Updates de Firebase/CouchDB

**Problema actual**: El temporizador actualiza Firebase cada 100ms (10 writes/segundo).

**Propuesta**:
- Actualizar el tiempo localmente en el cliente con interpolación.
- Sincronizar con el servidor cada 500ms o 1s.
- Publicar el tiempo en Centrifugo cada 200ms (más eficiente que Firebase).

**Beneficio**: Reduce la carga de escritura en la base de datos en un 60-80%.

### 7.5 Prefetch de Rutas

**Propuesta**: En SvelteKit, usar `data-sveltekit-preload-data="hover"` para precargar las rutas cuando el usuario pasa el mouse sobre los enlaces.

**Beneficio**: Navegación instantánea entre páginas del mando.

---

## 8. Mejoras de Accesibilidad

### 8.1 ARIA Labels

**Propuesta**: Añadir roles y labels ARIA a todos los elementos interactivos.

```svelte
<button aria-label="Responder opción A" role="radio" aria-checked={seleccionada === 0}>
```

### 8.2 Contraste de Colores

**Propuesta**: Verificar que todas las combinaciones de texto/fondo cumplan WCAG 2.1 AA (ratio 4.5:1).

### 8.3 Navegación por Teclado

**Propuesta**: Los mandos deben ser navegables completamente con teclado (Tab, Enter, flechas).

### 8.4 Reducir Movimiento

**Propuesta**: Respetar `prefers-reduced-motion` para desactivar animaciones y confeti.

```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

---

## 9. Priorización (Matriz Impacto/Esfuerzo)

| Mejora | Impacto | Esfuerzo | Prioridad |
|--------|---------|----------|-----------|
| TypeScript + tipos | Alto | Medio | 🔴 Alta |
| Tests automatizados | Alto | Alto | 🔴 Alta |
| Temporizador server-side | Alto | Medio | 🔴 Alta |
| Sanitización HTML | Alto | Bajo | 🔴 Alta |
| Rate limiting | Alto | Bajo | 🔴 Alta |
| Feedback visual en mando | Medio | Bajo | 🟡 Media |
| Cuenta regresiva pre-pregunta | Medio | Bajo | 🟡 Media |
| Sistema de puntuación escalonado | Alto | Medio | 🟡 Media |
| Animaciones de transición | Medio | Medio | 🟡 Media |
| CSS sin duplicados | Medio | Bajo | 🟡 Media |
| Avance dinámico de personajes | Medio | Medio | 🟡 Media |
| Indicador de conexión | Medio | Bajo | 🟡 Media |
| Service Worker | Medio | Medio | 🟢 Baja |
| Multi-evento | Alto | Alto | 🟢 Baja |
| Panel de administración | Alto | Alto | 🟢 Baja |
| Historial y reportes | Medio | Alto | 🟢 Baja |
| Modo espectador | Bajo | Medio | 🟢 Baja |
| Comodines / Lifelines | Medio | Alto | 🟢 Baja |
| Sonidos del juego | Medio | Bajo | 🟢 Baja |
| Accesibilidad completa | Alto | Alto | 🟢 Baja |

---

## 10. Métricas de Éxito

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Tiempo de carga del mando | ~2-3s (CDN) | < 1s (bundled) |
| Latencia de respuesta | ~200-500ms (Firebase) | < 100ms (Centrifugo WebSocket) |
| Writes por segundo al temporizador | 10/s | 2-5/s (con debounce) |
| Cobertura de tests | 0% | > 80% (motor del juego) |
| Lighthouse Performance | N/A | > 90 |
| Lighthouse Accessibility | N/A | > 85 |
| Tamaño del bundle del mando | ~500KB (CDN total) | < 50KB (bundled) |
