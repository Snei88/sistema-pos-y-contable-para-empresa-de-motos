# Identidad visual — TecnoMotos LC

Estado: 🟢 logo principal elegido (`marca/logo-tecnomotos-lc-v1.jpg`, generado con Gemini) — se usa como imagen de marca para redes/banners. Falta generar un ícono simplificado derivado del mismo estilo para tamaños pequeños/grabado (ver más abajo), y resolver el fondo transparente.

## Logo elegido

`empresa/marca/logo-tecnomotos-lc-v1.jpg` — moto deportiva estilo carreras (verde/negro/plata) con "TecnoMotos LC" en tipografía bold, skyline y bandera a cuadros. Generado con Gemini a partir del prompt de esta guía.

**Decisión consciente, documentada para no repetir la discusión después:**
- El estilo (moto deportiva de alto cilindraje) no coincide con el segmento real de clientes (motos populares de 100-150cc: Bajaj, AKT, Yamaha, Honda de uso diario/trabajo, según la investigación de mercado del informe día 1). Se usa igual como imagen de marca/energía visual, sabiendo que no representa literalmente la moto que va a entrar al taller — riesgo aceptado, no un error sin ver.
- El parecido de color/forma con un modelo real (estilo Kawasaki) es un riesgo bajo de marca a futuro si el negocio crece mucho — no bloquea el uso hoy, pero si en algún momento se hace merchandising a gran escala o franquicias, vale la pena encargar una versión 100% original a un diseñador.
- **Pendiente antes de usarlo en redes/rótulo:** el fondo es blanco sólido, no transparente — quitarlo con un editor (remove.bg o similar) antes de ponerlo sobre cualquier fondo que no sea blanco.

## Ícono simplificado (pendiente de generar)

Este logo no sirve en tamaños chicos (foto de perfil, favicon) ni para grabado/vinilo de un solo color — demasiado detalle. Se necesita un ícono derivado, mismo estilo/colores, mucho más simple. Prompt para Gemini:

> Toma el mismo logo de TecnoMotos LC (mismos colores verde/negro/plata, misma tipografía) pero simplifícalo a un ícono plano minimalista sin la moto fotorrealista — usa solo una silueta simple de rueda o velocímetro, para que se vea bien como ícono pequeño de 64x64 px y funcione también en un solo color. Fondo transparente.

## Prompt original (para nuevas variaciones o el ícono derivado)

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

## Respaldo (descartado)

Los dos conceptos de ícono dibujados a mano (`icono-pinon-circuito.svg`, `icono-monograma-velocidad.svg`) y su paleta grafito/candela/acero quedan en `empresa/marca/` y en el tablero publicado, solo como referencia histórica — el logo activo es el de Gemini (verde/negro/plata), no ese sistema.

## Paleta de marca (del logo elegido)

Tomada del resultado de Gemini — no fue una elección previa, se documenta después de verla para tener el hex exacto en el resto de piezas (rótulo, redes, POS):

| Color | Uso en el logo | Nota |
|---|---|---|
| Verde (estilo "racing") | Acentos de la moto y de "Motos" en el nombre | Color dominante — es lo que la gente va a recordar de la marca |
| Negro/grafito | Carrocería de la moto, sombras, contorno | Fondo natural para el logo (además del blanco original) |
| Plata/blanco | "Tecno" del nombre, reflejos, bandera a cuadros | Para texto/detalles sobre fondo oscuro |

*(Pendiente: sacar los hex exactos de la imagen cuando se tenga la versión con fondo transparente — por ahora se usa el logo tal como salió, sin forzarlo a una paleta de tokens predefinida.)*

## Tipografía

El logo ya trae su propia tipografía (bold/itálica tipo carreras) — para piezas donde no cabe el logo completo (un recibo, un pie de página, un formulario), usar:

| Uso | Fuente |
|---|---|
| Texto de uso general (redes, WhatsApp Business, avisos) | **Barlow** (Regular/SemiBold) — gratis en Google Fonts, limpia en pantalla de celular |
| Datos/códigos (precios, códigos de producto) | **IBM Plex Mono** — la misma familia que ya usan los documentos internos de `empresa/` |

**Nombre de marca escrito:** siempre "TecnoMotos LC".

## Uso — qué sí y qué no

- ✅ Logo completo (con la moto) en redes sociales, banners, portada de WhatsApp Business — donde el detalle se aprecia.
- ✅ Ícono simplificado (pendiente de generar, ver arriba) para foto de perfil, favicon, grabado/vinilo de un solo color.
- ❌ No usar el logo completo en tamaños menores a ~150px de ancho — se pierde el detalle y se ve sucio.
- ❌ No estirar ni deformar el logo — si hay que ajustar el ancho, dejar márgenes, no aplastar.
- ❌ No imprimir sobre fondo blanco el archivo actual sin antes recortar el fondo si el destino no es blanco (evita el "cuadro" alrededor).

## Pendiente

- [ ] Quitar el fondo blanco de `logo-tecnomotos-lc-v1.jpg` (remove.bg o similar) para uso en redes/rótulo sobre fondos de color.
- [ ] Generar el ícono simplificado (prompt de arriba) para tamaños pequeños y grabado de un solo color.
- [ ] Aplicar el logo elegido al sistema POS (`src/assets/logo.jpeg`) cuando se haga el rebranding técnico.
- [ ] Evaluar más adelante (si el negocio crece) encargar una versión 100% original a un diseñador, por el parecido de la moto con un modelo real.
