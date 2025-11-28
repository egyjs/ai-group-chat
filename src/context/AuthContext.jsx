import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const bypassAuth = useMemo(() => {
        if (typeof import.meta === "undefined") return false;
        return import.meta.env?.VITE_BYPASS_AUTH === "true";
    }, []);

    const fallbackDevUser = useMemo(() => ({
        uid: "dev-user",
        displayName: "Product Teammate",
        email: "dev@example.com",
        photoURL: "https://avatars.githubusercontent.com/u/9919?v=4"
    }), []);

    function loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        if (bypassAuth) {
            setCurrentUser(fallbackDevUser);
            setLoading(false);
            return () => {};
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, [bypassAuth, fallbackDevUser]);

    const value = {
        currentUser,
        loginWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
