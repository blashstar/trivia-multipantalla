# Especificación del sistema — Trivia Elifarma

Este documento es el punto de entrada a la especificación funcional y técnica de la trivia. Divide el sistema en dominios independientes para que cada cambio futuro pueda referirse a una única área de comportamiento.

## Mapa de capacidades

El sistema actual ofrece las siguientes capacidades:

| Capacidad | Dominio | Documento |
|-----------|---------|-----------|
| Definir el contexto del evento, actores y restricciones | Contexto | [`01-contexto.md`](./01-contexto.md) |
| Describir el ciclo de vida de una partida | Flujo de juego | [`02-flujo-juego.md`](./02-flujo-juego.md) |
| Mostrar el estado del juego al público | Pantalla | [`03-pantalla.md`](./03-pantalla.md) |
| Administrar preguntas, temporizador y pantallas | Control | [`04-control.md`](./04-control.md) |
| Permitir que los jugadores se registren y respondan | Mando | [`05-mando.md`](./05-mando.md) |
| Sincronizar estado entre todos los dispositivos | Sincronización | [`06-sincronizacion.md`](./06-sincronizacion.md) |
| Garantizar límites de seguridad y confiabilidad | Seguridad | [`07-seguridad.md`](./07-seguridad.md) |
| Definir contratos visuales y recursos | Interfaces | [`08-interfaces.md`](./08-interfaces.md) |

## Cómo leer la especificación

Cada dominio sigue la misma estructura:

1. **Propósito**: qué parte del sistema cubre.
2. **Alcance**: qué entra y qué queda fuera.
3. **Requisitos**: comportamientos obligatorios, recomendados u opcionales.
4. **Escenarios**: ejemplos concretos en formato Given/When/Then.
5. **Notas técnicas**: detalles de implementación actuales que sustentan el requisito.

## Convenciones

- **MUST / SHALL**: requisito obligatorio.
- **SHOULD**: recomendación fuerte.
- **MAY**: opcional.
- Los escenarios son **testables**: se puede escribir una prueba manual o automatizada a partir de ellos.
