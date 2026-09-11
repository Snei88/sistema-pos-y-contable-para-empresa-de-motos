# Contexto del proyecto

Este repositorio contiene DOS cosas deliberadamente separadas:

1. **El producto de software**: un POS/contable (Electron + React + Drizzle/SQLite) en `src/`. Fue construido originalmente para un negocio llamado "Manuel Motos" que ya no existe.
2. **La empresa que usa ese software**: un taller de motos + venta de repuestos que **acaba de empezar operaciones**, sin nombre comercial definitivo todavía. Toda su documentación (constitución legal, naming, estrategia, informes) vive en **[`empresa/`](./empresa/)** — no en `src/`, no mezclada con el código.

Empieza siempre por `empresa/README.md` para orientarte.

## Agente y skill de negocio

- `.claude/agents/ceo-motos.md` — agente que actúa como CEO/estratega del negocio (comercial, marketing, inventario, finanzas). Vive en `.claude/` porque es la ruta que Claude Code requiere para reconocerlo como agente invocable, pero **su fuente de verdad es `empresa/`**, no el código del POS. Úsalo para cualquier pregunta de negocio.
- `.claude/skills/analizar-negocio-motos/` — skill que lee la base SQLite real del POS y genera KPIs (ventas, ABC de inventario, taller, clientes, cartera) con alertas priorizadas P0-P3. Script: `scripts/kpi_report.py` (solo stdlib de Python).
- `empresa/informes/` — informes de negocio generados (auditorías, diagnósticos). El primero: `2026-09-11-informe-ceo-dia-1.html`.

## Rebranding pendiente

El nombre comercial "Manuel Motos" está hardcodeado en ~19 archivos de `src/` (título de ventana, sidebar, login, `package.json`, `electron-builder.yml`, nombre del archivo de BD, PDFs). El nombre de empresa mostrado en facturas (`empresa_nombre`) ya es configurable desde Ajustes → Empresa sin tocar código. Ver detalle completo en `.claude/agents/ceo-motos.md` y en `empresa/informes/2026-09-11-informe-ceo-dia-1.html`. El nombre definitivo se decide en `empresa/01-naming.md`.
