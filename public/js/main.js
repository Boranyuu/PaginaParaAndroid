import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const form = document.getElementById('loginForm');
const mensaje = document.getElementById('mensaje');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  mensaje.textContent = "";

  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('contrasena').value.trim();

  try {
    // 1️⃣ Login en Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // 2️⃣ Obtener datos del usuario por UID
    const ref = doc(db, "usuarios", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      mensaje.textContent = "Usuario no registrado en Firestore";
      mensaje.style.color = "red";
      return;
    }

    const user = snap.data();

    // 3️⃣ Validar estado
    if (user.estado?.toLowerCase() !== "activo") {
      mensaje.textContent = "Cuenta inactiva";
      mensaje.style.color = "red";
      return;
    }

    // 4️⃣ Guardar datos en localStorage
    localStorage.setItem('usuarioActivo', JSON.stringify(user));

    // 5️⃣ Redirección según rol
    const rol = user.rol?.toLowerCase();

    if (rol === "admin") {
      window.location.href = "./admin.html";
    } 
    else if (rol === "gestionador" || rol === "gestor") {
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
