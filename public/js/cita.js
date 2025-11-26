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

let modal, modalClose, modalTitle, idCitaInput, actividadSelect;
let actNombre, actTipo, actLugar, actOferente, actBeneficiarios, actDuracion, actCupo, actPeriodicidad, datosActividadDiv;
let fechaCita, horaCita, diasSemanaDiv, periodicidadSelect;
let btnGuardar, btnEliminar, btnReagendar;

export let citaSeleccionada = null;

// --- UTILIDADES FECHA
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

// --- INICIALIZACIÓN DEL DOM
function initDOMElements() {
  modal = document.getElementById("modalCita");
  modalClose = document.getElementById("closeModal");
  modalTitle = document.getElementById("modalTitulo");
  idCitaInput = document.getElementById("idCitaSeleccionada");
  actividadSelect = document.getElementById("actividadSelect");

  actNombre = document.getElementById("actNombre");
  actTipo = document.getElementById("actTipo");
  actLugar = document.getElementById("actLugar");
  actOferente = document.getElementById("actOferente");
  actBeneficiarios = document.getElementById("actBeneficiarios");
  actDuracion = document.getElementById("actDuracion");
  actCupo = document.getElementById("actCupo");
  actPeriodicidad = document.getElementById("actPeriodicidad");
  datosActividadDiv = document.getElementById("datosActividad");

  fechaCita = document.getElementById("fechaCita");
  horaCita = document.getElementById("horaCita");
  diasSemanaDiv = document.getElementById("diasSemana");
  periodicidadSelect = document.getElementById("periodicidadCita");

  btnGuardar = document.getElementById("btnGuardarCita");
  btnEliminar = document.getElementById("btnEliminarCita");
  btnReagendar = document.getElementById("btnReagendarCita");

  // --- EVENTOS DEL MODAL
  if (modalClose) modalClose.addEventListener("click", hideModal);
  window.addEventListener("click", e => { if (e.target === modal) hideModal(); });
  if (actividadSelect) actividadSelect.addEventListener("change", () => llenarDatosActividad(actividadSelect.value));
  if (btnGuardar) btnGuardar.addEventListener("click", onGuardarCita);
  if (btnEliminar) btnEliminar.addEventListener("click", onEliminarCita);
  if (btnReagendar) btnReagendar.addEventListener("click", onReagendarCita);
}

// --- MODAL
export function showModal() { if (modal) modal.style.display = "flex"; }
export function hideModal() { if (modal) modal.style.display = "none"; }

export function abrirModalNuevo() {
  citaSeleccionada = null;
  if (!idCitaInput) return;
  idCitaInput.value = "";
  if (modalTitle) modalTitle.textContent = "Crear Cita";
  if (actividadSelect) actividadSelect.value = "";
  if (datosActividadDiv) datosActividadDiv.style.display = "none";
  if (actNombre) actNombre.textContent = "";
  if (actTipo) actTipo.textContent = "";
  if (actLugar) actLugar.textContent = "";
  if (actOferente) actOferente.textContent = "";
  if (actBeneficiarios) actBeneficiarios.textContent = "";
  if (actDuracion) actDuracion.textContent = "";
  if (actCupo) actCupo.textContent = "";
  if (actPeriodicidad) actPeriodicidad.textContent = "";
  if (fechaCita) fechaCita.value = "";
  if (horaCita) horaCita.value = "";
  if (diasSemanaDiv) {
    diasSemanaDiv.style.display = "none";
    diasSemanaDiv.querySelectorAll("input").forEach(i => i.checked = false);
  }
  if (periodicidadSelect) {
    periodicidadSelect.value = "Única";
    periodicidadSelect.disabled = true;
  }
  if (btnEliminar) btnEliminar.style.display = "none";
  if (btnReagendar) btnReagendar.style.display = "none";
  if (btnGuardar) btnGuardar.style.display = "inline-block";
  showModal();
}

export function abrirModalParaEditarCita(cita) {
  if (!cita) return;
  citaSeleccionada = { id: cita.id, ...cita.extendedProps };
  if (idCitaInput) idCitaInput.value = citaSeleccionada.id || "";
  if (modalTitle) modalTitle.textContent = "Editar/Ver Cita";

  if (citaSeleccionada.actividadId && actividadSelect) {
    actividadSelect.value = citaSeleccionada.actividadId;
    llenarDatosActividad(actividadSelect.value);
  }

  const parts = isoToDateAndTimeParts(cita.start ?? cita.fechaHora ?? cita.fechaInicio ?? cita.fechaInicioMillis);
  if (fechaCita) fechaCita.value = parts.date;
  if (horaCita) horaCita.value = parts.time;

  const actividad = actividadesMap.get(citaSeleccionada.actividadId);
  if (diasSemanaDiv) diasSemanaDiv.style.display = actividad?.periodicidad === "Semanal" ? "flex" : "none";

  if (btnEliminar) btnEliminar.style.display = "inline-block";
  if (btnReagendar) btnReagendar.style.display = "inline-block";
  if (btnGuardar) btnGuardar.style.display = "inline-block";
  showModal();
}

// --- LLENAR DATOS ACTIVIDAD
export function llenarDatosActividad(actividadId) {
  const act = actividadesMap.get(actividadId);
  if (!act) {
    if (datosActividadDiv) datosActividadDiv.style.display = "none";
    if (periodicidadSelect) periodicidadSelect.style.display = "none";
    return;
  }

  if (datosActividadDiv) datosActividadDiv.style.display = "block";
  if (actNombre) actNombre.textContent = act.nombre ?? "";
  if (actTipo) actTipo.textContent = act.tipo ?? "";
  if (actLugar) actLugar.textContent = act.lugar ?? "";
  if (actOferente) actOferente.textContent = act.oferente ?? act.oferenteNombre ?? "No definido";
  if (actBeneficiarios) actBeneficiarios.textContent = Array.isArray(act.beneficiarios) ? act.beneficiarios.join(", ") : act.beneficiarios ?? "";
  if (actDuracion) actDuracion.textContent = (act.duracionMin ?? "") + (act.duracionMin ? " min" : "");
  if (actCupo) actCupo.textContent = act.cupo ?? "";
  if (actPeriodicidad) actPeriodicidad.textContent = act.periodicidad ?? "Única";

  // Select periodicidad
  if (periodicidadSelect) {
    if (act.periodicidad && act.periodicidad !== "Única") {
      periodicidadSelect.style.display = "block";
      periodicidadSelect.value = act.periodicidad;
      periodicidadSelect.disabled = false;
    } else {
      periodicidadSelect.value = "Única";
      periodicidadSelect.disabled = true;
    }
  }

  // Días de semana solo si es semanal
  if (diasSemanaDiv) diasSemanaDiv.style.display = act.periodicidad === "Semanal" ? "flex" : "none";
}

// --- VALIDAR CUPO
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

// --- GUARDAR CITA
export async function guardarCita(fechaISO, diasSeleccionados = []) {
  const actividadId = actividadSelect?.value;
  const actividad = actividadesMap.get(actividadId);
  if (!actividadId || !actividad) return alert("Seleccione una actividad válida.");

  const periodicidad = actividad?.periodicidad ?? "Única";
  const fechaBase = new Date(fechaISO);
  const citasAGuardar = [];

  if (periodicidad === "Única") {
    citasAGuardar.push(fechaISO);
  } else if (periodicidad === "Diaria") {
    for (let i = 0; i < 7; i++) {
      const nuevaFecha = new Date(fechaBase);
      nuevaFecha.setUTCDate(fechaBase.getUTCDate() + i);
      citasAGuardar.push(nuevaFecha.toISOString());
    }
  } else if (periodicidad === "Semanal" && diasSeleccionados.length > 0) {
    for (let semana = 0; semana < 4; semana++) {
      diasSeleccionados.forEach(dia => {
        const nuevaFecha = new Date(fechaBase);
        const diff = (dia - fechaBase.getUTCDay() + 7) % 7 + semana * 7;
        nuevaFecha.setUTCDate(fechaBase.getUTCDate() + diff);
        citasAGuardar.push(nuevaFecha.toISOString());
      });
    }
  } else if (periodicidad === "Mensual") {
    for (let i = 0; i < 3; i++) {
      const nuevaFecha = new Date(fechaBase);
      nuevaFecha.setUTCMonth(fechaBase.getUTCMonth() + i);
      citasAGuardar.push(nuevaFecha.toISOString());
    }
  }

  for (const iso of citasAGuardar) {
    const citaObj = {
      actividadId,
      actividadNombre: actividad.nombre ?? "",
      fechaHora: iso,
      fechaInicioMillis: Date.parse(iso),
      duracionMin: actividad.duracionMin ?? null,
      cupo: actividad.cupo ?? null,
      lugar: actividad.lugar ?? null,
      oferente: actividad.oferente ?? actividad.oferenteNombre ?? null,
      socioComunitario: actividad.socioComunitario ?? null,
      periodicidad,
      diasAvisoPrevio: actividad.diasAvisoPrevio ?? 0,
      estado: "Activa",
      fechaModificacion: Date.now()
    };

    await addDoc(collection(db, CITAS_COL), citaObj);
  }
}

// --- ELIMINAR Y REAGENDAR
export async function eliminarCita(id) {
  if (!id) return;
  await deleteDoc(doc(db, CITAS_COL, id));
}

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

// --- EVENTOS BOTONES
async function onGuardarCita() {
  const fechaISO = combineDateTimeToISO(fechaCita?.value, horaCita?.value);
  if (!fechaISO) return alert("Seleccione fecha y hora válidas.");
  const diasSeleccionados = Array.from(diasSemanaDiv.querySelectorAll("input:checked")).map(i => Number(i.value));
  await guardarCita(fechaISO, diasSeleccionados);
  hideModal();
  if (window.calendar?.refetchEvents) window.calendar.refetchEvents();
}

async function onEliminarCita() {
  if (!idCitaInput?.value) return;
  await eliminarCita(idCitaInput.value);
  hideModal();
  if (window.calendar?.refetchEvents) window.calendar.refetchEvents();
}

async function onReagendarCita() {
  if (!idCitaInput?.value) return;
  const nuevaISO = combineDateTimeToISO(fechaCita?.value, horaCita?.value);
  if (!nuevaISO) return alert("Seleccione fecha y hora válidas.");
  await reagendarCita(idCitaInput.value, nuevaISO, actividadSelect?.value);
  hideModal();
  if (window.calendar?.refetchEvents) window.calendar.refetchEvents();
}

// --- INICIALIZAR AL CARGAR DOM
document.addEventListener("DOMContentLoaded", initDOMElements);
