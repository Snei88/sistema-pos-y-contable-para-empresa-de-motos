# Empresa (independiente del código del POS)

Esta carpeta es la memoria documental del **negocio** (taller + repuestos de motos), separada a propósito de `src/` (que es el código del sistema POS). Aquí vive todo lo que no es software: decisiones fundacionales, estrategia, investigación de mercado e informes.

No se construye todo de una vez — se avanza módulo por módulo, y cada documento se actualiza a medida que hay decisiones o datos nuevos.

## Índice

| Documento | Estado | Qué contiene |
|---|---|---|
| [`00-constitucion-legal.md`](./00-constitucion-legal.md) | 🟢 tipo societario y nombre decididos | Persona natural, pasos de constitución, trámites municipales/ambientales de Cali, checklist de datos pendientes. |
| [`01-naming.md`](./01-naming.md) | ✅ nombre final: **TecnoMotos LC** | Historial completo de candidatos (rondas 1-3) hasta la decisión final, con la alerta de RUES pendiente de confirmar en Cámara de Comercio de Cali. |
| [`02-estrategia-comercial-marketing.md`](./02-estrategia-comercial-marketing.md) | 🟢 en ejecución con el nombre aplicado | Propuesta de valor, diferenciación, producto ancla, canales priorizados y plan de contenido de las primeras 4 semanas. |
| [`informes/`](./informes/) | — | Informes fechados (auditorías, diagnósticos de negocio). El primero: día 1. |

**Nombre del negocio: TecnoMotos LC. Tipo societario: persona natural.** ⚠️ Pendiente confirmar en Cámara de Comercio de Cali que no choca con "CDA Tecnomotos SAS" (activa en Cali) antes de imprimir rótulo/tarjetas — ver `01-naming.md`.

## Relación con el resto del repo

- `.claude/agents/ceo-motos.md` y `.claude/skills/analizar-negocio-motos/` siguen viviendo dentro de `.claude/` porque es la ruta que Claude Code necesita para reconocerlos como agente/skill invocables — pero **operan sobre esta carpeta** como fuente de verdad del negocio, no sobre `src/`.
- `src/`, `package.json`, `electron-builder.yml`, etc. son el producto de software (el POS) y no se tocan para nada de lo documental.
