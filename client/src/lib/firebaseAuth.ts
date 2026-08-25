import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut, type User } from "firebase/auth";
import { firebaseAuth, googleProvider } from "./firebase";

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!firebaseAuth) { setLoading(false); return; }
    return onAuthStateChanged(firebaseAuth, (nextUser) => { setUser(nextUser); setLoading(false); });
  }, []);
  return { user, loading };
}

export const loginWithEmail = (email: string, password: string) => {
  if (!firebaseAuth) throw new Error("Firebase is not configured.");
  return signInWithEmailAndPassword(firebaseAuth, email, password);
};
export const registerWithEmail = (email: string, password: string) => {
  if (!firebaseAuth) throw new Error("Firebase is not configured.");
  return createUserWithEmailAndPassword(firebaseAuth, email, password);
};
export const loginWithGoogle = () => {
  if (!firebaseAuth) throw new Error("Firebase is not configured.");
  return signInWithPopup(firebaseAuth, googleProvider);
};
export const logoutFirebase = () => firebaseAuth ? signOut(firebaseAuth) : Promise.resolve();
