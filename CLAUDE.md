# Contexto del proyecto

Este repositorio es el sistema POS/contable (Electron + React + Drizzle/SQLite) de un taller de motos + venta de repuestos que **acaba de empezar operaciones**. Fue construido originalmente para un negocio llamado "Manuel Motos" que ya no existe — el nombre definitivo del negocio actual todavía está en definición (ver `docs/informes/`).

## Agente y skill de negocio

- `.claude/agents/ceo-motos.md` — agente que actúa como CEO/estratega del negocio (comercial, marketing, inventario, finanzas). Úsalo para cualquier pregunta de negocio, no solo de código.
- `.claude/skills/analizar-negocio-motos/` — skill que lee la base SQLite real del POS y genera KPIs (ventas, ABC de inventario, taller, clientes, cartera) con alertas priorizadas P0-P3. Script: `scripts/kpi_report.py` (solo stdlib de Python).
- `docs/informes/` — informes de negocio generados (auditorías, diagnósticos). El primero: `2026-09-11-informe-ceo-dia-1.html`.

## Rebranding pendiente

El nombre comercial "Manuel Motos" está hardcodeado en ~19 archivos (título de ventana, sidebar, login, `package.json`, `electron-builder.yml`, nombre del archivo de BD, PDFs). El nombre de empresa mostrado en facturas (`empresa_nombre`) ya es configurable desde Ajustes → Empresa sin tocar código. Ver detalle completo en `.claude/agents/ceo-motos.md` y en el informe día 1.
