/*
 * Núcleo compartido — Escucha ciudadana (Plugueo)
 * -------------------------------------------------
 * MODO DEMO: los datos de ejemplo se generan en el navegador y lo que se envía
 * desde el formulario se guarda en localStorage. En producción, guardarOpinion,
 * guardarReporte, guardarEvento y decidirRevision llaman a la API, que repite
 * todas las validaciones y reglas antiabuso del lado del servidor.
 */
(function () {
  const C = window.ESCUCHA_CONFIG;
  const PRE = "escucha." + (C.id || "demo") + ".";
  const K = { opiniones: PRE + "opiniones", reportes: PRE + "reportes", eventos: PRE + "eventos", revision: PRE + "revision" };
  const H = 36e5, DIA = 864e5, MIN = 6e4;
  const ETQ = Object.fromEntries(C.escala.map(e => [e.valor, e.etiqueta]));
  const ABIERTOS = ["Nueva", "Reabierta", "Asignada", "En proceso", "Programada"];

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
  function codigoDe(id) {
    let h = 2166136261; for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
    const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; h >>>= 0;
    for (let i = 0; i < 5; i++) { s += A[h % 32]; h = Math.floor(h / 32); }
    return (C.id || "ES").slice(0, 2).toUpperCase() + "-" + s;
  }
  function diaDe(ts) { const d = new Date(ts); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function lugar(id) { return id && Object.prototype.hasOwnProperty.call(C.lugares, id) ? Object.assign({ id }, C.lugares[id]) : null; }
  function categoriasDe(p) { return (C.lugares[p] && C.lugares[p].categorias) || C.categorias; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function fmt(n) { return Number(n).toLocaleString("es-PY"); }
  function hace(ts) {
    const m = Math.round((Date.now() - ts) / MIN);
    if (m < 1) return "recién"; if (m < 60) return `hace ${m} min`;
    const h = Math.round(m / 60); if (h < 24) return `hace ${h} h`;
    const d = Math.round(h / 24); return d === 1 ? "ayer" : `hace ${d} días`;
  }
  function fecha(ts, conHora) {
    const o = { day: "numeric", month: "short" }; if (conHora) { o.hour = "2-digit"; o.minute = "2-digit"; }
    return new Date(ts).toLocaleString("es-PY", o);
  }

  // ---------- Escritura (demo) ----------
  function guardarOpinion(p, score) {
    if (!lugar(p) || !ETQ[score]) return { ok: false, error: "invalida" };
    const arr = leer(K.opiniones, []), ahora = Date.now();
    let previa = null, op;
    if (C.antiabuso.unaPorLugarYDia) previa = arr.find(o => o.p === p && diaDe(o.ts) === diaDe(ahora));
    if (previa) { op = Object.assign({}, previa); previa.score = score; previa.ts = ahora; previa.actualizada = true; }
    else { op = null; arr.push({ id: uid(), p, score, ts: ahora }); }
    if (!escribir(K.opiniones, arr)) return { ok: false, error: "almacenamiento" };
    return { ok: true, id: previa ? previa.id : arr[arr.length - 1].id, actualizada: !!previa, anterior: op };
  }
  function revertirOpinion(res) {
    let arr = leer(K.opiniones, []);
    if (res.actualizada && res.anterior) arr = arr.map(o => o.id === res.id ? res.anterior : o);
    else arr = arr.filter(o => o.id !== res.id);
    return escribir(K.opiniones, arr);
  }
  function guardarReporte(r) {
    if (!lugar(r.p)) return { ok: false, error: "invalida" };
    const permitidas = categoriasDe(r.p);
    const cats = (r.cats || []).filter(c => permitidas.includes(c));
    const texto = String(r.texto || "").slice(0, 500).trim();
    let foto = r.foto && r.foto.length < 450000 ? r.foto : null;
    if (!r.reabre && !cats.length && !texto && !foto && !r.peligro) return { ok: false, error: "vacio" };
    const arr = leer(K.reportes, []);
    const id = r.id || uid();
    if (arr.some(x => x.id === id)) return { ok: true, codigo: codigoDe(id), repetido: true };
    const rep = { id, p: r.p, opinionId: r.opinionId || null, score: r.score || null, cats, texto, foto, peligro: !!r.peligro, reabre: r.reabre || null, ts: Date.now() };
    arr.push(rep);
    let sinFoto = false;
    if (!escribir(K.reportes, arr)) {
      rep.foto = null; sinFoto = !!foto;
      if (!escribir(K.reportes, arr)) return { ok: false, error: "almacenamiento" };
    }
    return { ok: true, codigo: codigoDe(id), sinFoto };
  }
  function guardarEvento(casoId, ev) {
    const all = leer(K.eventos, {});
    (all[casoId] = all[casoId] || []).push(Object.assign({ ts: Date.now(), actor: "Operador (demo)" }, ev));
    return escribir(K.eventos, all);
  }
  function decidirRevision(grupo, decision, motivo) {
    const all = leer(K.revision, {}); all[grupo] = { decision, motivo: motivo || "", ts: Date.now(), actor: "Operador (demo)" };
    return escribir(K.revision, all);
  }
  function borrarDemo() { Object.values(K).forEach(k => { try { localStorage.removeItem(k); } catch (e) {} }); }

  // ---------- Datos de ejemplo (reproducibles, relativos a hoy) ----------
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const PERFIL = {
    "plaza-central": { vol: 6, sat: .79, drift: 0 }, "plaza-iglesia": { vol: 3.4, sat: .84, drift: .02 },
    "costanera": { vol: 7, sat: .60, drift: .10 }, "mirador": { vol: 2, sat: .72, drift: 0 },
    "mercado": { vol: 5, sat: .52, drift: -.12 }, "terminal": { vol: 4.4, sat: .45, drift: -.03 },
    "polideportivo": { vol: 2.8, sat: .76, drift: .04 }, "cancha-norte": { vol: 0, sat: .6, drift: 0 },
    "plaza-barrio-sur": { vol: .7, sat: .55, drift: 0 }, "parque-infantil": { vol: 1.6, sat: .66, drift: -.06 }
  };
  const PESO_DIA = [1.4, .7, .8, .85, .9, 1.1, 1.5];
  const TEXTOS = {
    "Basura": ["Los basureros están llenos desde el fin de semana.", "Hay bolsas de basura acumuladas en la esquina.", "Mucha basura cerca de los juegos para chicos.", "Después del evento del sábado nadie limpió."],
    "Iluminación": ["De noche está muy oscuro, varias luces no funcionan.", "La luminaria de la entrada parpadea y se apaga.", "Falta luz en el sector de los bancos."],
    "Mobiliario dañado": ["Hay bancos rotos y un tobogán con tornillos sueltos.", "Falta una tapa de registro, es peligroso.", "La hamaca está rota hace semanas."],
    "Seguridad": ["Hay vidrios rotos en el piso cerca de los juegos.", "De noche se juntan motos haciendo picadas.", "No hay nadie de seguridad a la tarde."],
    "Baños": ["El baño no tiene agua ni papel.", "Los baños están cerrados desde temprano.", "El baño de mujeres está muy sucio."],
    "Otro": ["El pasto está muy crecido.", "Hay perros sueltos que asustan a los chicos.", "Falta señalización para llegar."]
  };
  const NOTAS = {
    "Basura": ["Se vaciaron los contenedores y se limpió el sector.", "Se sumó una recolección extra los domingos.", "Se limpió el área y se colocó un contenedor adicional."],
    "Iluminación": ["Se reemplazaron 3 luminarias por LED.", "Se reparó el cableado del sector de bancos."],
    "Mobiliario dañado": ["Se repararon 2 bancos y se ajustó el tobogán.", "Se repuso la tapa de registro."],
    "Seguridad": ["Se retiraron los vidrios y se coordinó patrullaje nocturno.", "Se mejoró la iluminación del acceso."],
    "Baños": ["Se repuso agua y papel; se fijó horario de limpieza.", "Se reabrieron los baños con horario extendido."],
    "Otro": ["Se cortó el pasto del sector.", "Se colocó señalización."],
    "Sin clasificar": ["Se revisó el lugar y se resolvió lo reportado."]
  };
  const MOTIVO_PROG = "Requiere compra de materiales; se informará el avance.";

  let _ej = null;
  function ejemplo() {
    if (_ej) return _ej;
    const R = rng(574), pick = a => a[Math.floor(R() * a.length)];
    const poisson = l => { if (!l) return 0; let L = Math.exp(-l), k = 0, p = 1; do { k++; p *= R(); } while (p > L); return k - 1; };
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const ahora = Date.now(), ops = [], reps = [];
    Object.keys(C.lugares).forEach(id => {
      const P = PERFIL[id] || { vol: 2, sat: .65, drift: 0 }, cats = categoriasDe(id);
      for (let d = 55; d >= 0; d--) {
        const f = new Date(hoy.getTime() - d * DIA);
        const n = poisson(P.vol * PESO_DIA[f.getDay()]);
        const sat = Math.min(.95, Math.max(.2, P.sat + P.drift * (d < 14 ? 1 : -0.3)));
        for (let i = 0; i < n; i++) {
          const ts = f.getTime() + (7 + R() * 14) * H;
          if (ts > ahora) { R(); continue; }
          const score = R() < sat ? (R() < .55 ? 4 : 3) : (R() < .4 ? 1 : 2);
          const oid = `e-${id}-${d}-${i}`;
          ops.push({ id: oid, p: id, score, ts, ej: true });
          if (score <= C.umbralDetalle && R() < .45) {
            const pesos = cats.map(c => c === "Basura" || c === "Baños" ? 3 : c === "Otro" ? .6 : 1.5), tot = pesos.reduce((a, b) => a + b, 0);
            const pc = () => { let x = R() * tot; for (let k = 0; k < cats.length; k++) { x -= pesos[k]; if (x <= 0) return cats[k]; } return cats[0]; };
            const c1 = pc(), cs = [c1]; if (R() < .25) { const c2 = pc(); if (c2 !== c1) cs.push(c2); }
            reps.push({ id: "r" + oid, p: id, opinionId: oid, score, cats: cs, texto: R() < .6 ? pick(TEXTOS[c1] || TEXTOS["Otro"]) : "", foto: null,
              peligro: (c1 === "Seguridad" || c1 === "Mobiliario dañado") && R() < .3, ts: ts + 30000, ej: true });
          }
        }
      }
    });
    // Ráfaga sospechosa: 38 "Muy bien" en 6 minutos en la Costanera, hace 3 días
    const b0 = hoy.getTime() - 3 * DIA + 14 * H + 2 * MIN;
    for (let i = 0; i < 38; i++) ops.push({ id: "b-" + i, p: "costanera", score: 4, ts: b0 + i * 9500, ej: true });

    // Casos de ejemplo: reportes del mismo lugar y problema se agrupan; cada caso tiene su ciclo
    reps.sort((a, b) => a.ts - b.ts);
    const casos = [], abiertos = {};
    reps.forEach(r => {
      const cat = r.cats[0], key = r.p + "|" + cat, c = abiertos[key];
      if (c && r.ts - c.ts0 < 6 * DIA && !(c.finTs && c.finTs < r.ts)) { c.reportes.push(r); if (r.peligro) c.peligro = true; return; }
      const nc = { id: "c-" + r.id, p: r.p, cat, ts0: r.ts, reportes: [r], peligro: r.peligro, base: [], ej: true };
      const equipo = C.equipos[cat] || "Intendencia";
      const sinRespuesta = ahora - r.ts < 5 * DIA && ahora - r.ts > 2.2 * DIA && R() < .25;   // casos vencidos para la demo
      const t1 = sinRespuesta ? 9999 : R() < .14 ? 52 + R() * 40 : 1 + R() * 20, t2 = t1 + 2 + R() * 18;
      const prog = (cat === "Iluminación" || cat === "Mobiliario dañado") && !nc.peligro && R() < .2;
      const t3 = prog ? null : t2 + 3 + R() * (nc.peligro ? 20 : 70);
      const ev = [{ ts: r.ts + t1 * H, estado: "Asignada", responsable: equipo, nota: "Asignado a " + equipo, actor: "Mesa de entrada" },
                  { ts: r.ts + t2 * H, estado: "En proceso", actor: equipo }];
      if (prog) {
        ev.push({ ts: r.ts + (t2 + 1) * H, estado: "Programada", nota: MOTIVO_PROG, hasta: r.ts + 18 * DIA, actor: equipo });
        ev.push({ ts: r.ts + (15 + R() * 3) * DIA, estado: "Resuelta", nota: pick(NOTAS[cat]), actor: equipo });
      } else ev.push({ ts: r.ts + t3 * H, estado: "Resuelta", nota: pick(NOTAS[cat] || NOTAS["Sin clasificar"]), actor: equipo });
      nc.base = ev.filter(e => e.ts <= ahora);
      nc.finTs = ev[ev.length - 1].ts;
      casos.push(nc); abiertos[key] = nc;
    });
    // Caso guion para la demo: un peligro reciente, ya asignado y dentro de plazo
    if (C.lugares["parque-infantil"]) {
      const t = ahora - 20 * H, rp = { id: "r-guion-1", p: "parque-infantil", opinionId: null, score: 1, cats: ["Mobiliario dañado"], texto: "La hamaca tiene la cadena cortada, un nene casi se cae.", foto: null, peligro: true, ts: t, ej: true };
      const eq = C.equipos["Mobiliario dañado"];
      casos.push({ id: "c-guion-1", p: rp.p, cat: rp.cats[0], ts0: t, reportes: [rp], peligro: true, ej: true,
        base: [{ ts: t + 1.5 * H, estado: "Asignada", responsable: eq, nota: "Asignado a " + eq, actor: "Mesa de entrada" }] });
    }
    _ej = { ops, casos };
    return _ej;
  }

  // ---------- Modelo combinado: ejemplo + lo enviado en este navegador + decisiones ----------
  function modelo() {
    const ej = ejemplo();
    const misOps = leer(K.opiniones, []).filter(o => lugar(o.p) && ETQ[o.score]).map(o => Object.assign({}, o, { mia: true }));
    const opiniones = ej.ops.map(o => Object.assign({}, o)).concat(misOps);

    // Detección de ráfagas: mismas reglas para elogios y críticas
    const ventana = C.antiabuso.rafagaMinutos * MIN, minimo = C.antiabuso.rafagaMinimo;
    const decisiones = leer(K.revision, {}), grupos = {};
    const porLugar = {};
    opiniones.forEach(o => (porLugar[o.p] = porLugar[o.p] || []).push(o));
    Object.values(porLugar).forEach(lista => {
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
      const d = decisiones[g.id];
      g.estado = d ? d.decision : "revision"; g.decision = d || null;
      const sc = {}; g.ops.forEach(o => sc[o.score] = (sc[o.score] || 0) + 1);
      g.dominante = +Object.entries(sc).sort((a, b) => b[1] - a[1])[0][0];
      g.ops.forEach(o => o.estado = g.estado);
    });
    opiniones.forEach(o => { if (!o.estado) o.estado = "admitida"; });

    // Casos
    const eventos = leer(K.eventos, {});
    const casos = ej.casos.map(c => Object.assign({}, c, { reportes: c.reportes.slice(), eventos: c.base.slice() }));
    const misReps = leer(K.reportes, []).filter(r => lugar(r.p)).map(r => Object.assign({}, r, { mia: true, codigo: codigoDe(r.id) }));
    casos.forEach(c => c.reportes.forEach(r => r.codigo = codigoDe(r.id)));
    const estadoA = (c, ts) => { let e = "Nueva"; c.eventos.forEach(x => { if (x.ts <= ts) e = x.estado; }); return e; };
    // eventos guardados por el operador
    casos.forEach(c => { if (eventos[c.id]) c.eventos = c.eventos.concat(eventos[c.id]); c.eventos.sort((a, b) => a.ts - b.ts); });
    misReps.sort((a, b) => a.ts - b.ts).forEach(r => {
      if (r.reabre) {
        const c = casos.find(x => x.id === r.reabre);
        if (c) { c.reportes.push(r); c.eventos.push({ ts: r.ts, estado: "Reabierta", nota: "El vecino indicó que el problema sigue.", actor: "Vecino" }); c.eventos.sort((a, b) => a.ts - b.ts); }
        return;
      }
      const cat = r.cats[0] || "Sin clasificar";
      const c = casos.find(x => x.p === r.p && x.cat === cat && ABIERTOS.includes(estadoA(x, r.ts)));
      if (c) { c.reportes.push(r); if (r.peligro) c.peligro = true; return; }
      const nc = { id: "c-" + r.id, p: r.p, cat, ts0: r.ts, reportes: [r], peligro: r.peligro, eventos: (eventos["c-" + r.id] || []).slice().sort((a, b) => a.ts - b.ts) };
      casos.push(nc);
    });
    const ahora = Date.now(), sla = C.slaHoras * H;
    casos.forEach(c => {
      c.estado = estadoA(c, Infinity);
      c.abierto = ABIERTOS.includes(c.estado);
      c.mio = c.reportes.some(r => r.mia);
      c.codigo = codigoDe(c.reportes[0].id);
      c.tsUlt = Math.max(...c.reportes.map(r => r.ts));
      const resp = c.eventos.filter(e => e.responsable).pop(); c.responsable = resp ? resp.responsable : "";
      const primera = c.eventos.find(e => e.estado !== "Reabierta");
      c.primeraRespTs = primera ? primera.ts : null;
      const fin = c.estado === "Resuelta" ? c.eventos.filter(e => e.estado === "Resuelta").pop() : null;
      c.resueltaTs = fin ? fin.ts : null; c.nota = fin ? fin.nota : ""; c.fotoDespues = fin ? fin.foto || null : null;
      c.reabierta = c.eventos.some(e => e.estado === "Reabierta") && c.abierto;
      const reab = c.eventos.filter(e => e.estado === "Reabierta").pop();
      const desde = reab && c.estado === "Reabierta" ? reab.ts : c.ts0;
      const prog = c.estado === "Programada" ? c.eventos.filter(e => e.estado === "Programada").pop() : null;
      c.programadaHasta = prog ? prog.hasta : null;
      // Vencido: sin primera respuesta dentro del plazo, o programado con la fecha de actualización ya pasada
      c.vencido = ((c.estado === "Nueva" || c.estado === "Reabierta") && ahora - desde > sla) || (!!c.programadaHasta && c.programadaHasta < ahora);
      c.textos = c.reportes.filter(r => r.texto).map(r => r.texto);
      c.foto = (c.reportes.slice().reverse().find(r => r.foto) || {}).foto || null;
      c.prioridad = (c.abierto ? 0 : -1e6) + (c.peligro ? 1e5 : 0) + (c.vencido ? 5e4 : 0) + (c.reabierta ? 3e4 : 0) + c.reportes.length * 500 + (ahora - c.ts0) / H;
    });
    return { opiniones, casos, grupos: Object.values(grupos).sort((a, b) => b.ini - a.ini), ABIERTOS };
  }

  function casoPorCodigo(codigo) {
    const m = modelo(); codigo = String(codigo || "").trim().toUpperCase();
    return m.casos.find(c => c.reportes.some(r => r.codigo === codigo)) || null;
  }

  window.Escucha = {
    C, K, ETQ, ESCALA_COLOR, H, DIA, ABIERTOS,
    aplicarTema, carita, lugar, categoriasDe, disponible, uid, codigoDe,
    guardarOpinion, revertirOpinion, guardarReporte, guardarEvento, decidirRevision, borrarDemo,
    modelo, casoPorCodigo, esc, fmt, hace, fecha
  };
})();
