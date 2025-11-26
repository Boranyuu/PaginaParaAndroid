// calendario.js
import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { actividadesMap, cargarActividades } from "./actividades.js";
import { abrirModalNuevo, abrirModalParaEditarCita, milisToISOIfNeeded, reagendarCita } from "./cita.js";

document.addEventListener("DOMContentLoaded", async () => {
  await cargarActividades();

  async function fetchCitasAsEvents() {
    const eventos = [];

    // ---------- CITAS DESDE COLECCIÓN ----------
    try {
      const snapCitas = await getDocs(collection(db, "citas"));
      snapCitas.forEach(docSnap => {
        const id = docSnap.id;
        const data = docSnap.data();

        const fechaISO = milisToISOIfNeeded(
          data.fechaHora ?? data.fechaInicio ?? data.fechaInicioMillis
        );
        if (!fechaISO) return;

        let titulo = data.actividadNombre ?? "Cita";
        if (data.actividadId && actividadesMap.has(data.actividadId)) {
          titulo = actividadesMap.get(data.actividadId).nombre;
        }

        eventos.push({
          id,
          title: titulo,
          start: fechaISO,
          editable: true,
          extendedProps: {
            origen: "citasCollection",
            ...data
          }
        });
      });
    } catch (err) {
      console.error("Error cargando citas:", err);
    }

    // ---------- CITAS EMBEBIDAS EN ACTIVIDADES ----------
    for (const [actId, act] of actividadesMap.entries()) {
      if (!Array.isArray(act.citas)) continue;

      act.citas.forEach(c => {
        const fechaISO = milisToISOIfNeeded(
          c.fechaInicio ?? c.fechaInicioMillis
        );
        if (!fechaISO) return;

        eventos.push({
          id: `${actId}__${c.id ?? Math.random().toString(36).slice(2, 9)}`,
          title: act.nombre ?? "Cita actividad",
          start: fechaISO,
          editable: true,
          extendedProps: {
            origen: "citasDentroActividad",
            actividadId: actId,
            actividadNombre: act.nombre,
            tipo: act.tipo,
            lugar: c.lugar ?? act.lugar,
            oferente: act.oferente ?? act.oferenteNombre,
            beneficiarios: act.beneficiarios,
            cupo: c.cupo ?? act.cupo,
            duracionMin: c.duracionMin ?? act.duracionMin,
            ...c
          }
        });
      });
    }

    return eventos;
  }

  const calendarEl = document.getElementById("calendar");

  window.calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "es",
    firstDay: 1,

    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek"
    },

    events: async (fetchInfo, successCallback, failureCallback) => {
      try {
        const events = await fetchCitasAsEvents();
        successCallback(events);
      } catch (err) {
        failureCallback(err);
      }
    },

    // ✅ TOOLTIP AL PASAR EL MOUSE
    eventDidMount: function(info) {
      const d = info.event.extendedProps;

      const tooltip = `
${info.event.title}
Lugar: ${d.lugar ?? "No definido"}
Oferente: ${d.oferente ?? "No definido"}
Cupo: ${d.cupo ?? "Sin límite"}
      `;

      info.el.setAttribute("title", tooltip);
    },

    // ✅ CLICK → MOSTRAR DATOS COMPLETOS
    eventClick: info => {
      abrirModalParaEditarCita(info.event);
    },

    // ✅ ARRASTRAR CITA (REAGENDAR)
    eventDrop: async info => {
      try {
        await reagendarCita(info.event.id, info.event.start.toISOString());
        window.calendar.refetchEvents();
      } catch (err) {
        console.error(err);
        info.revert();
        alert("Error al reagendar la cita");
      }
    },

    editable: true,
    selectable: true
  });

  calendar.render();

  // BOTÓN CREAR CITA
  const btnCrear = document.getElementById("btnCrearEvento");
  if (btnCrear) btnCrear.addEventListener("click", abrirModalNuevo);
});
