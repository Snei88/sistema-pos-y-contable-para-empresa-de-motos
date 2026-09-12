# Identidad visual — TecnoMotos LC

Estado: 🟡 dos conceptos de ícono listos para elegir; el resto de la identidad (paleta, tipografía, uso) ya está definido y no depende de cuál ícono se elija.

Vista completa con los dos conceptos renderizados: **ver el artifact publicado** (enlazado en la conversación) o abrir los archivos `.svg` de esta carpeta directamente.

## Los dos conceptos de ícono

Ambos están en `empresa/marca/` como SVG (vectorial — se puede imprimir en cualquier tamaño, de un aviso grande a un ícono de WhatsApp, sin perder calidad):

1. **`icono-pinon-circuito.svg`** — un piñón (la pieza de transmisión, coherente con que el negocio es justo eso: mecánica) con un pequeño trazo de circuito saliendo de un diente — la parte "tecno" literal dentro de la parte "moto" literal. Más técnico y serio.
2. **`icono-monograma-velocidad.svg`** — una "T" sólida con dos líneas de velocidad detrás, como el trazo de una rueda girando rápido. Más simple, se lee mejor en tamaños muy pequeños (favicon, foto de perfil circular de Instagram/WhatsApp).

Los dos usan los mismos dos colores (cromo + candela — ver paleta abajo) para que sirvan igual de bien sobre fondo claro u oscuro sin necesitar una versión "invertida" aparte.

## Paleta de marca

| Token | Hex | Rol |
|---|---|---|
| **Grafito** | `#1B1E21` | Fondo oscuro / textos sobre fondo claro |
| **Papel** | `#F1EFE7` | Fondo claro / textos sobre fondo oscuro |
| **Candela** | `#E4622A` | Acento principal — el color de marca. Úsalo en el ícono, en el detalle de rótulo, en botones/CTAs de redes. |
| **Acero** | `#2D6E82` | Acento secundario — para no saturar todo de naranja; sirve para franjas, fondos de sección, texto de énfasis. |
| **Cromo** | `#A9AFB3` | Neutro metálico — la estructura del ícono y líneas finas. |
| **Destello** | `#F2A65A` | Tinte claro de Candela — solo para brillos/gradientes sutiles, nunca como color principal. |

**Regla simple:** Grafito + Papel son la base (uno de fondo, el otro de texto, según dónde se use). Candela es el color que la gente debe asociar con la marca — no lo repartas en todo, resérvalo para el ícono y un acento por pieza (un botón, un detalle del rótulo, el borde de una tarjeta de presentación).

## Tipografía

| Uso | Fuente | Por qué |
|---|---|---|
| Logotipo / títulos grandes | **Rajdhani** (Bold/SemiBold) | Condensada y de trazo técnico — es la que carga la personalidad "tecno" de la marca. Gratis en Google Fonts. |
| Texto de uso general (redes, WhatsApp Business, avisos) | **Barlow** (Regular/SemiBold) | Limpia y cálida, buena legibilidad en letreros y pantallas de celular. |
| Datos/códigos (precios en lista, códigos de producto en un aviso) | **IBM Plex Mono** | Números alineados, look de ficha técnica — la misma familia que ya usan los documentos internos de `empresa/`. |

**Nombre de marca escrito:** siempre "TecnoMotos LC" (T y M mayúsculas juntas, sin espacio en "TecnoMotos"; "LC" separado). En el logotipo grande, "LC" puede ir como una placa/etiqueta pequeña al lado o debajo del nombre principal, no del mismo tamaño.

## Uso — qué sí y qué no

- ✅ Ícono a color (cromo + candela) sobre fondo grafito, papel, o una foto (tiene contraste en los tres casos).
- ✅ Versión solo texto ("TecnoMotos LC" en Rajdhani) cuando el espacio es muy angosto (un renglón de recibo, un pie de página).
- ❌ No estirar ni deformar el ícono — si hay que ajustar el ancho, se dejan márgenes en blanco, no se aplasta.
- ❌ No poner el ícono sobre fondos de bajo contraste (ej. candela sobre un naranja parecido) — usar siempre grafito, papel, o una foto con suficiente contraste detrás.
- ❌ No mezclar los dos conceptos de ícono en una misma pieza (elegir uno como el oficial una vez se decida).

## Pendiente

- [ ] Elegir entre "Piñón circuito" y "Monograma velocidad" como ícono oficial (o pedir una tercera variante).
- [ ] Aplicar el ícono elegido al logo del sistema POS (`src/assets/logo.jpeg`) cuando se haga el rebranding técnico.
- [ ] Definir tamaño mínimo de impresión (para que el trazo del circuito/las líneas de velocidad no se pierdan en un aviso muy pequeño).
