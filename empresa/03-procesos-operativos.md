# Procesos operativos

Estado: 🟢 en uso desde el día 1. Estos son los procesos mínimos para no perder trazabilidad de dinero ni de inventario desde la primera venta — se amplían con el tiempo, no hay que memorizar todo de una vez.

## 1. Apertura de caja (todos los días, antes de vender)

1. Contar el efectivo físico con el que se abre el día.
2. Abrir sesión de caja en el POS (módulo Caja → Abrir caja) con ese monto exacto como saldo inicial.
3. Nunca vender sin una sesión de caja abierta — si el POS no deja registrar una venta, es la primera señal de que falta este paso.

## 2. Recepción de mercancía (aplica a lo que llega hoy)

**Regla de oro: nada entra al estante sin quedar primero en el sistema.** Es la diferencia entre tener trazabilidad de margen desde el día 1 o no tenerla nunca.

Por cada producto que llega:

1. **Verificar contra la factura del proveedor**: cantidad recibida = cantidad facturada. Si hay diferencia, anotarla antes de guardar la mercancía.
2. **Registrar en el POS** (módulo Inventario → Productos → Nuevo, o Compras si ya se cargó como orden de compra):
   - Código (interno o el del proveedor — debe ser único)
   - Nombre descriptivo (que se entienda en una factura: "Pastillas freno del. AKT NKD 125", no solo "pastillas")
   - Categoría (ya existen: Frenos, Motor, Suspensión, Transmisión, Eléctrico, Carrocería, Aceites y Lubricantes, Llantas, Filtros, Varios)
   - Costo (lo que se pagó al proveedor)
   - Precio de venta
   - Stock inicial (la cantidad que llegó)
   - Stock mínimo (punto de alerta — si no se sabe todavía, usar 3 como default y ajustar después de las primeras semanas)
3. **Marcar/etiquetar físicamente** el producto con el código del sistema si es posible (facilita la venta después).
4. Solo después de estos 3 pasos, el producto va al estante.

Si llega mucho volumen de una vez y no da tiempo de registrar producto por producto, usar el módulo de Compras (registrar la compra completa al proveedor) — igual queda trazado, y el detalle de cada producto se completa el mismo día antes de cerrar.

## 3. Venta en mostrador

1. Buscar el producto por código o nombre en el POS.
2. **Asociar la venta a un cliente siempre que sea posible** (aunque sea "Cliente Ocasional" con el nombre/teléfono si lo dan) — sin esto no se puede medir recompra ni hacer seguimiento después. Si es la primera vez que compra, crearlo como cliente nuevo (nombre y teléfono como mínimo, para poder contactarlo después).
3. Cobrar y registrar el método de pago exacto (efectivo, tarjeta, transferencia, Nequi, Daviplata, crédito).
4. Si es a crédito, queda automáticamente en el módulo de cartera — no fiar por fuera del sistema, ni de palabra.
5. Entregar el recibo/factura generado por el POS.

## 4. Orden de trabajo (taller)

1. Registrar la moto (placa, marca, modelo) y el cliente si no están ya en el sistema.
2. Crear la orden de trabajo con la descripción del problema que reporta el cliente.
3. Diagnóstico por escrito antes de reparar (aunque sea una nota corta) — es la base de la diferenciación comercial (ver `02-estrategia-comercial-marketing.md`, "diagnóstico transparente").
4. Avisar tiempo estimado de entrega al cliente en ese momento, no después.
5. Mover el estado de la orden según avanza: pendiente → en proceso → finalizado → entregado. Al pasar a "finalizado" el sistema descuenta automáticamente el stock de los repuestos usados — por eso es importante que los repuestos usados queden cargados en la orden, no solo mencionados de palabra.
6. Al entregar, dar el recibo con el detalle de repuestos + mano de obra, y la garantía aplicable.

## 5. Cierre de caja (todos los días, al final)

1. Contar el efectivo físico real.
2. Cerrar la sesión de caja en el POS — el sistema calcula el saldo esperado según las ventas del día y muestra la diferencia contra el conteo real.
3. Si hay diferencia, anotar la razón (nunca dejarla sin explicación) — diferencias repetidas son una alerta de control interno, no un descuido normal.

## 6. Backup de la base de datos

- El POS tiene backup manual/automático (Ajustes → Backup). Mientras se define una rutina automática confiable, hacer backup manual al cerrar el día — es un archivo, toma segundos, y es la única copia de todo lo vendido, comprado y de la cartera.

## Pendiente de definir

- [ ] Texto exacto de garantía por repuesto/mano de obra (para imprimir en el recibo).
- [ ] Quién hace el backup diario y dónde se guarda (no solo en el mismo PC del almacén — un disco externo o la nube evita perderlo todo si falla la máquina).
- [ ] Protocolo si un cliente no puede pagar el total y se necesita crédito parcial (cuánto se exige de anticipo mínimo).
