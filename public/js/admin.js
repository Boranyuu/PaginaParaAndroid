import { db } from './firebase.js';
import { 
  collection, 
  addDoc, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

const auth = getAuth();
const usuarioActivo = JSON.parse(localStorage.getItem('usuarioActivo'));

// ✅ Verificación de acceso
if (!usuarioActivo || usuarioActivo.rol.toLowerCase() !== "admin") {
  alert("Acceso denegado. Solo administradores pueden entrar aquí.");
  window.location.href = "./index.html";
}

// ✅ Mostrar admin en navbar
document.getElementById('nombreAdmin').textContent = usuarioActivo.nombre;

// ✅ Cerrar sesión
document.getElementById('btnCerrarSesion').addEventListener('click', async () => {
  await signOut(auth);
  localStorage.removeItem('usuarioActivo');
  window.location.href = "./index.html";
});

const usuarioForm = document.getElementById('usuarioForm');
const usuariosList = document.getElementById('usuariosList');

// ✅ Generar contraseña segura aleatoria
function generarPassword() {
  return Math.random().toString(36).slice(-10) + "!";
}

// ✅ Registrar usuario
usuarioForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const email = document.getElementById('email').value.trim();
  const rol = document.getElementById('rol').value;

  const estado = document.getElementById('estado').value;
  const aprobado = document.getElementById('aprobado').value === "true";
  const emailVerificado = document.getElementById('emailVerificado').value === "true";

  if (!nombre || !email || !rol) {
    alert("Todos los campos obligatorios deben completarse");
    return;
  }

  const passwordTemporal = generarPassword();

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, passwordTemporal);
    const uid = userCredential.user.uid;

    await addDoc(collection(db, "usuarios"), {
      uid,
      nombre,
      email,
      rol,
      estado,
      aprobado,
      emailVerificado,
      passwordTemporal, // puedes quitar esto en producción
      fechaRegistro: new Date().toISOString()
    });

    alert(`✅ Usuario creado\nContraseña temporal: ${passwordTemporal}`);
    usuarioForm.reset();
    cargarUsuarios();

  } catch (error) {
    console.error(error);

    if (error.code === "auth/email-already-in-use") {
      alert("❌ Este correo ya está registrado");
    } else if (error.code === "auth/invalid-email") {
      alert("❌ Email no válido");
    } else {
      alert("❌ Error al crear usuario");
    }
  }
});

// ✅ Listar usuarios
async function cargarUsuarios() {
  usuariosList.innerHTML = '';

  const querySnapshot = await getDocs(collection(db, "usuarios"));
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();

    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${data.nombre}</strong><br>
      📧 ${data.email}<br>
      👤 Rol: ${data.rol}<br>
      ✅ Estado: ${data.estado}<br>
      ✔ Aprobado: ${data.aprobado ? "Sí" : "No"}
      <hr>
    `;
    
    usuariosList.appendChild(li);
  });
}

window.addEventListener('DOMContentLoaded', cargarUsuarios);
