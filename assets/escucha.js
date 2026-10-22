/*
 * Núcleo compartido — Escucha ciudadana (Plugueo)
 * -------------------------------------------------
 * Termómetro de plazas + central de WhatsApp.
 * MODO DEMO: los datos de ejemplo se generan en el navegador y lo que se envía
 * desde el formulario se guarda en localStorage. En producción, guardarOpinion,
 * guardarDetalle, guardarAviso y decidirRevision llaman a la API, que repite
 * todas las validaciones y reglas antiabuso del lado del servidor.
 */
(function () {
  const C = window.ESCUCHA_CONFIG;
  const PRE = "escucha." + (C.id || "demo") + ".";
  const K = { opiniones: PRE + "opiniones", avisos: PRE + "avisos", revision: PRE + "revision" };
  const H = 36e5, DIA = 864e5, MIN = 6e4;
  const ETQ = Object.fromEntries(C.escala.map(e => [e.valor, e.etiqueta]));
  const NEG = C.umbralNegativo;
  const ACTOR = "Encargado (demo)";

  // ---------- Almacenamiento ----------
  function leer(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function escribir(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function disponible() { try { localStorage.setItem(PRE + "t", "1"); localStorage.removeItem(PRE + "t"); return true; } catch (e) { return false; } }

  function aplicarTema() {
    const c = C.colores, s = document.documentElement.style;
    s.setProperty("--pri", c.primario); s.setProperty("--pri-2", c.primarioSuave); s.setProperty("--on-pri", c.sobrePrimario);
    s.setProperty("--acc", c.acento); s.setProperty("--acc-txt", c.acentoTexto); s.setProperty("--bg", c.fondo);
    s.setProperty("--ink", c.tinta); s.setProperty("--ink-2", c.tintaSuave);
  }

  // ---------- Caritas ----------
  const ESCALA_COLOR = {
    1: { trazo: "#c62f2f", relleno: "#fdeaea", texto: "#b42323" },
    2: { trazo: "#b8730f", relleno: "#fdf1dc", texto: "#8a560a" },
    3: { trazo: "#4f8a1f", relleno: "#edf5e3", texto: "#3f7417" },
    4: { trazo: "#137a5d", relleno: "#e2f4ee", texto: "#137a5d" }
  };
  function carita(valor) {
    const c = ESCALA_COLOR[valor], s = c.trazo;
    let r;
    if (valor === 1) r = `<path d="M14 19 L21 16.5" stroke="${s}" stroke-width="2" stroke-linecap="round"/><path d="M38 19 L31 16.5" stroke="${s}" stroke-width="2" stroke-linecap="round"/><circle cx="19" cy="23.5" r="2.6" fill="${s}"/><circle cx="33" cy="23.5" r="2.6" fill="${s}"/><path d="M17 37 Q26 28 35 37" stroke="${s}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    else if (valor === 2) r = `<circle cx="19" cy="23" r="2.6" fill="${s}"/><circle cx="33" cy="23" r="2.6" fill="${s}"/><path d="M18 35 Q26 31.5 34 35" stroke="${s}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    else if (valor === 3) r = `<circle cx="19" cy="23" r="2.6" fill="${s}"/><circle cx="33" cy="23" r="2.6" fill="${s}"/><path d="M18 31 Q26 38 34 31" stroke="${s}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    else r = `<path d="M15 24 Q19 18.5 23 24" stroke="${s}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M29 24 Q33 18.5 37 24" stroke="${s}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M16 30 Q26 42 36 30 Z" stroke="${s}" stroke-width="2.2" fill="#ffffff" stroke-linejoin="round"/>`;
    return `<svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="${c.relleno}" stroke="${s}" stroke-width="1.8"/>${r}</svg>`;
  }

  // ---------- Utilidades ----------
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  const dos = n => String(n).padStart(2, "0");
  function diaDe(ts) { const d = new Date(ts); return d.getFullYear() + "-" + dos(d.getMonth() + 1) + "-" + dos(d.getDate()); }
  function inicioDia(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function plaza(id) { return id && Object.prototype.hasOwnProperty.call(C.plazas, id) ? Object.assign({ id }, C.plazas[id]) : null; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function fmt(n) { return Number(n).toLocaleString("es-PY"); }
  function hora(ts) { const d = new Date(ts); return dos(d.getHours()) + ":" + dos(d.getMinutes()); }
  function cuando(ts) {
    const d = Math.round((inicioDia(Date.now()) - inicioDia(ts)) / DIA);
    if (d === 0) return "hoy"; if (d === 1) return "ayer";
    const f = new Date(ts); return "el " + f.getDate() + "/" + (f.getMonth() + 1);
  }
  function hace(ts) {
    const m = Math.round((Date.now() - ts) / MIN);
    if (m < 1) return "recién"; if (m < 60) return `hace ${m} min`;
    const h = Math.round(m / 60); if (h < 24) return `hace ${h} h`;
    const d = Math.round(h / 24); return d === 1 ? "ayer" : `hace ${d} días`;
  }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // ---------- Escritura (demo) ----------
  // Una opinión computable por dispositivo, plaza y día: volver a opinar la actualiza.
  function guardarOpinion(p, score) {
    if (!plaza(p) || !ETQ[score]) return { ok: false, error: "invalida" };
    const arr = leer(K.opiniones, []), ahora = Date.now();
    const previa = arr.find(o => o.p === p && diaDe(o.ts) === diaDe(ahora));
    if (previa) {
      previa.score = score; previa.ts = ahora;
      if (score > NEG) { delete previa.cats; delete previa.texto; }
    } else arr.push({ id: uid(), p, score, ts: ahora });
    if (!escribir(K.opiniones, arr)) return { ok: false, error: "almacenamiento" };
    return { ok: true, id: previa ? previa.id : arr[arr.length - 1].id, actualizada: !!previa };
  }
  // "¿Qué viste?" se agrega a la misma opinión, no crea otro objeto.
  function guardarDetalle(id, cats, texto) {
    const arr = leer(K.opiniones, []), o = arr.find(x => x.id === id);
    if (!o || o.score > NEG) return { ok: false, error: "invalida" };
    o.cats = [...new Set((cats || []).filter(c => C.problemas.includes(c)))];
    o.texto = String(texto || "").trim().slice(0, 280);
    if (!o.cats.length && !o.texto) return { ok: false, error: "vacio" };
    return escribir(K.opiniones, arr) ? { ok: true } : { ok: false, error: "almacenamiento" };
  }
  function guardarAviso(tarjetaId, datos) {
    const all = leer(K.avisos, {});
    all[tarjetaId] = Object.assign({ ts: Date.now(), actor: ACTOR }, datos);
    return escribir(K.avisos, all);
  }
  function decidirRevision(grupo, decision) {
    const all = leer(K.revision, {}); all[grupo] = { decision, ts: Date.now(), actor: ACTOR };
    return escribir(K.revision, all);
  }
  function borrarDemo() { Object.values(K).forEach(k => { try { localStorage.removeItem(k); } catch (e) {} }); }

  // ---------- Datos de ejemplo (reproducibles, relativos a hoy) ----------
  // Cada plaza y cada día usan su propia semilla: un día ya generado no cambia al pasar las horas.
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const PERFIL = {
    "plaza-central": { vol: 7, sat: .82, drift: -.03 }, "plaza-iglesia": { vol: 5.5, sat: .80, drift: .03 },
    "plaza-san-jose": { vol: 4.6, sat: .66, drift: .05 }, "plaza-barrio-sur": { vol: 1.3, sat: .6, drift: .02 },
    "plaza-norte": { vol: 0, sat: .6, drift: 0 }
  };
  const PESO_DIA = [1.4, .7, .8, .85, .9, 1.1, 1.5];
  const PESO_PROB = { "Sucio": 3, "Sin luz": 1.6, "Algo roto": 1.4, "Otro": .6 };
  const TEXTOS = {
    "Sucio": ["Los basureros están llenos desde el fin de semana.", "Hay bolsas de basura acumuladas en la esquina.", "Mucha basura cerca de los juegos para chicos.", "Después del evento del sábado nadie limpió."],
    "Sin luz": ["De noche está muy oscuro, varias luces no funcionan.", "La luminaria de la entrada parpadea y se apaga.", "Falta luz en el sector de los bancos."],
    "Algo roto": ["Hay bancos rotos y un tobogán con tornillos sueltos.", "La hamaca está rota hace semanas.", "El bebedero pierde agua."],
    "Otro": ["El pasto está muy crecido.", "Hay perros sueltos que asustan a los chicos.", "Falta un cartel con el horario."]
  };
  const GUION = [
    { min: 220, score: 2, cats: ["Sucio"], texto: "Los basureros están llenos desde el sábado." },
    { min: 135, score: 1, cats: ["Sucio"], texto: "" },
    { min: 65, score: 2, cats: ["Sucio", "Algo roto"], texto: "Mucha basura cerca de los juegos y un banco roto." },
    { min: 25, score: 1, cats: ["Sucio"], texto: "" }
  ];

  let _ej = null, _ejDia = null;
  function ejemplo() {
    const hoy = inicioDia(Date.now());
    if (_ej && _ejDia === hoy) return _ej;
    const ahora = Date.now(), ops = [], decisiones = {};
    const numDia = t => Math.round((t + 12 * H) / DIA);
    Object.keys(C.plazas).forEach(id => {
      const P = PERFIL[id] || { vol: 2, sat: .65, drift: 0 };
      for (let d = 59; d >= 0; d--) {
        const f = hoy - d * DIA, fd = new Date(f), R = rng(hash(id) ^ (numDia(f) * 7919));
        const pick = a => a[Math.floor(R() * a.length)];
        let n = 0; { const l = P.vol * PESO_DIA[fd.getDay()]; if (l) { const L = Math.exp(-l); let p = 1; do { n++; p *= R(); } while (p > L); n--; } }
        const sat = Math.min(.95, Math.max(.2, P.sat + P.drift * (d < 7 ? 1 : d < 28 ? .3 : -.3)));
        // Reparto estratificado: la satisfacción diaria sigue el perfil sin ruido exagerado
        const nSat = Math.min(n, Math.max(0, Math.round(n * sat + (R() - .5))));
        const orden = Array.from({ length: n }, (_, k) => k < nSat).sort(() => R() - .5);
        for (let i = 0; i < n; i++) {
          const ts = f + (7 + R() * 14) * H;
          const score = orden[i] ? (R() < .55 ? 4 : 3) : (R() < .4 ? 1 : 2);
          const o = { id: `e-${id}-${d}-${i}`, p: id, score, ts, ej: true };
          if (score <= NEG && R() < .45) {
            const tot = C.problemas.reduce((a, c) => a + (PESO_PROB[c] || 1), 0);
            const pc = () => { let x = R() * tot; for (const c of C.problemas) { x -= PESO_PROB[c] || 1; if (x <= 0) return c; } return C.problemas[0]; };
            const c1 = pc(), cs = [c1]; if (R() < .25) { const c2 = pc(); if (c2 !== c1) cs.push(c2); }
            o.cats = cs; o.texto = R() < .5 ? pick(TEXTOS[c1] || TEXTOS["Otro"]) : "";
          }
          if (ts <= ahora) ops.push(o);
        }
        // Lo que ya hizo el encargado en días anteriores (hoy queda todo pendiente)
        if (d > 0) {
          const x = R();
          if (d === 1) { if (x < .6) decisiones[id + "|" + diaDe(f)] = { estado: "avisado", demoraH: 1 + R() * 4 }; }
          else decisiones[id + "|" + diaDe(f)] = x < .85 ? { estado: "avisado", demoraH: 1 + R() * 4 } : { estado: "descartado", demoraH: .5 + R() * 3 };
        }
      }
    });
    // Guion de la demo: hoy, varios vecinos marcaron "Sucio" en la plaza principal
    const pg = C.plazas["plaza-central"] ? "plaza-central" : Object.keys(C.plazas)[0];
    GUION.forEach((g, i) => {
      const ts = Math.min(ahora - (GUION.length - i) * 20000, Math.max(hoy + (i + 1) * MIN, ahora - g.min * MIN));
      ops.push({ id: "g-" + i, p: pg, score: g.score, cats: g.cats, texto: g.texto, ts, ej: true });
    });
    // Ráfaga sospechosa: 40 "Muy bien" en 6 minutos, hace 2 días
    const pr = C.plazas["plaza-iglesia"] ? "plaza-iglesia" : Object.keys(C.plazas)[0];
    const b0 = hoy - 2 * DIA + 14 * H + 2 * MIN;
    for (let i = 0; i < 40; i++) ops.push({ id: "b-" + i, p: pr, score: 4, ts: b0 + i * 9000, ej: true });
    _ej = { ops, decisiones }; _ejDia = hoy;
    return _ej;
  }

  // ---------- Modelo combinado: ejemplo + lo enviado en este navegador + decisiones ----------
  function sugerirContacto(cats) {
    const top = Object.entries(cats || {}).sort((a, b) => b[1] - a[1]).map(x => x[0]);
    for (const c of top) { const k = C.agenda.find(a => (a.problemas || []).includes(c)); if (k) return k; }
    return C.agenda[0] || null;
  }

  function modelo() {
    const ej = ejemplo(), ahora = Date.now();
    const mias = leer(K.opiniones, []).filter(o => plaza(o.p) && ETQ[o.score]).map(o => Object.assign({}, o, { mia: true }));
    const opiniones = ej.ops.map(o => Object.assign({}, o)).concat(mias);

    // Ráfagas: mismas reglas para elogios y críticas
    const ventana = C.antiabuso.rafagaMinutos * MIN, minimo = C.antiabuso.rafagaMinimo;
    const decRev = leer(K.revision, {}), grupos = {}, porPlaza = {};
    opiniones.forEach(o => (porPlaza[o.p] = porPlaza[o.p] || []).push(o));
    Object.values(porPlaza).forEach(lista => {
      lista.sort((a, b) => a.ts - b.ts);
      const marca = new Array(lista.length).fill(false);
      let i = 0;
      for (let j = 0; j < lista.length; j++) {
        while (lista[j].ts - lista[i].ts > ventana) i++;
        if (j - i + 1 >= minimo) for (let k = i; k <= j; k++) marca[k] = true;
      }
      let g = null;
      lista.forEach((o, k) => {
        if (!marca[k]) { g = null; return; }
        if (!g || o.ts - g.fin > ventana) { g = { id: o.p + ":" + Math.round(o.ts / MIN), p: o.p, ini: o.ts, fin: o.ts, ops: [] }; grupos[g.id] = g; }
        g.fin = o.ts; g.ops.push(o); o.grupo = g.id;
      });
    });
    Object.values(grupos).forEach(g => {
      const d = decRev[g.id];
      g.estado = d ? d.decision : "revision"; g.decision = d || null;
      const sc = {}; g.ops.forEach(o => sc[o.score] = (sc[o.score] || 0) + 1);
      g.dominante = +Object.entries(sc).sort((a, b) => b[1] - a[1])[0][0];
      g.ops.forEach(o => o.estado = g.estado);
    });
    opiniones.forEach(o => { if (!o.estado) o.estado = "admitida"; });

    // Tarjetas: opiniones negativas admitidas, agrupadas por plaza y día
    const avisos = leer(K.avisos, {}), map = {};
    opiniones.filter(o => o.estado === "admitida" && o.score <= NEG).forEach(o => {
      const id = o.p + "|" + diaDe(o.ts);
      (map[id] = map[id] || { id, p: o.p, dia: diaDe(o.ts), diaTs: inicioDia(o.ts), ops: [] }).ops.push(o);
    });
    // Un "Mal" aislado y sin detalle solo cuenta para el termómetro: no genera tarjeta (evita microgestión)
    const minTarjeta = C.tarjetaMinimo || 2;
    const tarjetas = Object.values(map).filter(t => t.ops.length >= minTarjeta || t.ops.some(o => (o.cats && o.cats.length) || o.texto)).map(t => {
      t.ops.sort((a, b) => a.ts - b.ts);
      t.n = t.ops.length;
      t.muyMal = t.ops.filter(o => o.score === 1).length; t.mal = t.n - t.muyMal;
      t.cats = {}; t.ops.forEach(o => (o.cats || []).forEach(c => t.cats[c] = (t.cats[c] || 0) + 1));
      t.comentarios = t.ops.filter(o => o.texto).map(o => ({ texto: o.texto, ts: o.ts, mia: !!o.mia })).reverse();
      t.tsUlt = t.ops[t.n - 1].ts;
      t.mia = t.ops.some(o => o.mia);
      t.sugerido = sugerirContacto(t.cats);
      let dec = avisos[t.id] || null;
      if (!dec && ej.decisiones[t.id]) {
        const s = ej.decisiones[t.id], ultEj = Math.max(...t.ops.filter(o => o.ej).map(o => o.ts));
        dec = { estado: s.estado, ts: Math.min(ahora - 10 * MIN, ultEj + s.demoraH * H), actor: ACTOR, ej: true };
        if (s.estado === "avisado") dec.contacto = t.sugerido ? t.sugerido.nombre : "";
      }
      t.estado = dec && dec.estado !== "pendiente" ? dec.estado : "pendiente";
      t.decision = t.estado === "pendiente" ? null : dec;
      t.nuevas = t.estado === "avisado" ? t.ops.filter(o => o.ts > dec.ts).length : 0;
      return t;
    }).sort((a, b) => b.tsUlt - a.tsUlt);

    return { opiniones, tarjetas, grupos: Object.values(grupos).sort((a, b) => b.ini - a.ini) };
  }

  // ---------- Mensaje de WhatsApp ----------
  function listar(a) { return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " y " + a[a.length - 1]; }
  function mensaje(t, contacto) {
    const cats = Object.entries(t.cats).sort((a, b) => b[1] - a[1]);
    const resumen = cats.length
      ? listar(cats.map(([c, n], i) => i === 0 ? `${n} ${n === 1 ? "vecino marcó" : "vecinos marcaron"} '${c}'` : `${n} '${c}'`))
      : `${t.n} ${t.n === 1 ? "vecino dio una opinión negativa" : "vecinos dieron una opinión negativa"}`;
    const com = t.comentarios[0] ? ` Un comentario: '${t.comentarios[0].texto.replace(/[.\s]+$/, "")}'.` : "";
    const v = { nombre: contacto ? contacto.nombre : "", plaza: C.plazas[t.p].nombre, cuando: cuando(t.tsUlt), resumen, comentario: com, producto: C.producto };
    return C.mensaje.replace(/\{(\w+)\}/g, (m, k) => k in v ? v[k] : m).replace(/\s+,/g, ",").replace(/ {2,}/g, " ").trim();
  }
  function enlaceWhatsApp(telefono, texto) {
    const tel = String(telefono || "").replace(/\D/g, "");
    return "https://wa.me/" + tel + "?text=" + encodeURIComponent(texto);
  }

  window.Escucha = {
    C, K, ETQ, NEG, ESCALA_COLOR, H, DIA, MIN,
    aplicarTema, carita, plaza, disponible, uid,
    guardarOpinion, guardarDetalle, guardarAviso, decidirRevision, borrarDemo,
    modelo, mensaje, enlaceWhatsApp, sugerirContacto, esc, fmt, hora, hace, cuando, diaDe, inicioDia
  };
})();
