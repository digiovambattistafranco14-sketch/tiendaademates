/*
  CATÁLOGO DE TIENDA MATE
  -----------------------
  Este es el único archivo que necesitás tocar para cambiar productos y precios.

  - precio: número entero en pesos, sin puntos ni signo ($). Ej: 52000
  - categoria: "mates", "bolsos" o "kits"
  - imagenes: rutas a las fotos (la primera es la principal). Podés poner una o más.
  - personalizable: true muestra el campo "¿Qué te grabamos?" en el producto.
  - incluye: lista opcional de lo que trae (se muestra en kits).

  IMPORTANTE: los precios de abajo son de referencia. Reemplazalos por los reales.
*/

window.TIENDA = {
  nombre: "Tienda Mate",
  // Número de WhatsApp en formato internacional, sólo dígitos (54 9 11 ...)
  whatsapp: "5491161195525",
  whatsappVisible: "+54 9 11 6119-5525",
  instagram: "https://www.instagram.com/tiendaamatee/",
  tiktok: "https://www.tiktok.com/@tiendaamatee",
};

window.PRODUCTOS = [
  {
    id: "kit-viajero",
    nombre: "Kit Viajero",
    categoria: "kits",
    precio: 98000,
    imagenes: ["assets/img/p-kit.webp", "assets/img/p-canasta.webp"],
    descripcion:
      "Tu equipo de mate listo para acompañarte a todos lados. El mate se puede personalizar con grabado.",
    incluye: [
      "Canasta de cuero",
      "Mate imperial de calabaza",
      "Bombillón de alpaca",
      "Chaulata",
      "Termo de 1 litro",
      "Yerba Canarias edición especial",
    ],
    personalizable: true,
    destacado: true,
  },
  {
    id: "mate-imperial-personalizado",
    nombre: "Mate imperial personalizado",
    categoria: "mates",
    precio: 52000,
    imagenes: ["assets/img/p-mate-grabado.webp"],
    descripcion:
      "Calabaza forrada en cuero con virola de alpaca cincelada. Lo grabamos con el nombre, la fecha o la frase que quieras.",
    personalizable: true,
  },
  {
    id: "mate-imperial-laqueado",
    nombre: "Mate imperial laqueado",
    categoria: "mates",
    precio: 45000,
    imagenes: ["assets/img/p-imperial.webp"],
    descripcion:
      "Un imperial con su propio brillo: terminación laqueada y virola de alpaca con guarda.",
  },
  {
    id: "canasta-matera-cuero",
    nombre: "Canasta matera de cuero",
    categoria: "bolsos",
    precio: 56000,
    imagenes: ["assets/img/p-canasta.webp"],
    descripcion:
      "100% cuero, con guarda repujada y costura en zigzag. Entran el termo, el mate y la yerba.",
  },
  {
    id: "bolso-matero-gamuza",
    nombre: "Bolso matero de gamuza",
    categoria: "bolsos",
    precio: 39000,
    imagenes: ["assets/img/p-bolso-1.webp", "assets/img/p-bolso-2.webp"],
    descripcion:
      "Lindo, simple y cómodo. Con manijas y correa larga para llevar tu equipo de mate a todos lados.",
  },
];
