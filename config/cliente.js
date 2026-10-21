/*
 * Configuración del cliente — Escucha ciudadana (Plugueo)
 * ---------------------------------------------------------
 * Único archivo a editar para adaptar la demo a otro cliente: marca, colores,
 * plazas, problemas, agenda de la central y textos.
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

  pregunta: "¿Cómo encontraste la plaza?",
  escala: [
    { valor: 1, etiqueta: "Muy mal" },
    { valor: 2, etiqueta: "Mal" },
    { valor: 3, etiqueta: "Bien" },
    { valor: 4, etiqueta: "Muy bien" }
  ],
  umbralNegativo: 2,     // Muy mal y Mal ofrecen "¿Qué viste?" y llegan a "Para avisar hoy"
  emergencia: "Si es una emergencia, llamá al 911.",

  // Antiabuso (en la demo se aplica en el navegador; en producción, en el servidor)
  antiabuso: {
    rafagaMinutos: 10,   // ventana para detectar ráfagas
    rafagaMinimo: 15     // opiniones en la ventana que mandan el grupo a revisión
  },

  problemas: ["Sucio", "Sin luz", "Algo roto", "Otro"],

  // PLAZAS DE EJEMPLO: nombres y coordenadas aproximadas, a validar con el municipio.
  // El id se usa en el QR: f/?p=<id>
  plazas: {
    "plaza-central":    { nombre: "Plaza central",       lat: -25.5098, lng: -57.5596 },
    "plaza-iglesia":    { nombre: "Plaza de la iglesia", lat: -25.5072, lng: -57.5578 },
    "plaza-san-jose":   { nombre: "Plaza San José",      lat: -25.5134, lng: -57.5549 },
    "plaza-barrio-sur": { nombre: "Plaza barrio Sur",    lat: -25.5183, lng: -57.5571 },
    "plaza-norte":      { nombre: "Plaza barrio Norte",  lat: -25.4975, lng: -57.5603 }
  },

  // Agenda de la central. Teléfono en formato internacional, solo dígitos: 5959XXXXXXXX
  // (595 = Paraguay, sin el 0 inicial del celular). Vacío: WhatsApp pide elegir el contacto.
  // "problemas" es opcional: sugiere a quién avisar según lo que marcaron los vecinos.
  agenda: [
    { nombre: "Juan",   rol: "Limpieza",      telefono: "", problemas: ["Sucio"] },
    { nombre: "Rosa",   rol: "Alumbrado",     telefono: "", problemas: ["Sin luz"] },
    { nombre: "Carlos", rol: "Mantenimiento", telefono: "", problemas: ["Algo roto", "Otro"] }
  ],

  // Mensaje de WhatsApp. Variables: {nombre} {plaza} {cuando} {resumen} {comentario} {producto}
  mensaje: "Hola {nombre}, en {plaza} {cuando} {resumen}.{comentario} ¿Podés revisar? — {producto}"
};
