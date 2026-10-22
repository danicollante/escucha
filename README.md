# Villeta Escucha · Demo

Prototipo de **termómetro de plazas + central de WhatsApp** de [Plugueo](https://plugueo.com), preparado para la Municipalidad de Villeta.

> Un QR en cada plaza. El vecino opina en 5 segundos; la Municipalidad ve qué plaza necesita atención y avisa por WhatsApp a quien corresponde.

La versión anterior (casos, asignaciones, estados y códigos de seguimiento) quedó guardada en la rama [`v3-casos`](https://github.com/danicollante/escucha/tree/v3-casos).

## Qué incluye

| Ruta | Qué es |
|---|---|
| `index.html` | Portada: QR por plaza, guion de demo y reglas de calidad del dato |
| `f/?p=<plaza>` | Formulario que abre el QR del cartel |
| `panel/` | La central: indicadores, "Para avisar hoy", plazas (mapa + lista) y calidad del dato |
| `config/cliente.js` | **Único archivo a editar**: marca, plazas, problemas, agenda y mensaje de WhatsApp |
| `assets/escucha.js` | Modelo de datos, reglas y datos de ejemplo |

## Cómo funciona

**Vecino.** Escanea el QR, toca una de cuatro caritas (Muy mal, Mal, Bien, Muy bien) y listo: un toque guarda la opinión, con el mismo esfuerzo para las cuatro. Si eligió Muy mal o Mal, puede marcar qué vio (Sucio, Sin luz, Algo roto, Otro) y dejar un comentario de hasta 280 caracteres; eso se agrega a la misma opinión. No se piden datos personales ni se prometen plazos.

**Central.** El encargado abre el panel una o dos veces por día:

1. **Indicadores del período** (7 o 28 días): % de satisfacción, opiniones recibidas y pendientes de avisar, más una frase "Lo principal" armada con reglas simples.
2. **Para avisar hoy**: las opiniones negativas de hoy y ayer, agrupadas por plaza y día. Se arma una tarjeta cuando hay 2 o más negativas en la plaza ese día o alguien marcó un problema o escribió algo; un "Mal" aislado y sin detalle solo cuenta para el termómetro. Cada tarjeta tiene dos acciones:
   - **Avisar por WhatsApp**: elige un contacto de la agenda, edita el mensaje ya armado y abre `https://wa.me/<teléfono>?text=…` (o `https://wa.me/?text=…` si el contacto no tiene teléfono). La tarjeta queda "Enviado por WhatsApp a Juan · 14:32". En la demo esto significa que se abrió WhatsApp con el mensaje: confirmar la entrega requiere la WhatsApp Business API.
   - **Descartar**: sale de la lista y queda registrado quién y cuándo.

   Una tarjeta solo puede estar **pendiente, avisada o descartada**.
3. **Plazas**: mapa (OpenStreetMap, con vista esquemática sin conexión) y lista con satisfacción, variación vs. su propio período anterior, problema más marcado y último aviso. Sin opiniones = gris, "verificar el cartel". Menos de 30 opiniones = "muestra chica".
4. **Calidad del dato**: opiniones admitidas, en revisión y descartadas, con la ráfaga de ejemplo para Admitir o Descartar.

## Reglas de calidad del dato

- Una opinión computable por dispositivo, plaza y día; volver a opinar la actualiza.
- Ráfagas (15 o más opiniones en 10 minutos en una plaza) pasan a **revisión** y no se cuentan hasta que el encargado decide Admitir o Descartar.
- Mismas reglas para elogios y críticas.
- Bloqueo de doble toque; un código de plaza inexistente no registra nada.
- Los comentarios solo los lee el encargado: no se publican.

**Límite honesto:** un QR anónimo no puede garantizar persona única ni presencia física. El sistema reduce y detecta el abuso y muestra los límites del dato.

## Guion de demo (3 pasos)

1. Abrí `f/?p=plaza-central`, tocá **Mal**, marcá **Sucio** y enviá (el comentario es opcional).
2. En `panel/` (mismo navegador), la opinión aparece en vivo en **Para avisar hoy**. Tocá **Avisar por WhatsApp**, elegí a Juan y abrí WhatsApp: la tarjeta pasa a **Enviado por WhatsApp a Juan**.
3. Bajá a **Plazas** para ver el mapa y la lista, y en **Calidad del dato** admití o descartá la ráfaga de ejemplo.

**Borrar mis pruebas** (arriba en la central) deja todo como al inicio.

## Qué queda para un piloto real

| Funciona en la demo | Requiere trabajo para el piloto |
|---|---|
| Formulario, detalle y actualización en vivo (mismo navegador) | **Servidor** que confirme cada envío y lo muestre en la central desde cualquier dispositivo |
| Reglas de una opinión por día y detección de ráfagas (en el navegador) | Las mismas reglas **aplicadas en el servidor**, con límites de envío y verificación invisible ante actividad sospechosa |
| Central con datos simulados coherentes | **Cuenta del encargado** (acceso con usuario) y registro real de quién avisó o descartó |
| Avisos por enlace `wa.me` | Teléfonos reales en la agenda (formato `5959XXXXXXXX`) |
| Mapa con plazas de ejemplo | **Validar plazas y coordenadas reales** con el municipio e imprimir los carteles |

Plazas, coordenadas, cifras y contactos son **de ejemplo**.

## Publicar en GitHub Pages

1. *Settings → Pages → Branch: main / root → Save*.
2. Queda en `https://<usuario>.github.io/escucha/`. Los QR de la portada apuntan ahí.

## Adaptar a otro cliente

Editá `config/cliente.js`: id, nombre, escudo, colores, plazas (con coordenadas), problemas, agenda de la central, plantilla del mensaje de WhatsApp, texto de emergencia y reglas antiabuso.
