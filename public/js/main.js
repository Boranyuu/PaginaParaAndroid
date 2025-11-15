import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const form = document.getElementById('loginForm');
const mensaje = document.getElementById('mensaje');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  mensaje.textContent = "";

  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('contrasena').value.trim(); // <--- corregido

  try {
    // 1️⃣ Autenticar en Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // 2️⃣ Buscar información adicional en Firestore
    const q = query(collection(db, "usuarios"), where("email", "==", email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      mensaje.textContent = "Usuario no encontrado en Firestore";
      mensaje.style.color = "red";
      return;
    }

    const user = snapshot.docs[0].data();

    // 3️⃣ Validar estado
    if (user.estado?.toLowerCase() !== "activo") {
      mensaje.textContent = "Cuenta inactiva";
      mensaje.style.color = "red";
      return;
    }

    // 4️⃣ Guardar datos del usuario en localStorage
    localStorage.setItem('usuarioActivo', JSON.stringify(user));

    // 5️⃣ Redirección según rol
    const rol = user.rol?.toLowerCase();

    if (rol === "admin") {
      window.location.href = "./admin.html";
    } 
    else if (rol === "gestionador") {
      window.location.href = "./calendario.html";
    } 
    else {
      mensaje.textContent = "Acceso limitado";
      mensaje.style.color = "red";
    }

  } catch (error) {
    console.error(error);
    mensaje.textContent = "Correo o contraseña incorrectos";
    mensaje.style.color = "red";
  }
});
