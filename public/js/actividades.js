// actividades.js
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

import { db } from "./firebase.js";

export const ACTIVIDADES_COL = "actividades";
export const actividadesMap = new Map();
export const oferentesMap = new Map();
export const tiposMap = new Map();
export const lugaresMap = new Map();
export const sociosMap = new Map();
export const proyectosMap = new Map();

// ================= DOM =================
const modalActividad = document.getElementById("modalActividad");
const modalCloseActividad = document.getElementById("closeModalActividad");
const btnCrearActividad = document.getElementById("btnCrearActividad");
const btnGuardarActividad = document.getElementById("btnGuardarActividad");

const idActividadInput = document.getElementById("idActividadSeleccionada");
const nombreActividad = document.getElementById("nombreActividad");
const tipoActividad = document.getElementById("tipoActividad");
const lugarActividad = document.getElementById("lugarActividad");
const oferenteActividad = document.getElementById("oferenteActividad");
const socioActividad = document.getElementById("socioActividad");
const proyectoActividad = document.getElementById("proyectoActividad");
const beneficiariosActividad = document.getElementById("beneficiariosActividad");
const duracionActividad = document.getElementById("duracionActividad");
const cupoActividad = document.getElementById("cupoActividad");
const descripcionActividad = document.getElementById("descripcionActividad");
const actividadSelect = document.getElementById("actividadSelect");

// ==================== TEST FIRESTORE ====================
async function testFirestore() {
  try {
    const snap = await getDocs(collection(db, "actividades"));
    console.log("✅ Actividades en Firestore:", snap.docs.map(d => d.data()));
  } catch (e) {
    console.error("❌ Error Firestore:", e);
  }
}

// ==================== CARGAR MANTENEDORES ====================
async function cargarMantenedor(collectionName, selectElem, mapObj, placeholder = "Seleccione...") {
  selectElem.innerHTML = `<option value="">Cargando...</option>`;
  mapObj.clear();

  try {
    const snap = await getDocs(collection(db, collectionName));
    selectElem.innerHTML = `<option value="">${placeholder}</option>`;

    snap.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;
      const nombre = data.nombre ?? `Item ${id}`;

      mapObj.set(id, nombre);

      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = nombre;
      selectElem.appendChild(opt);
    });
  } catch (err) {
    console.error(`Error cargando ${collectionName}:`, err);
    selectElem.innerHTML = `<option value="">Error</option>`;
  }
}

// ==================== CARGAR TODOS ====================
export async function cargarTodosMantenedores() {
  await Promise.all([
    cargarMantenedor("oferentes", oferenteActividad, oferentesMap, "Seleccione un oferente"),
    cargarMantenedor("tiposActividad", tipoActividad, tiposMap, "Seleccione un tipo"),
    cargarMantenedor("lugares", lugarActividad, lugaresMap, "Seleccione un lugar"),
    cargarMantenedor("sociosComunitarios", socioActividad, sociosMap, "Seleccione un socio"),
    cargarMantenedor("proyectos", proyectoActividad, proyectosMap, "Seleccione un proyecto")
  ]);
}

// ==================== CARGAR ACTIVIDADES ====================
export async function cargarActividades() {
  actividadSelect.innerHTML = '<option value="">Cargando actividades...</option>';
  actividadesMap.clear();

  try {
    const snap = await getDocs(collection(db, ACTIVIDADES_COL));
    actividadSelect.innerHTML = '<option value="">Seleccione una actividad...</option>';

    snap.forEach(docSnap => {
      const id = docSnap.id;
      const data = docSnap.data();
      actividadesMap.set(id, { id, ...data });

      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = data.nombre ?? `Actividad ${id}`;
      actividadSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Error cargando actividades:", err);
    actividadSelect.innerHTML = '<option value="">Error cargando</option>';
  }
}

// ==================== MODAL ====================
export function abrirModalActividad(actividadId = null) {
  idActividadInput.value = actividadId || "";
  nombreActividad.value = "";
  tipoActividad.value = "";
  lugarActividad.value = "";
  oferenteActividad.value = "";
  socioActividad.value = "";
  proyectoActividad.value = "";
  beneficiariosActividad.value = "";
  duracionActividad.value = "";
  cupoActividad.value = "";
  descripcionActividad.value = "";

  if (actividadId && actividadesMap.has(actividadId)) {
    const act = actividadesMap.get(actividadId);
    nombreActividad.value = act.nombre || "";
    tipoActividad.value = act.tipoId || "";
    lugarActividad.value = act.lugarId || "";
    oferenteActividad.value = act.oferenteId || "";
    socioActividad.value = act.socioId || "";
    proyectoActividad.value = act.proyectoId || "";
    beneficiariosActividad.value = (act.beneficiarios || []).join(",");
    duracionActividad.value = act.duracionMin || "";
    cupoActividad.value = act.cupo || "";
    descripcionActividad.value = act.descripcion || "";
  }

  modalActividad.style.display = "flex";
}

// ==================== EVENTOS ====================
modalCloseActividad.onclick = () => modalActividad.style.display = "none";
btnCrearActividad.onclick = () => abrirModalActividad();

btnGuardarActividad.onclick = async () => {
  if (!nombreActividad.value.trim()) return alert("Ingrese nombre");

  const actividadObj = {
    nombre: nombreActividad.value.trim(),
    tipoId: tipoActividad.value,
    lugarId: lugarActividad.value,
    oferenteId: oferenteActividad.value,
    socioId: socioActividad.value,
    proyectoId: proyectoActividad.value,
    beneficiarios: beneficiariosActividad.value.split(",").map(b => b.trim()).filter(b => b),
    duracionMin: duracionActividad.value ? parseInt(duracionActividad.value) : null,
    cupo: cupoActividad.value ? parseInt(cupoActividad.value) : null,
    descripcion: descripcionActividad.value || "",
    fechaCreacion: Date.now()
  };

  try {
    if (idActividadInput.value) {
      await updateDoc(doc(db, ACTIVIDADES_COL, idActividadInput.value), actividadObj);
    } else {
      await addDoc(collection(db, ACTIVIDADES_COL), actividadObj);
    }

    modalActividad.style.display = "none";
    cargarActividades();
    alert("✅ Actividad guardada");
  } catch (err) {
    console.error("Error guardando actividad:", err);
    alert("❌ Error al guardar");
  }
};

// ==================== INICIO ====================
document.addEventListener("DOMContentLoaded", async () => {
  await testFirestore();
  await cargarTodosMantenedores();
  await cargarActividades();
});
