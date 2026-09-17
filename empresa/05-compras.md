# Registro de compras a proveedores

Estado: 🟢 en uso. Bitácora simple de lo que se ha comprado, a quién y en qué estado de pago — mientras el POS no esté cargando esto directamente, se lleva aquí para no perder el rastro.

## 2026-09-12 — Primer pedido de mercancía

Archivo con el detalle completo (fórmulas de costo/venta/margen): [`compras/2026-09-12-primer-pedido.xlsx`](./compras/2026-09-12-primer-pedido.xlsx)

| Proveedor | Documento | Total | Estado de pago |
|---|---|--:|---|
| Premium Racing | Factura N° 442 | $605.000 | 🔴 **A CRÉDITO** — $0 pagado, pendiente de abonar |
| MotoGP | Cotización N° 13904 (vendedor Gustavo) | $520.000 | Sin confirmar en el papel — verificar si ya se pagó o también quedó a crédito |

**Total invertido en este pedido: $1.125.000**
**Valor de venta proyectado** (costo + 19% + 40%, ver fórmula en el Excel): **$1.873.700**
**Margen bruto proyectado:** ~$748.700 (66.5% sobre el costo)

### Puntos verificados/corregidos al pasar esto a limpio

- El código `KIT-AKT0` de Premium Racing venía repetido en dos productos distintos (AKT 110S/Wave 100 y AKT 125 NKD) — se les asignó código único (`KIT-AKT110SWAVE` / `KIT-AKT125NKD`) porque el POS no permite códigos duplicados.
- La línea manuscrita "Bujía CH7AS Eco" en la cotización de MotoGP se reconstruyó como 10 unidades a $4.500 porque así cuadra exacto con el total resaltado a mano ($520.000) — **pendiente confirmar con el proveedor**, la letra no era clara.
- El subtotal impreso en la cotización de MotoGP ($379.000) no cuadraba con la suma real de las filas — se usó el total escrito a mano y resaltado ($520.000) como el válido.

### Pendiente

- [ ] Confirmar la línea "Bujía CH7AS Eco" con MotoGP (cantidad y precio exactos).
- [ ] Confirmar si la cotización de MotoGP ya se pagó o también quedó a crédito.
- [ ] Cargar los productos al POS (código, costo, precio de venta, stock) siguiendo `03-procesos-operativos.md` sección 2 — usar el Excel como referencia, no copiar directo sin revisar los dos puntos anteriores.
- [ ] Registrar la deuda con Premium Racing ($605.000) en el módulo de compras/proveedores del POS para que quede en cuentas por pagar, no se pierda de vista.
