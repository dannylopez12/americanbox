import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, fdb } from "../lib/firebaseClient";
import { doc, getDoc } from "firebase/firestore";

export type MeResponse = {
  ok?: boolean;
  logged: boolean;
  role?: "admin" | "customer" | string;
  uid?: string;
  customer_id?: string | null;
  username?: string | null;
  email?: string | null;
  error?: string;
};

export function useSession() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    // Usar Firebase Auth para verificar sesión
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        console.log('� User authenticated:', user.uid);

        // Obtener datos adicionales de Firestore
        try {
          const userDoc = await getDoc(doc(fdb, 'users', user.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};

          const sessionData: MeResponse = {
            ok: true,
            logged: true,
            uid: user.uid,
            email: user.email || undefined,
            username: user.email || userData.username,
            role: userData.role || 'customer',
            customer_id: userData.customer_id || null,
          };

          // Guardar en localStorage para persistencia
          localStorage.setItem('americanbox_session', JSON.stringify(sessionData));
          setMe(sessionData);
        } catch (error) {
          console.error('Error getting user data:', error);
          setMe({ ok: false, logged: false, error: 'Error loading user data' });
        }
      } else {
        console.log('🔍 No user authenticated');
        localStorage.removeItem('americanbox_session');
        setMe({ ok: false, logged: false });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { loading, me };
}
