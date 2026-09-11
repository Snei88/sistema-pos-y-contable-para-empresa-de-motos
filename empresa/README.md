# Empresa (independiente del código del POS)

Esta carpeta es la memoria documental del **negocio** (taller + repuestos de motos), separada a propósito de `src/` (que es el código del sistema POS). Aquí vive todo lo que no es software: decisiones fundacionales, estrategia, investigación de mercado e informes.

No se construye todo de una vez — se avanza módulo por módulo, y cada documento se actualiza a medida que hay decisiones o datos nuevos.

## Índice

| Documento | Estado | Qué contiene |
|---|---|---|
| [`00-constitucion-legal.md`](./00-constitucion-legal.md) | 🟡 en definición | Cómo formalizar el negocio en Colombia/Cali: persona natural vs. SAS, trámites, costos, permisos municipales/ambientales específicos de un taller. |
| [`01-naming.md`](./01-naming.md) | 🟡 en definición | Candidatos de nombre evaluados y verificados contra el registro mercantil (RUES). |
| [`informes/`](./informes/) | — | Informes fechados (auditorías, diagnósticos de negocio). El primero: día 1. |

## Relación con el resto del repo

- `.claude/agents/ceo-motos.md` y `.claude/skills/analizar-negocio-motos/` siguen viviendo dentro de `.claude/` porque es la ruta que Claude Code necesita para reconocerlos como agente/skill invocables — pero **operan sobre esta carpeta** como fuente de verdad del negocio, no sobre `src/`.
- `src/`, `package.json`, `electron-builder.yml`, etc. son el producto de software (el POS) y no se tocan para nada de lo documental.
