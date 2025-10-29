import { api } from "../lib/api";

export async function logout() {
  try {
    // Limpiar sesión del backend
    await api("/api/auth/logout", { method: "POST" });
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