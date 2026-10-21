# Villeta Escucha · Demo

Prototipo de **escucha ciudadana por QR** de [Plugueo](https://plugueo.com), preparado para la Municipalidad de Villeta.

> Convertir experiencias cotidianas en prioridades municipales y en respuestas que el vecino pueda comprobar.

## Qué incluye

| Ruta | Qué es |
|---|---|
| `index.html` | Portada de la demo: QR por lugar, cómo probarla y reglas de calidad del dato |
| `f/?p=<lugar>` | Formulario que abre el QR del cartel |
| `f/?s=<código>` | Seguimiento del caso para el vecino |
| `panel/` | Panel de gestión: Resumen · Atender hoy · Lugares · Historial |
| `config/cliente.js` | **Único archivo a editar** para adaptar a otro cliente |
| `assets/escucha.js` | Modelo de datos, reglas y datos de ejemplo |
| `docs/` | Revisión UX, auditoría externa y registro de cambios |

## Circuito

**QR → valoración → detalle opcional → código de seguimiento → asignación → intervención documentada → el vecino comprueba el resultado.**

- Las **cuatro caritas se registran con un toque**: mismo esfuerzo para elogiar y para criticar.
- Una **opinión** alimenta la satisfacción. Un **reporte** (problema, peligro, comentario o foto) abre un **caso**. Una carita negativa sin detalle no crea tareas vacías; una positiva igual puede reportar un peligro.
- Varios reportes del mismo problema en el mismo lugar se **agrupan en un caso**.
- Cerrar un caso exige escribir **qué se hizo** (y opcionalmente una foto). Eso es lo que ve el vecino.
- El vecino puede decir **"No, sigue igual"** y el caso se reabre.
- "Programado" exige motivo y fecha de próxima actualización; si la fecha pasa, el caso figura como vencido.

## Reglas de calidad del dato

- Una opinión computable por dispositivo, lugar y día; volver a opinar la actualiza.
- Ráfagas (15 o más opiniones en 10 minutos en un lugar) pasan a **revisión** y no se cuentan hasta que alguien decide; la decisión queda registrada.
- Mismas reglas para elogios y críticas.
- Bloqueo de doble toque y clave única por envío (un reintento no duplica).
- Códigos de lugar inexistentes no registran nada.

**Límite honesto:** un QR anónimo no puede garantizar persona única ni presencia física. El sistema reduce y detecta el abuso y muestra los límites del dato.

## Probar la demo

1. Abrí `panel/` en una pestaña.
2. En otra pestaña **del mismo navegador** abrí `f/?p=mercado`, tocá **Mal**, marcá un problema y enviá. Anotá el código.
3. En el panel aparece el aviso y el caso marcado **Tu prueba** en **Atender hoy**. Asignalo, pasalo a en proceso y resolvelo escribiendo qué se hizo.
4. En el formulario, **Ver el estado del caso** muestra la respuesta. "No, sigue igual" lo reabre.
5. **Borrar mis pruebas** deja todo como al inicio.

## Qué hace la demo y qué no

| Funciona en la demo | Requiere el servidor para el piloto |
|---|---|
| Formulario, detalle, foto, código y seguimiento | Recepción confirmada por el servidor y envío entre dispositivos (celular → otra computadora) |
| Agrupación de reportes, estados, cierre con evidencia, reapertura | Cuentas individuales, roles y permisos por municipio |
| Reglas de una opinión por día y detección de ráfagas (en el navegador) | Las mismas reglas aplicadas en el servidor, límites de envío y verificación invisible ante actividad sospechosa |
| Panel con datos simulados coherentes entre sí | Datos reales, exportación, respaldo y continuidad entre administraciones |
| Mapa (OpenStreetMap) | Lugares y coordenadas validados con el municipio |

Lugares, coordenadas, cifras y casos son **de ejemplo**.

## Publicar en GitHub Pages

1. Subí el contenido de esta carpeta a un repositorio (por ejemplo `escucha`).
2. *Settings → Pages → Branch: main / root → Save*.
3. Queda en `https://<usuario>.github.io/escucha/`. Los QR de la portada apuntan ahí.

## Adaptar a otro cliente

Editá `config/cliente.js`: id, nombre, escudo, colores, jerarquía, lugares (con tipo y coordenadas), categorías, equipos, plazo de respuesta y reglas antiabuso.
