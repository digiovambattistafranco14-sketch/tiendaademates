# Design

Tienda online estilo Tienda Nube (canon de la categoría, elegido por el usuario). La marca vive en el durazno del logo, las fotos reales de producto y la voz rioplatense.

## Color

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--peach` | #FEDBB3 | #FEDBB3 | Fondo del logo. Campos de marca (hero, Kit destacado, Nosotros, íconos de pasos) |
| `--field` | = peach | #2E241B | Campo de marca adaptado al tema |
| `--ink` | #16161A | #F4F1EE | Texto principal |
| `--ink-2` / `--ink-3` | #57524D / #6F6963 | #C2BBB4 / #A39C95 | Texto secundario / metadatos |
| `--btn-bg` | #16161A | #FEDBB3 | Botón primario (tinta en claro, durazno en oscuro) |
| `--wa` | #1DA851 | #1DA851 | Sólo el botón flotante de WhatsApp y confirmaciones |

Estrategia: neutros + un campo de marca (durazno). Sin acentos adicionales.

**Sólo modo claro.** El usuario no quiere la versión oscura: la página ignora el modo oscuro del sistema (`color-scheme: light`, sin bloques `prefers-color-scheme: dark`). La columna "Oscuro" de arriba queda como referencia histórica, no se usa.

## Tipografía

- Display: Bricolage Grotesque 650-800, tracking -0.02 a -0.035em (títulos, totales).
- Texto e interfaz: Figtree 400-700. Precios con `tabular-nums`.

## Forma

- Paneles, tarjetas e imágenes: 16px. Inputs: 12px. Botones, chips y badges: píldora.
- Elevación sólo en hojas (carrito, ficha de producto) y toast. Tarjetas de producto sin sombra.

## Componentes

- Header sticky con blur, borde al hacer scroll. Menú desplegable en < 860px.
- Tarjeta de producto 4:5, segunda foto en hover (sólo puntero fino). Kit destacado ocupa 2 columnas sobre campo durazno.
- Ficha de producto: modal centrado en desktop, hoja inferior con barra de compra sticky en mobile. Campo "¿Qué te grabamos?" si `personalizable`.
- Carrito: panel lateral derecho con stepper, nombre + celular validados y envío a `wa.me` con mensaje armado.

## Header (clásico Tienda Nube, elegido por el usuario)

- Barra de anuncios rotativa (3 mensajes, 4,2s, se pausa con hover).
- Header fijo con fondo `--surface` translúcido (blur) y línea inferior. Al bajar suma sombra y el logo se achica a 0.88; si se sigue bajando (>24px acumulados) se oculta y reaparece al subir 12px. Queda visible cerca del tope, con el buscador en uso, al navegar con links y al agregar al carrito.
- Entrada en cascada al cargar (55ms entre elementos). Línea de 2px que se desliza entre categorías (hover y sección activa). Ícono del carrito se sacude al agregar. Placeholder del buscador rota cada 3,2s.
- Fila principal: logo a la izquierda, buscador visible al centro (máx. 560px) con resultados en vivo y teclado (flechas, Enter, Esc), Instagram y botón "Mi carrito" con contador y total a la derecha.
- Fila de categorías centrada: Inicio, Mates, Bolsos y canastas, Kits, Personalizados, Cómo comprar, Nosotros. Subrayado de 2px en hover y en la sección activa.
- Mobile (≤900px): menú, logo centrado y carrito; buscador a todo el ancho debajo. Menú a pantalla completa con links grandes en cascada.
- Descartado: header isla que se escondía, mega menú y resaltado viajero (al usuario no le gustaron).

## Movimiento

- Scroll suave con Lenis (lerp 0.085), desactivado con `prefers-reduced-motion`. Los links internos usan `lenis.scrollTo` con offset del header.
- Curvas: `--ease-out` cubic-bezier(0.23, 1, 0.32, 1); `--ease-drawer` cubic-bezier(0.32, 0.72, 0, 1); `--ease-in-out` cubic-bezier(0.77, 0, 0.175, 1).
- Hero: título palabra por palabra (máscara, 60ms entre palabras), foto se revela con clip-path y se asienta desde scale 1.18, punto comprable aparece a 1,2s con pulso.
- Al scroll: títulos `[data-split]` palabra por palabra; bloques `[data-reveal]` suben 26px con fade; fotos `[data-reveal="clip"]` se destapan; líneas de "Cómo comprar" se dibujan; wordmark del footer sube recortado.
- Parallax suave en hero, categorías y personalizados (`[data-parallax]`, 6-8%).
- Cinta de frases: se mueve sola y acelera y cambia de sentido según la velocidad del scroll.
- Hojas: entrada 460ms con curva drawer, salida 260ms. Botones `scale(.97)` al presionar. Badge del carrito rebota al agregar, botón cambia a "Agregado".
- `prefers-reduced-motion`: sin Lenis, sin parallax, sin desplazamientos; sólo opacidad.

## Contenido

- Catálogo y precios en `js/productos.js` (precios de referencia hasta que el dueño cargue los reales).
- Fotos: `assets/img/p-*.webp`, recortes 4:5 de posts de @tiendaamatee sin el texto superpuesto. Logo: `logo-mask.png`, vectorizado desde la foto de perfil y aplicado como máscara para respetar el tema.

## Rendimiento y adaptación

- Íconos: sprite SVG inline con sólo los 18 íconos de Phosphor que se usan (~6 KB) en lugar de las fuentes completas.
- Fotos: cada producto tiene `p-xxx.webp` (900px) y `p-xxx-480.webp`; `srcset`/`sizes` hacen que el celular baje la liviana. Fotos nuevas sin versión chica se usan tal cual.
- Logos como máscaras WebP sin pérdida. Scripts con `defer`, hero con `preload` + `fetchpriority="high"`.
- Breakpoints: ≤640 una columna (portada y personalizados); 641-980 dos columnas compactas; ≤900 header mobile con buscador a lo ancho; ≥1600 contenedor de 1360px.
- Inputs a 16px en mobile (evita el zoom de iPhone). Botones y links táctiles de 40-44px mínimo.
- Datos estructurados `Store` (schema.org) en el `<head>`.
- Fotos originales de Instagram en `fotos-originales/` (no hace falta subirlas).
