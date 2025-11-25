// calendario.js
import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { actividadesMap, cargarActividades } from "./actividades.js";
import { abrirModalNuevo, abrirModalParaEditarCita, milisToISOIfNeeded, reagendarCita } from "./cita.js";

document.addEventListener("DOMContentLoaded", async () => {
  await cargarActividades();

  // --- Obtener todas las citas como eventos para FullCalendar
  async function fetchCitasAsEvents() {
    const eventos = [];

    // ----- Citas en colección `citas` -----
    try {
      const snapCitas = await getDocs(collection(db, "citas"));
      snapCitas.forEach(docSnap => {
        const id = docSnap.id;
        const data = docSnap.data();
        const fechaISO = milisToISOIfNeeded(data.fechaHora ?? data.fechaInicio ?? data.fechaInicioMillis);
        if (!fechaISO) return;

        let titulo = data.actividadNombre ?? "Cita";
        if ((!titulo || titulo === "") && data.actividadId) {
          const act = actividadesMap.get(data.actividadId);
          if (act) titulo = act.nombre;
        }

        eventos.push({
          id,
          title: titulo,
          start: fechaISO,
          editable: true,
          extendedProps: { origen: "citasCollection", ...data }
        });
      });
    } catch (err) {
      console.error("Error cargando citas (colección):", err);
    }

    // ----- Citas embebidas dentro de actividades -----
    try {
      for (const [actId, act] of actividadesMap.entries()) {
        if (!Array.isArray(act.citas)) continue;
        act.citas.forEach(c => {
          const fechaISO = milisToISOIfNeeded(c.fechaInicio ?? c.fechaInicioMillis);
          if (!fechaISO) return;

          eventos.push({
            id: `${actId}__${c.id ?? Math.random().toString(36).slice(2, 9)}`,
            title: act.nombre ?? "Cita (actividad)",
            start: fechaISO,
            editable: true,
            extendedProps: {
              origen: "citasDentroActividad",
              actividadId: actId,
              actividadNombre: act.nombre,
              lugar: c.lugar ?? act.lugar,
              duracionMin: c.duracionMin ?? act.duracionMin,
              cupo: c.cupo ?? act.cupo,
              ...c
            }
          });
        });
      }
    } catch (err) {
      console.error("Error buscando citas dentro de actividades:", err);
    }

    return eventos;
  }

  // --- Inicializar FullCalendar ---
  const calendarEl = document.getElementById("calendar");
  window.calendar = new FullCalendar.Calendar(calendarEl, { // <-- Exponer globalmente
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
        console.error("Error cargando eventos:", err);
        failureCallback(err);
      }
    },
    eventClick: info => abrirModalParaEditarCita({
      id: info.event.id,
      start: info.event.startStr,
      ...info.event.extendedProps
    }),
    eventDrop: async info => {
      const ev = info.event;
      try {
        await reagendarCita(ev.id, ev.start.toISOString());
        // Refrescar calendario luego de reagendar
        if (window.calendar) window.calendar.refetchEvents();
      } catch (err) {
        console.error(err);
        info.revert();
        alert("Error al reagendar la cita.");
      }
    },
    editable: true,
    selectable: true
  });

  calendar.render();

  // --- Botón crear nueva cita ---
  const btnCrear = document.getElementById("btnCrearEvento");
  if (btnCrear) btnCrear.addEventListener("click", abrirModalNuevo);
});
