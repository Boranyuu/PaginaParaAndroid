// cita.js
import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { actividadesMap } from "./actividades.js";

export const CITAS_COL = "citas";

const modal = document.getElementById("modalCita");
const modalClose = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitulo");
const idCitaInput = document.getElementById("idCitaSeleccionada");
const actividadSelect = document.getElementById("actividadSelect");

const actNombre = document.getElementById("actNombre");
const actTipo = document.getElementById("actTipo");
const actLugar = document.getElementById("actLugar");
const actOferente = document.getElementById("actOferente");
const actBeneficiarios = document.getElementById("actBeneficiarios");
const actDuracion = document.getElementById("actDuracion");
const actCupo = document.getElementById("actCupo");
const actPeriodicidad = document.getElementById("actPeriodicidad");
const datosActividadDiv = document.getElementById("datosActividad");

const fechaCita = document.getElementById("fechaCita");
const horaCita = document.getElementById("horaCita");

const btnGuardar = document.getElementById("btnGuardarCita");
const btnEliminar = document.getElementById("btnEliminarCita");
const btnReagendar = document.getElementById("btnReagendarCita");

export let citaSeleccionada = null;

// --- Fechas
export function milisToISOIfNeeded(value) {
  if (!value) return null;
  if (typeof value === "number") return new Date(value).toISOString();
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value + ":00Z";
    return value;
  }
  return null;
}

export function combineDateTimeToISO(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm, 0)).toISOString();
}

export function isoToDateAndTimeParts(isoOrMillis) {
  const iso = milisToISOIfNeeded(isoOrMillis);
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
}

// --- Modales
export function showModal() { modal.style.display = "flex"; }
export function hideModal() { modal.style.display = "none"; }

export function abrirModalNuevo() {
  citaSeleccionada = null;
  idCitaInput.value = "";
  modalTitle.textContent = "Crear Cita";
  actividadSelect.value = "";
  datosActividadDiv.style.display = "none";
  actNombre.textContent = "";
  actTipo.textContent = "";
  actLugar.textContent = "";
  actOferente.textContent = "";
  actBeneficiarios.textContent = "";
  actDuracion.textContent = "";
  actCupo.textContent = "";
  actPeriodicidad.textContent = "";
  fechaCita.value = "";
  horaCita.value = "";
  btnEliminar.style.display = "none";
  btnReagendar.style.display = "none";
  btnGuardar.style.display = "inline-block";
  showModal();
}

export function abrirModalParaEditarCita(cita) {
  citaSeleccionada = { id: cita.id, ...cita.extendedProps };
  idCitaInput.value = citaSeleccionada.id || "";
  modalTitle.textContent = "Editar/Ver Cita";

  if (citaSeleccionada.actividadId) {
    actividadSelect.value = citaSeleccionada.actividadId;
    llenarDatosActividad(actividadSelect.value);
  } else {
    actNombre.textContent = citaSeleccionada.actividadNombre || "";
    actTipo.textContent = citaSeleccionada.tipo || "";
    actLugar.textContent = citaSeleccionada.lugar || "";
    actOferente.textContent = citaSeleccionada.oferente || "";
    actBeneficiarios.textContent = Array.isArray(citaSeleccionada.beneficiarios)
      ? citaSeleccionada.beneficiarios.join(", ")
      : citaSeleccionada.beneficiarios ?? "";
    actDuracion.textContent = (citaSeleccionada.duracionMin ?? "") + (citaSeleccionada.duracionMin ? " min" : "");
    actCupo.textContent = citaSeleccionada.cupo ?? "";
    actPeriodicidad.textContent = citaSeleccionada.periodicidad ?? "";
    datosActividadDiv.style.display = "block";
  }

  const parts = isoToDateAndTimeParts(
    cita.start ?? cita.fechaHora ?? cita.fechaInicio ?? cita.fechaInicioMillis
  );
  fechaCita.value = parts.date;
  horaCita.value = parts.time;

  btnEliminar.style.display = "inline-block";
  btnReagendar.style.display = "inline-block";
  btnGuardar.style.display = "inline-block";

  showModal();
}

export function llenarDatosActividad(actividadId) {
  const act = actividadesMap.get(actividadId);
  if (!act) {
    datosActividadDiv.style.display = "none";
    actNombre.textContent = "";
    actTipo.textContent = "";
    actLugar.textContent = "";
    actOferente.textContent = "";
    actBeneficiarios.textContent = "";
    actDuracion.textContent = "";
    actCupo.textContent = "";
    actPeriodicidad.textContent = "";
    return;
  }

  datosActividadDiv.style.display = "block";
  actNombre.textContent = act.nombre ?? "";
  actTipo.textContent = act.tipo ?? "";
  actLugar.textContent = act.lugar ?? "";
  actOferente.textContent = act.oferente ?? act.oferenteNombre ?? "No definido";
  actBeneficiarios.textContent = Array.isArray(act.beneficiarios)
    ? act.beneficiarios.join(", ")
    : act.beneficiarios ?? "";
  actDuracion.textContent = (act.duracionMin ?? "") + (act.duracionMin ? " min" : "");
  actCupo.textContent = act.cupo ?? "";
  actPeriodicidad.textContent = act.periodicidad ?? "Única";
}

// --- Validar cupo
export async function puedeReservar(actividadId, fechaISO) {
  if (!actividadId || !fechaISO) return false;
  try {
    const q = query(
      collection(db, CITAS_COL),
      where("actividadId", "==", actividadId),
      where("fechaHora", "==", fechaISO)
    );
    let count = 0;
    try {
      const countSnap = await getCountFromServer(q);
      count = countSnap.data().count;
    } catch {
      const snap = await getDocs(q);
      count = snap.size;
    }
    const actividad = actividadesMap.get(actividadId);
    const cupo = actividad?.cupo ?? Infinity;
    if (citaSeleccionada && citaSeleccionada.id) {
      const prevISO = milisToISOIfNeeded(citaSeleccionada.fechaHora ?? citaSeleccionada.fechaInicio ?? citaSeleccionada.start);
      if (prevISO === fechaISO) return count - 1 < cupo;
    }
    return count < cupo;
  } catch (err) {
    console.error("Error validando cupo:", err);
    return false;
  }
}

// --- Guardar / eliminar / reagendar
export async function guardarCita(fechaISO) {
  const actividadId = actividadSelect.value;
  const actividad = actividadesMap.get(actividadId);
  if (!actividadId || !actividad) return alert("Seleccione una actividad válida.");

  const citaObj = {
    actividadId,
    actividadNombre: actividad.nombre ?? "",
    fechaHora: fechaISO,
    fechaInicioMillis: Date.parse(fechaISO),
    duracionMin: actividad.duracionMin ?? null,
    cupo: actividad.cupo ?? null,
    lugar: actividad.lugar ?? null,
    oferente: actividad.oferente ?? actividad.oferenteNombre ?? null,
    socioComunitario: actividad.socioComunitario ?? null,
    periodicidad: actividad.periodicidad ?? "Única",
    diasAvisoPrevio: actividad.diasAvisoPrevio ?? 0,
    estado: "Activa",
    fechaModificacion: Date.now()
  };

  if (idCitaInput.value) {
    await updateDoc(doc(db, CITAS_COL, idCitaInput.value), citaObj);
  } else {
    await addDoc(collection(db, CITAS_COL), citaObj);
  }
}

// --- Eliminar cita
export async function eliminarCita(id) {
  if (!id) return;
  await deleteDoc(doc(db, CITAS_COL, id));
}

// --- Reagendar cita
export async function reagendarCita(id, nuevaISO, actividadId) {
  if (!id || !nuevaISO) return;
  if (actividadId && !(await puedeReservar(actividadId, nuevaISO))) {
    alert("No hay cupos disponibles para esa fecha/hora.");
    return;
  }
  await updateDoc(doc(db, CITAS_COL, id), {
    fechaHora: nuevaISO,
    fechaInicioMillis: Date.parse(nuevaISO),
    fechaModificacion: Date.now()
  });
}

// --- Eventos del modal
modalClose.addEventListener("click", hideModal);
window.addEventListener("click", e => {
  if (e.target === modal) hideModal();
});
actividadSelect.addEventListener("change", () => llenarDatosActividad(actividadSelect.value));

btnGuardar.addEventListener("click", async () => {
  const fechaISO = combineDateTimeToISO(fechaCita.value, horaCita.value);
  if (!fechaISO) return alert("Seleccione fecha y hora válidas.");

  if (!(await puedeReservar(actividadSelect.value, fechaISO))) {
    return alert("No hay cupos disponibles para esta fecha/hora.");
  }

  await guardarCita(fechaISO);
  hideModal();
  if (window.calendar && typeof window.calendar.refetchEvents === "function") {
    window.calendar.refetchEvents();
  }
});

btnEliminar.addEventListener("click", async () => {
  if (!idCitaInput.value) return;
  await eliminarCita(idCitaInput.value);
  hideModal();
  if (window.calendar && typeof window.calendar.refetchEvents === "function") {
    window.calendar.refetchEvents();
  }
});

btnReagendar.addEventListener("click", async () => {
  if (!idCitaInput.value) return;
  const nuevaISO = combineDateTimeToISO(fechaCita.value, horaCita.value);
  if (!nuevaISO) return alert("Seleccione fecha y hora válidas.");
  await reagendarCita(idCitaInput.value, nuevaISO, actividadSelect.value);
  hideModal();
  if (window.calendar && typeof window.calendar.refetchEvents === "function") {
    window.calendar.refetchEvents();
  }
});
