// actividades.js
import { db } from "./firebase.js";
import { collection, getDocs, addDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

export const ACTIVIDADES_COL = "actividades";
export const actividadesMap = new Map(); // id -> actividad
export const oferentesMap = new Map();   // id -> nombre
export const tiposMap = new Map();       // id -> nombre
export const lugaresMap = new Map();     // id -> nombre
export const sociosMap = new Map();      // id -> nombre
export const proyectosMap = new Map();   // id -> nombre

// DOM
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

// ---------------------------
// Función genérica para cargar mantenedores
// ---------------------------
async function cargarMantenedor(collectionName, selectElem, mapObj, placeholder = "Seleccione...") {
  selectElem.innerHTML = `<option value="">Cargando ${placeholder.toLowerCase()}...</option>`;
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
    selectElem.innerHTML = `<option value="">Error cargando ${placeholder.toLowerCase()}</option>`;
  }
}

// ---------------------------
// Cargar todos los mantenedores
// ---------------------------
export async function cargarTodosMantenedores() {
  await Promise.all([
    cargarMantenedor("oferentes", oferenteActividad, oferentesMap, "Seleccione un oferente"),
    cargarMantenedor("tiposActividad", tipoActividad, tiposMap, "Seleccione un tipo"),
    cargarMantenedor("lugares", lugarActividad, lugaresMap, "Seleccione un lugar"),
    cargarMantenedor("sociosComunitarios", socioActividad, sociosMap, "Seleccione un socio comunitario"),
    cargarMantenedor("proyectos", proyectoActividad, proyectosMap, "Seleccione un proyecto")
  ]);
}

// ---------------------------
// Cargar actividades para el select
// ---------------------------
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
    actividadSelect.innerHTML = '<option value="">Error cargando actividades</option>';
  }
}

// ---------------------------
// Abrir modal mantenedor
// ---------------------------
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

// ---------------------------
// Cerrar modal
// ---------------------------
modalCloseActividad.addEventListener("click", () => modalActividad.style.display = "none");
window.addEventListener("click", e => { if (e.target === modalActividad) modalActividad.style.display = "none"; });
btnCrearActividad.addEventListener("click", () => abrirModalActividad());

// ---------------------------
// Guardar actividad (crear o actualizar)
// ---------------------------
btnGuardarActividad.addEventListener("click", async () => {
  const nombre = nombreActividad.value.trim();
  if (!nombre) return alert("Ingrese el nombre de la actividad.");

  btnGuardarActividad.disabled = true;

  const actividadObj = {
    nombre,
    tipoId: tipoActividad.value || null,
    tipoNombre: tiposMap.get(tipoActividad.value) || "",
    lugarId: lugarActividad.value || null,
    lugarNombre: lugaresMap.get(lugarActividad.value) || "",
    oferenteId: oferenteActividad.value || null,
    oferenteNombre: oferentesMap.get(oferenteActividad.value) || "",
    socioId: socioActividad.value || null,
    socioNombre: sociosMap.get(socioActividad.value) || "",
    proyectoId: proyectoActividad.value || null,
    proyectoNombre: proyectosMap.get(proyectoActividad.value) || "",
    beneficiarios: beneficiariosActividad.value ? beneficiariosActividad.value.split(",").map(b => b.trim()) : [],
    duracionMin: duracionActividad.value ? parseInt(duracionActividad.value) : null,
    cupo: cupoActividad.value ? parseInt(cupoActividad.value) : null,
    descripcion: descripcionActividad.value.trim() || "",
    citas: [],
    estado: "activa",
    fechaCreacion: Date.now()
  };

  try {
    if (idActividadInput.value) {
      const ref = doc(db, ACTIVIDADES_COL, idActividadInput.value);
      await updateDoc(ref, actividadObj);
      alert("Actividad actualizada.");
    } else {
      await addDoc(collection(db, ACTIVIDADES_COL), actividadObj);
      alert("Actividad creada.");
    }
    modalActividad.style.display = "none";
    cargarActividades();
  } catch (err) {
    console.error("Error guardando actividad:", err);
    alert("Error al guardar la actividad.");
  } finally {
    btnGuardarActividad.disabled = false;
  }
});

// ---------------------------
// Inicializar
// ---------------------------
document.addEventListener("DOMContentLoaded", async () => {
  await cargarTodosMantenedores();
  await cargarActividades();
});
