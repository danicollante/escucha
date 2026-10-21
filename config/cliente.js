/*
 * Configuración del cliente — Escucha ciudadana (Plugueo)
 * ---------------------------------------------------------
 * Único archivo a editar para adaptar la demo a otro cliente: marca, colores,
 * jerarquía, lugares, categorías, equipos y textos.
 * LUGARES Y COORDENADAS SON DE EJEMPLO: validarlos con el municipio.
 */
window.ESCUCHA_CONFIG = {
  id: "villeta",                       // separa los datos de cada municipio
  cliente: "Municipalidad de Villeta",
  producto: "Villeta Escucha",
  logo: "assets/escudo-villeta.png",

  // Paleta "Río y arena": azul del río Paraguay, arena del escudo, ocre del pergamino
  colores: {
    primario: "#123a5c",
    primarioSuave: "#1f5f8b",
    sobrePrimario: "#f6ecd9",
    acento: "#c8862a",
    acentoTexto: "#a8621a",
    fondo: "#f6f1e7",
    tinta: "#182532",
    tintaSuave: "#4d5a66"
  },

  jerarquia: { ambito: "Toda la ciudad", nivel: "Zona", niveles: "Zonas", punto: "Lugar", puntos: "Lugares" },

  pregunta: "¿Cómo encontraste este lugar?",
  escala: [
    { valor: 1, etiqueta: "Muy mal" },
    { valor: 2, etiqueta: "Mal" },
    { valor: 3, etiqueta: "Bien" },
    { valor: 4, etiqueta: "Muy bien" }
  ],
  umbralDetalle: 2,      // de 1 a este valor se ofrece el detalle abierto
  slaHoras: 48,          // plazo para la primera respuesta municipal
  emergencia: "911",
  compromiso: "El equipo municipal revisa los reportes y responde dentro de las 48 horas hábiles.",

  // Antiabuso (en la demo se aplica en el navegador; en producción, en el servidor)
  antiabuso: {
    unaPorLugarYDia: true,   // una opinión computable por dispositivo, lugar y día (se puede actualizar)
    rafagaMinutos: 10,       // ventana para detectar ráfagas
    rafagaMinimo: 15         // opiniones en la ventana que mandan el grupo a revisión
  },

  categorias: ["Basura", "Iluminación", "Mobiliario dañado", "Seguridad", "Otro"],

  // Equipo sugerido por problema
  equipos: {
    "Basura": "Cuadrilla de limpieza",
    "Baños": "Mantenimiento de edificios",
    "Iluminación": "Alumbrado público",
    "Mobiliario dañado": "Obras y mantenimiento",
    "Seguridad": "Seguridad ciudadana",
    "Otro": "Intendencia",
    "Sin clasificar": "Intendencia"
  },

  zonas: ["Centro", "Ribereña", "Norte", "Sur"],

  // id → usado en el QR: f/?p=<id>
  lugares: {
    "plaza-central":    { nombre: "Plaza central",       tipo: "Plaza",     zona: "Centro",   lat: -25.5098, lng: -57.5596 },
    "plaza-iglesia":    { nombre: "Plaza de la iglesia", tipo: "Plaza",     zona: "Centro",   lat: -25.5072, lng: -57.5578 },
    "costanera":        { nombre: "Costanera",           tipo: "Paseo",     zona: "Ribereña", lat: -25.5121, lng: -57.5638 },
    "mirador":          { nombre: "Mirador del río",     tipo: "Paseo",     zona: "Ribereña", lat: -25.5046, lng: -57.5629 },
    "mercado":          { nombre: "Mercado municipal",   tipo: "Mercado",   zona: "Centro",   lat: -25.5110, lng: -57.5562,
                          categorias: ["Basura", "Baños", "Iluminación", "Seguridad", "Otro"] },
    "terminal":         { nombre: "Terminal de ómnibus", tipo: "Terminal",  zona: "Norte",    lat: -25.5011, lng: -57.5541,
                          categorias: ["Basura", "Baños", "Iluminación", "Seguridad", "Otro"] },
    "polideportivo":    { nombre: "Polideportivo",       tipo: "Deporte",   zona: "Norte",    lat: -25.4987, lng: -57.5582 },
    "cancha-norte":     { nombre: "Cancha barrio Norte", tipo: "Deporte",   zona: "Norte",    lat: -25.4962, lng: -57.5612 },
    "plaza-barrio-sur": { nombre: "Plaza barrio Sur",    tipo: "Plaza",     zona: "Sur",      lat: -25.5183, lng: -57.5571 },
    "parque-infantil":  { nombre: "Parque infantil",     tipo: "Infantil",  zona: "Sur",      lat: -25.5159, lng: -57.5530 }
  },

  mapa: { centro: [-25.5085, -57.5585], zoom: 15 }
};
