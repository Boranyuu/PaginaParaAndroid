import { db } from './firebase.js';
import { collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const usuarioForm = document.getElementById('usuarioForm');

// Validar RUT
function validarRut(rut) {
  const regex = /^\d{7,8}-[0-9kK]$/;
  return regex.test(rut);
}

// Validar Gmail
function validarGmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  return regex.test(email);
}

// Crear usuario
usuarioForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const tipoUsuario = document.getElementById('tipoUsuario').value.trim();
  const rut = document.getElementById('rut').value.trim();
  const nombre = document.getElementById('nombre').value.trim();
  const contraseña = document.getElementById('contraseña').value.trim();
  const gmail = document.getElementById('gmail').value.trim();

  // Validaciones
  if (!tipoUsuario || !rut || !nombre || !contraseña || !gmail) {
    console.log("[Error] Todos los campos son obligatorios");
    return;
  }
  if (!validarRut(rut)) {
    console.log("[Error] RUT inválido (formato 12345678-9)");
    return;
  }
  if (!validarGmail(gmail)) {
    console.log("[Error] Gmail inválido (solo @gmail.com)");
    return;
  }
  if (contraseña.length < 6) {
    console.log("[Error] La contraseña debe tener al menos 6 caracteres");
    return;
  }

  // Verificar si el RUT ya existe
  const q = query(collection(db, "usuario"), where("rut", "==", rut));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    console.log("[Error] Ya existe un usuario con este RUT");
    return;
  }

  // Guardar en Firestore
  try {
    const docRef = await addDoc(collection(db, "usuario"), {
      tipoUsuario, rut, nombre, contraseña, gmail
    });
    console.log("[OK] Usuario creado:", { id: docRef.id, tipoUsuario, rut, nombre, gmail });

    // Mostrar todos los usuarios en consola
    await cargarUsuarios();
    usuarioForm.reset();
  } catch (error) {
    console.log("[Error] Al crear usuario:", error.message);
  }
});

// Mostrar todos los usuarios en consola
async function cargarUsuarios() {
  const querySnapshot = await getDocs(collection(db, "usuario"));
  console.log("=== Lista de usuarios ===");
  querySnapshot.forEach((doc) => console.log({ id: doc.id, ...doc.data() }));
  console.log("=========================");
}

// Cargar usuarios al inicio
cargarUsuarios();
