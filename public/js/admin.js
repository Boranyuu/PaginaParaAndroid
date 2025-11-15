import { db } from '../firebase.js';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
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

// ✅ Mostrar nombre en navbar
document.getElementById('nombreAdmin').textContent = usuarioActivo.nombre;

// ✅ Cerrar sesión
document.getElementById('btnCerrarSesion').addEventListener('click', async () => {
  await signOut(auth);
  localStorage.removeItem('usuarioActivo');
  window.location.href = "./index.html";
});

const usuarioForm = document.getElementById('usuarioForm');
const usuariosList = document.getElementById('usuariosList');

// ✅ Registrar nuevo usuario
usuarioForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const rol = document.getElementById('tipoUsuario').value.trim();
  const rut = document.getElementById('rut').value.trim();
  const nombre = document.getElementById('nombre').value.trim();
  const contraseña = document.getElementById('contraseña').value.trim();
  const email = document.getElementById('email').value.trim();

  if (!rol || !rut || !nombre || !contraseña || !email) {
    alert("Todos los campos son obligatorios");
    return;
  }

  // ✅ Verificar RUT único
  const q = query(collection(db, "usuarios"), where("rut", "==", rut));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    alert("Ya existe un usuario con este RUT");
    return;
  }

  try {
    // ✅ Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, contraseña);
    const uid = userCredential.user.uid;

    // ✅ Guardar en Firestore con la nueva estructura
    await addDoc(collection(db, "usuarios"), {
      uid,
      email,
      nombre,
      rol,
      rut,
      estado: "activo",
      creadoEl: Date.now() // número en milisegundos
    });

    alert("Usuario creado correctamente");
    usuarioForm.reset();
    cargarUsuarios();
  } catch (error) {
    alert("Error: " + error.message);
    console.error(error);
  }
});

// ✅ Mostrar lista de usuarios
async function cargarUsuarios() {
  usuariosList.innerHTML = '';
  const querySnapshot = await getDocs(collection(db, "usuarios"));
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const li = document.createElement('li');
    li.textContent = `${data.rol} | ${data.nombre} | ${data.rut} | ${data.email} | ${data.estado}`;
    usuariosList.appendChild(li);
  });
}

window.addEventListener('DOMContentLoaded', cargarUsuarios);
