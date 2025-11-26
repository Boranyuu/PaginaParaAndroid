import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { actividadesMap, cargarActividades } from "./actividades.js";
import { abrirModalNuevo, abrirModalParaEditarCita, milisToISOIfNeeded, reagendarCita } from "./cita.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("📌 DOMContentLoaded: iniciando calendario...");
  await cargarActividades();
  console.log("✅ Actividades cargadas:", actividadesMap.size);

  async function fetchCitasAsEvents() {
    const eventos = [];
    console.log("📌 fetchCitasAsEvents: cargando citas desde Firestore...");

    try {
      const snapCitas = await getDocs(collection(db, "citas"));
      console.log("✅ Snap de citas obtenido:", snapCitas.size);

      snapCitas.forEach(docSnap => {
        const id = docSnap.id;
        const data = docSnap.data();
        const fechaISO = milisToISOIfNeeded(data.fechaHora ?? data.fechaInicio ?? data.fechaInicioMillis);
        if (!fechaISO) return;

        let titulo = data.actividadNombre ?? "Cita";
        if (data.actividadId && actividadesMap.has(data.actividadId)) {
          titulo = actividadesMap.get(data.actividadId).nombre;
        }

        console.log("📌 Agregando evento de cita:", { id, titulo, fechaISO });

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

      console.log("📌 Eventos preparados desde Firestore:", eventos.length);
    } catch (err) {
      console.error("❌ Error cargando citas:", err);
    }

    // ---------- CITAS EMBEBIDAS EN ACTIVIDADES ----------
    for (const [actId, act] of actividadesMap.entries()) {
      if (!Array.isArray(act.citas)) continue;

      act.citas.forEach(c => {
        const fechaISO = milisToISOIfNeeded(c.fechaInicio ?? c.fechaInicioMillis);
        if (!fechaISO) return;

        console.log("📌 Agregando evento embebido de actividad:", { actId, nombre: act.nombre, fechaISO });

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
            oferente: c.oferente ?? act.oferenteNombre,
            beneficiarios: c.beneficiarios,
            cupo: c.cupo ?? act.cupo,
            duracionMin: c.duracionMin ?? act.duracionMin,
            ...c
          }
        });
      });
    }

    console.log("📌 Total de eventos para calendario:", eventos.length);
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

    eventDidMount: function (info) {
      const d = info.event.extendedProps;
      const tooltip = `
${info.event.title}
Lugar: ${d.lugar ?? "No definido"}
Oferente: ${d.oferente ?? "No definido"}
Cupo: ${d.cupo ?? "Sin límite"}
      `;
      info.el.setAttribute("title", tooltip);
    },

    eventClick: info => {
      console.log("📌 Evento clickeado:", info.event.id, info.event.title, info.event.extendedProps);
      abrirModalParaEditarCita(info.event);
    },

    eventDrop: async info => {
      try {
        console.log("📌 Evento arrastrado (reagendar):", info.event.id, info.event.start.toISOString());
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

  const btnCrear = document.getElementById("btnCrearEvento");
  if (btnCrear) btnCrear.addEventListener("click", abrirModalNuevo);
});
