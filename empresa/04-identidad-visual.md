# Identidad visual — TecnoMotos LC

Estado: 🟡 los dos conceptos de ícono dibujados a mano (SVG geométrico) no convencieron al dueño. Se cambia de enfoque: generar el logo con IA (Gemini) usando el prompt de abajo. La paleta y tipografía de este documento quedan como referencia/respaldo, no como restricción para lo que genere Gemini.

## Prompt para generar el logo con Gemini

Copiar y pegar tal cual (deliberadamente no se le dice qué colores usar — que los elija el modelo):

> Diseña un logo profesional para "TecnoMotos LC", un taller mecánico y tienda de repuestos/accesorios para motocicletas en Cali, Colombia. Atiende principalmente motos populares de uso diario (100-150cc, marcas como Bajaj, AKT, Yamaha, Suzuki, Honda) — no motos de alto cilindraje ni de lujo.
>
> Personalidad de marca: confianza, transparencia y seriedad técnica, con un toque moderno/tecnológico que combine con la tradición mecánica de un taller — un negocio que acaba de empezar y quiere transmitir que hace las cosas bien desde el primer día, no un taller informal de barrio.
>
> Estilo: logo vectorial plano (flat design), minimalista, geométrico, sin fotorealismo, sin mascota ni personaje, sin ilustración detallada tipo clipart. Debe verse igual de bien como ícono pequeño (foto de perfil de Instagram/WhatsApp, favicon) que como rótulo grande de almacén.
>
> Símbolo: algo relacionado con motos (rueda, piñón, cadena, velocímetro) combinado de forma sutil con un elemento que sugiera tecnología/precisión (un circuito, una línea de datos, una forma geométrica de precisión) — un solo símbolo limpio, no recargado.
>
> Incluye el nombre "TecnoMotos" en tipografía bold/condensada, y "LC" como elemento secundario más pequeño (una placa o etiqueta) junto o debajo del nombre principal.
>
> Elige la paleta de colores que mejor comunique esta personalidad de marca — evita combinaciones genéricas de plantilla, que se sienta distintivo.
>
> Formato: fondo transparente, alto contraste, líneas limpias que funcionen también en un solo color (para grabado o vinilo) además de a color completo. Sin texto adicional, sin marcas de agua, sin fondo decorativo.

**Si el texto sale distorsionado** (les pasa seguido a los generadores de imagen con letras), pedir aparte esta versión sin texto y luego poner el nombre en Rajdhani/Barlow por separado (ver tipografía abajo):

> Genera la misma versión pero sin ningún texto ni letras — solo el símbolo/ícono, fondo transparente.

**Recomendación práctica:** generar 3-4 variaciones (cada corrida da un resultado distinto), elegir la que mejor se vea en pequeño (simula verla como foto de perfil circular) y traerla de vuelta acá para integrarla al POS y al resto de `empresa/marca/`. Una imagen generada por IA sale en PNG/raster, no vectorial — para rótulo grande o bordado en uniforme puede necesitar que un diseñador la vectorice después; para redes/WhatsApp/impresión normal no hace falta.

## Respaldo: los dos conceptos dibujados a mano (descartados)

Quedan en `empresa/marca/` (`icono-pinon-circuito.svg`, `icono-monograma-velocidad.svg`) y en el tablero publicado, por si ninguna generación de Gemini convence y se quiere volver a esta ruta.

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

- [ ] Generar el logo con el prompt de Gemini (sección de arriba) y traer las variaciones para elegir.
- [ ] Una vez elegido, actualizar la sección de paleta/tipografía de este documento con lo que Gemini haya definido (puede reemplazar Grafito/Candela/etc. si el resultado usa otros colores).
- [ ] Aplicar el logo elegido al sistema POS (`src/assets/logo.jpeg`) cuando se haga el rebranding técnico.
- [ ] Confirmar si el resultado de Gemini necesita vectorizarse para rótulo grande/bordado.
