import { db, auth } from './firebase.js';
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

// Registro de usuario
const registroForm = document.getElementById('registroForm');
registroForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    alert('Usuario registrado: ' + userCredential.user.email);
  } catch (error) {
    alert('Error: ' + error.message);
  }
});

// Agregar datos a Firestore
const dataForm = document.getElementById('dataForm');
dataForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('nombre').value;
  const edad = parseInt(document.getElementById('edad').value);

  try {
    const docRef = await addDoc(collection(db, "usuariosPrueba"), { nombre, edad });
    alert('Documento agregado con ID: ' + docRef.id);
    cargarUsuarios(); // actualizar lista
  } catch (error) {
    alert('Error: ' + error.message);
  }
});

// Mostrar usuarios
const usuariosList = document.getElementById('usuariosList');
async function cargarUsuarios() {
  usuariosList.innerHTML = '';
  const querySnapshot = await getDocs(collection(db, "usuariosPrueba"));
  querySnapshot.forEach((doc) => {
    const li = document.createElement('li');
    li.textContent = `${doc.data().nombre} - ${doc.data().edad} años`;
    usuariosList.appendChild(li);
  });
}

// Cargar usuarios al inicio
cargarUsuarios();
