// actividades.js
import { db } from "./firebase.js";
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

export const ACTIVIDADES_COL = "actividades";
export const actividadesMap = new Map(); // id -> actividad
export const oferentesMap = new Map(); // id -> nombre

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
const beneficiariosActividad = document.getElementById("beneficiariosActividad");
const duracionActividad = document.getElementById("duracionActividad");
const cupoActividad = document.getElementById("cupoActividad");
const descripcionActividad = document.getElementById("descripcionActividad");
const actividadSelect = document.getElementById("actividadSelect");

// ---------------------------
// Cargar oferentes
// ---------------------------
export async function cargarOferentes() {
  oferenteActividad.innerHTML = '<option value="">Cargando oferentes...</option>';
  oferentesMap.clear();

  try {
    const snap = await getDocs(collection(db, "oferentes")); // colección de oferentes
    oferenteActividad.innerHTML = '<option value="">Seleccione un oferente...</option>';

    snap.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;
      const nombre = data.nombre ?? `Oferente ${id}`;
      oferentesMap.set(id, nombre);

      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = nombre;
      oferenteActividad.appendChild(opt);
    });
  } catch (err) {
    console.error("Error cargando oferentes:", err);
    oferenteActividad.innerHTML = '<option value="">Error cargando oferentes</option>';
  }
}

// ---------------------------
// Cargar actividades
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
// Modal Actividad
// ---------------------------
export function abrirModalActividad() {
  idActividadInput.value = "";
  nombreActividad.value = "";
  tipoActividad.value = "";
  lugarActividad.value = "";
  oferenteActividad.value = "";
  beneficiariosActividad.value = "";
  duracionActividad.value = "";
  cupoActividad.value = "";
  descripcionActividad.value = "";
  modalActividad.style.display = "flex";
}

// Cerrar modal
modalCloseActividad.addEventListener("click", () => modalActividad.style.display = "none");
window.addEventListener("click", e => { if (e.target === modalActividad) modalActividad.style.display = "none"; });
btnCrearActividad.addEventListener("click", abrirModalActividad);

// ---------------------------
// Guardar actividad
// ---------------------------
btnGuardarActividad.addEventListener("click", async () => {
  const nombre = nombreActividad.value.trim();
  if (!nombre) return alert("Ingrese el nombre de la actividad.");

  btnGuardarActividad.disabled = true;

  const actividadObj = {
    nombre,
    tipo: tipoActividad.value.trim() || "",
    lugar: lugarActividad.value.trim() || "",
    oferenteId: oferenteActividad.value || null,
    oferenteNombre: oferentesMap.get(oferenteActividad.value) || "",
    beneficiarios: beneficiariosActividad.value ? beneficiariosActividad.value.split(",").map(b => b.trim()) : [],
    duracionMin: duracionActividad.value ? parseInt(duracionActividad.value) : null,
    cupo: cupoActividad.value ? parseInt(cupoActividad.value) : null,
    descripcion: descripcionActividad.value.trim() || "",
    citas: [],
    estado: "activa",
    fechaCreacion: Date.now()
  };

  try {
    await addDoc(collection(db, ACTIVIDADES_COL), actividadObj);
    alert("Actividad creada.");
    modalActividad.style.display = "none";
    cargarActividades();
  } catch (err) {
    console.error("Error creando actividad:", err);
    alert("Error al crear actividad.");
  } finally {
    btnGuardarActividad.disabled = false;
  }
});

// ---------------------------
// Inicializar al cargar la página
// ---------------------------
document.addEventListener("DOMContentLoaded", async () => {
  await cargarOferentes();
  await cargarActividades();
});
