import { signOut } from "firebase/auth";
import { auth } from "./firebaseClient";

export async function logout() {
  try {
    // Cerrar sesión en Firebase
    await signOut(auth);
  } catch (e) {
    console.error("Error during logout:", e);
  } finally {
    // Siempre limpiar localStorage
    localStorage.removeItem('americanbox_session');
    console.log('🚪 Session cleared from localStorage');
    // Redirigir a login
    window.location.href = "/#login";
  }
}