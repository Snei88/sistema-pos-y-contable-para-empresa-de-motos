---
name: analizar-negocio-motos
description: Genera un diagnóstico de negocio basado en datos REALES del POS (ventas, inventario ABC, taller, clientes, cartera) leyendo directamente la base SQLite del sistema, y clasifica hallazgos en alertas P0-P3. Úsala cuando el usuario pida un "chequeo del negocio", "cómo vamos", KPIs, análisis de inventario/rotación, o cualquier decisión que deba basarse en datos del POS en vez de opinión. Nunca inventa cifras: si una tabla está vacía (negocio nuevo) lo reporta explícitamente en vez de estimar.
---

# Analizar negocio de motos (datos reales del POS)

## Objetivo
Convertir la base SQLite del sistema POS (`manuelmotos.db` — el nombre cambiará cuando se rebrandee, ver `.claude/agents/ceo-motos.md`) en un diagnóstico accionable: ventas, margen, inventario (clasificación ABC + stock crítico + inmovilizado), desempeño del taller por mecánico, comportamiento de clientes (nuevos/recurrentes/inactivos) y cartera. Termina siempre en una lista de alertas priorizadas P0-P3, nunca en una tabla de números sin interpretación.

## Cuándo NO usarla
Si la pregunta es puramente de estrategia/mercado sin relación a los datos internos (naming, competencia, marketing), usa investigación web directamente — esta skill es solo para datos internos del POS.

## Proceso
1. **Localizar la base de datos.** No está en el repo (vive en `app.getPath('userData')` de Electron, fuera del proyecto). Rutas típicas según el `productName` configurado en `package.json`/`electron-builder.yml` (hoy `manuel-motos`, cambiará al rebrandear):
   - Linux: `~/.config/<productName>/data/manuelmotos.db`
   - macOS: `~/Library/Application Support/<productName>/data/manuelmotos.db`
   - Windows: `%APPDATA%\<productName>\data\manuelmotos.db`
   Si no la encuentras ahí, busca con `find / -name "manuelmotos.db" 2>/dev/null` (o el nombre de archivo vigente si ya se rebrandeó — revisa `src/main/database/connection.ts`). Si no existe ningún archivo, repórtalo tal cual: "no hay base de datos todavía / la app no se ha ejecutado" — no simules datos.
2. Ejecuta `scripts/kpi_report.py` pasando la ruta encontrada:
   ```
   python3 .claude/skills/analizar-negocio-motos/scripts/kpi_report.py --db "<ruta-al-archivo.db>"
   ```
   El script abre la BD en modo solo-lectura (no bloquea ni modifica nada, seguro de correr con la app abierta gracias a WAL mode) y no requiere dependencias fuera de la librería estándar de Python.
3. **Interpreta la salida, no la copies tal cual.** El script imprime números crudos por sección (ventas, inventario ABC, taller, clientes, cartera) y una lista de alertas ya clasificadas P0-P3 con la razón. Tu trabajo es:
   - Si el negocio es nuevo y las tablas están casi vacías, dilo explícitamente y enfoca la respuesta en qué instrumentar para tener datos útiles en 30 días (no fabriques tendencias con 3 ventas).
   - Cruza los hallazgos con el contexto de mercado/competencia si el usuario lo pidió (usa el agente `ceo-motos` o investigación previa) — un producto "estancado" según el ABC puede ser normal si el mercado real no lo demanda, no asumas automáticamente que es un error de compra.
   - Presenta con el formato de decisión: PROBLEMA → DATOS → ANÁLISIS → OPCIONES → RECOMENDACIÓN → COSTO → IMPACTO → ACCIÓN → MÉTRICA, para cada alerta P0/P1 relevante.
4. Si vas a comparar contra un periodo anterior o proyectar, dilo explícitamente como HIPÓTESIS y aclara el tamaño de muestra usado.

## Qué calcula el script
- **Ventas**: total y transacciones (hoy / 7 días / 30 días), ticket promedio, margen bruto % (usa `sale_items.cost_price` vs `unit_price`), top 10 productos por ingreso y por unidades.
- **Inventario**: valor total a costo, clasificación ABC por ingreso acumulado de los últimos 90 días (A=80%, B=95%, C=resto), productos con `stock <= min_stock`, productos "inmovilizados" (stock > 0 sin ninguna venta en 60 días).
- **Taller**: órdenes de trabajo por estado, ingreso y ticket promedio por OT finalizada/entregada, productividad por mecánico (# OT y total facturado), tiempo promedio de ciclo (creación → entrega) en días.
- **Clientes**: total activos, nuevos últimos 30 días, % recurrentes (más de 1 compra), clientes con compra hace 60-120 días (candidatos a reactivación) — nunca clientes sin ninguna compra registrada como "inactivos", eso sería inventar una interpretación.
- **Cartera/Caja**: saldo total pendiente, cartera vencida, diferencias de caja acumuladas (posibles descuadres).
- **Alertas automáticas P0-P3** con umbrales explícitos en el propio script (documentados en comentarios) — ajústalos si el negocio define otros límites.

## Salida
Texto plano estructurado por secciones (fácil de pegar en un reporte). No genera archivos por defecto; si el usuario pide un dashboard visual, usa esta salida como fuente de datos para un Artifact (sigue la skill `dataviz` para el diseño de las gráficas) — no inventes valores que el script no calculó.
