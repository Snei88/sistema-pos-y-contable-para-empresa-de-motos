#!/usr/bin/env python3
"""
KPI report para el taller de motos, leído directamente de la base SQLite del POS.
Solo lectura (mode=ro). Sin dependencias externas (solo stdlib).

Uso:
    python3 kpi_report.py --db /ruta/a/manuelmotos.db [--dias-taller 60] [--dias-inmovilizado 60]
"""
import argparse
import sqlite3
import sys
from datetime import datetime, timedelta


def connect_ro(db_path: str) -> sqlite3.Connection:
    uri = f"file:{db_path}?mode=ro"
    try:
        conn = sqlite3.connect(uri, uri=True)
        conn.row_factory = sqlite3.Row
        conn.execute("SELECT 1")
        return conn
    except sqlite3.OperationalError as e:
        print(f"ERROR: no se pudo abrir la base de datos en modo lectura: {e}")
        sys.exit(1)


def table_exists(conn, name: str) -> bool:
    row = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (name,)
    ).fetchone()
    return row is not None


def fmt_money(v) -> str:
    if v is None:
        v = 0
    return f"${v:,.0f}"


def section(title: str):
    print(f"\n{'=' * 60}\n{title}\n{'=' * 60}")


def report_ventas(conn, alerts):
    section("VENTAS")
    hoy = datetime.now().strftime("%Y-%m-%d")
    for label, dias in [("HOY", 0), ("ULTIMOS 7 DIAS", 7), ("ULTIMOS 30 DIAS", 30)]:
        since = (datetime.now() - timedelta(days=dias)).strftime("%Y-%m-%d 00:00:00")
        row = conn.execute(
            """SELECT COUNT(*) n, COALESCE(SUM(total),0) total
               FROM sales WHERE status='completada' AND created_at >= ?""",
            (since,),
        ).fetchone()
        ticket = row["total"] / row["n"] if row["n"] else 0
        print(f"  {label:18s} -> {row['n']:4d} ventas | total {fmt_money(row['total'])} | ticket prom {fmt_money(ticket)}")
        if dias == 0 and row["n"] == 0:
            alerts.append(("P1", "Cero ventas hoy", "Sin transacciones registradas en el día. Confirmar si es horario (aún no cierra el día) o una alerta real de piso de ventas."))

    since30 = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d 00:00:00")
    row = conn.execute(
        """SELECT COALESCE(SUM(si.subtotal),0) revenue,
                  COALESCE(SUM(si.cost_price * si.quantity),0) cost
           FROM sale_items si JOIN sales s ON s.id = si.sale_id
           WHERE s.status='completada' AND s.created_at >= ?""",
        (since30,),
    ).fetchone()
    margen_pct = (100 * (row["revenue"] - row["cost"]) / row["revenue"]) if row["revenue"] else None
    print(f"  Margen bruto (30d): {margen_pct:.1f}%" if margen_pct is not None else "  Margen bruto (30d): sin datos suficientes")

    print("\n  Top 10 productos por ingreso (30d):")
    top = conn.execute(
        """SELECT si.product_name, SUM(si.quantity) qty, SUM(si.subtotal) revenue
           FROM sale_items si JOIN sales s ON s.id = si.sale_id
           WHERE s.status='completada' AND s.created_at >= ?
           GROUP BY si.product_name ORDER BY revenue DESC LIMIT 10""",
        (since30,),
    ).fetchall()
    if not top:
        print("    (sin ventas registradas en los últimos 30 días)")
    for r in top:
        print(f"    {r['product_name']:35s} qty={r['qty']:.0f}  ingreso={fmt_money(r['revenue'])}")


def report_inventario(conn, alerts, dias_inmovilizado: int):
    section("INVENTARIO")
    row = conn.execute("SELECT COALESCE(SUM(stock*cost_price),0) v, COUNT(*) n FROM products WHERE status='active'").fetchone()
    print(f"  Valor total inventario (a costo): {fmt_money(row['v'])}  ({row['n']} productos activos)")

    bajo_stock = conn.execute(
        "SELECT code, name, stock, min_stock FROM products WHERE status='active' AND stock <= min_stock ORDER BY stock ASC"
    ).fetchall()
    print(f"\n  Productos en/bajo stock mínimo: {len(bajo_stock)}")
    for r in bajo_stock[:15]:
        print(f"    [{r['code']}] {r['name']:35s} stock={r['stock']:.0f}  min={r['min_stock']:.0f}")
    if bajo_stock:
        criticos = [r["name"] for r in bajo_stock[:5]]
        alerts.append(("P0", f"{len(bajo_stock)} producto(s) en/bajo stock mínimo", "Riesgo de perder venta por falta de repuesto. Priorizar reposición de: " + ", ".join(criticos)))

    since90 = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d 00:00:00")
    abc_rows = conn.execute(
        """SELECT si.product_name, SUM(si.subtotal) revenue
           FROM sale_items si JOIN sales s ON s.id = si.sale_id
           WHERE s.status='completada' AND s.created_at >= ?
           GROUP BY si.product_name ORDER BY revenue DESC""",
        (since90,),
    ).fetchall()
    total_rev = sum(r["revenue"] for r in abc_rows)
    print(f"\n  Clasificacion ABC (por ingreso, ultimos 90 dias, total={fmt_money(total_rev)}):")
    if not abc_rows:
        print("    (sin ventas suficientes en 90 dias para clasificar ABC — negocio muy nuevo, normal en el día 1)")
    else:
        acc = 0.0
        counts = {"A": 0, "B": 0, "C": 0}
        for r in abc_rows:
            acc += r["revenue"]
            pct_acc = acc / total_rev if total_rev else 0
            clase = "A" if pct_acc <= 0.80 else ("B" if pct_acc <= 0.95 else "C")
            counts[clase] += 1
        print(f"    Clase A (80% ingreso): {counts['A']} productos | Clase B: {counts['B']} | Clase C: {counts['C']}")

    since_inm = (datetime.now() - timedelta(days=dias_inmovilizado)).strftime("%Y-%m-%d 00:00:00")
    inmovilizados = conn.execute(
        f"""SELECT p.code, p.name, p.stock, p.cost_price
            FROM products p
            WHERE p.status='active' AND p.stock > 0
              AND p.id NOT IN (
                SELECT DISTINCT si.product_id FROM sale_items si
                JOIN sales s ON s.id = si.sale_id
                WHERE s.status='completada' AND s.created_at >= ? AND si.product_id IS NOT NULL
              )
            ORDER BY (p.stock*p.cost_price) DESC"""
        , (since_inm,),
    ).fetchall()
    valor_inm = sum(r["stock"] * r["cost_price"] for r in inmovilizados)
    print(f"\n  Inventario inmovilizado (sin venta en {dias_inmovilizado} dias): {len(inmovilizados)} productos, {fmt_money(valor_inm)} en capital detenido")
    if valor_inm > 0:
        alerts.append(("P2", f"{fmt_money(valor_inm)} en inventario sin rotar ({dias_inmovilizado}d)", "Capital de trabajo inmovilizado. Evaluar promoción, combo o devolución a proveedor."))


def report_taller(conn, alerts):
    if not table_exists(conn, "work_orders"):
        return
    section("TALLER (ordenes de trabajo)")
    by_status = conn.execute("SELECT status, COUNT(*) n FROM work_orders GROUP BY status").fetchall()
    if not by_status:
        print("  (sin ordenes de trabajo registradas todavia)")
    for r in by_status:
        print(f"  {r['status']:12s}: {r['n']}")

    row = conn.execute(
        "SELECT COUNT(*) n, COALESCE(SUM(total),0) total FROM work_orders WHERE status IN ('finalizado','entregado')"
    ).fetchone()
    ticket = row["total"] / row["n"] if row["n"] else 0
    print(f"\n  OT finalizadas/entregadas: {row['n']} | ingreso total {fmt_money(row['total'])} | ticket prom {fmt_money(ticket)}")

    print("\n  Productividad por mecanico:")
    mec = conn.execute(
        """SELECT m.name, COUNT(wo.id) n, COALESCE(SUM(wo.total),0) total
           FROM work_orders wo JOIN mechanics m ON m.id = wo.mechanic_id
           WHERE wo.status IN ('finalizado','entregado')
           GROUP BY m.id ORDER BY total DESC"""
    ).fetchall()
    if not mec:
        print("    (sin datos)")
    for r in mec:
        print(f"    {r['name']:25s} OT={r['n']:3d}  facturado={fmt_money(r['total'])}")

    ciclo = conn.execute(
        """SELECT AVG(julianday(delivered_at) - julianday(created_at)) d
           FROM work_orders WHERE delivered_at IS NOT NULL"""
    ).fetchone()
    if ciclo["d"] is not None:
        print(f"\n  Tiempo promedio de ciclo (creacion -> entrega): {ciclo['d']:.1f} dias")

    pendientes_viejas = conn.execute(
        """SELECT order_number, created_at FROM work_orders
           WHERE status IN ('pendiente','en_proceso') AND julianday('now') - julianday(created_at) > 3
           ORDER BY created_at ASC"""
    ).fetchall()
    if pendientes_viejas:
        alerts.append(("P1", f"{len(pendientes_viejas)} OT abiertas hace más de 3 días", "Riesgo de cliente insatisfecho / moto ocupando espacio de taller. Revisar: " + ", ".join(r["order_number"] for r in pendientes_viejas[:5])))


def report_clientes(conn, alerts):
    section("CLIENTES")
    total = conn.execute("SELECT COUNT(*) n FROM clients WHERE is_active=1 AND deleted_at IS NULL").fetchone()["n"]
    since30 = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d 00:00:00")
    nuevos = conn.execute("SELECT COUNT(*) n FROM clients WHERE created_at >= ?", (since30,)).fetchone()["n"]
    print(f"  Clientes activos: {total} | nuevos (30d): {nuevos}")

    rec = conn.execute(
        """SELECT client_id, COUNT(*) n FROM sales
           WHERE status='completada' AND client_id IS NOT NULL
           GROUP BY client_id"""
    ).fetchall()
    if rec:
        recurrentes = sum(1 for r in rec if r["n"] > 1)
        pct = 100 * recurrentes / len(rec)
        print(f"  Clientes con >1 compra: {recurrentes}/{len(rec)} ({pct:.0f}%)")
    else:
        print("  (sin ventas con cliente identificado todavia — vender siempre asociando cliente es clave para poder medir esto)")
        alerts.append(("P2", "Ventas sin cliente asociado", "Sin client_id en las ventas no se puede medir recompra ni construir campañas de fidelización/reactivación."))

    since60 = (datetime.now() - timedelta(days=60)).strftime("%Y-%m-%d 00:00:00")
    since120 = (datetime.now() - timedelta(days=120)).strftime("%Y-%m-%d 00:00:00")
    reactivables = conn.execute(
        """SELECT c.id, c.name, MAX(s.created_at) ultima
           FROM clients c JOIN sales s ON s.client_id = c.id AND s.status='completada'
           GROUP BY c.id HAVING ultima < ? AND ultima >= ?""",
        (since60, since120),
    ).fetchall()
    print(f"  Candidatos a reactivación (última compra 60-120d atrás): {len(reactivables)}")
    if reactivables:
        alerts.append(("P2", f"{len(reactivables)} cliente(s) para campaña de reactivación", "Última compra hace 60-120 días. Contactar por WhatsApp con recordatorio de mantenimiento antes de que se vuelvan cliente perdido (>120d)."))


def report_cartera_caja(conn, alerts):
    section("CARTERA Y CAJA")
    row = conn.execute("SELECT COALESCE(SUM(balance),0) total FROM credits WHERE status != 'al_dia' OR balance > 0").fetchone()
    print(f"  Cartera pendiente total: {fmt_money(row['total'])}")
    vencido = conn.execute("SELECT COUNT(*) n, COALESCE(SUM(balance),0) total FROM credits WHERE status='vencido'").fetchone()
    print(f"  Cartera vencida: {vencido['n']} cliente(s), {fmt_money(vencido['total'])}")
    if vencido["n"] > 0:
        alerts.append(("P1", f"{fmt_money(vencido['total'])} en cartera vencida ({vencido['n']} clientes)", "Riesgo de pérdida de flujo de caja. Priorizar cobro antes de nuevas ventas a crédito al mismo cliente."))

    dif = conn.execute("SELECT COALESCE(SUM(ABS(difference)),0) total, COUNT(*) n FROM cash_sessions WHERE difference IS NOT NULL AND difference != 0").fetchone()
    if dif["n"] > 0:
        print(f"  Diferencias de caja acumuladas: {dif['n']} sesion(es), {fmt_money(dif['total'])} en descuadres")
        alerts.append(("P1", f"{dif['n']} sesion(es) de caja con descuadre (total {fmt_money(dif['total'])})", "Revisar proceso de arqueo/cierre de caja; descuadres recurrentes indican control interno débil."))


def print_alerts(alerts):
    section("ALERTAS PRIORIZADAS (P0=critico ... P3=optimizacion)")
    if not alerts:
        print("  Sin alertas automaticas detectadas con los umbrales actuales.")
        return
    order = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}
    for prio, titulo, detalle in sorted(alerts, key=lambda a: order[a[0]]):
        print(f"  [{prio}] {titulo}\n        -> {detalle}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", required=True, help="Ruta al archivo .db de SQLite del POS")
    ap.add_argument("--dias-inmovilizado", type=int, default=60)
    args = ap.parse_args()

    conn = connect_ro(args.db)
    alerts = []
    print(f"Reporte generado: {datetime.now().isoformat(timespec='seconds')}")
    print(f"Base de datos: {args.db}")

    report_ventas(conn, alerts)
    report_inventario(conn, alerts, args.dias_inmovilizado)
    report_taller(conn, alerts)
    report_clientes(conn, alerts)
    report_cartera_caja(conn, alerts)
    print_alerts(alerts)
    conn.close()


if __name__ == "__main__":
    main()
