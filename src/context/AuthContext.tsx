"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

interface AuthContextType {
  user: any | null; // better-auth user object
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  authError: null,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, isPending, error } = authClient.useSession();
  const [authError, setAuthError] = useState<string | null>(null);

  // List of admin emails
  const ADMIN_EMAILS = ["shashanknm9535@gmail.com"];

  const user = session?.user || null;
  const isAdmin = user ? ADMIN_EMAILS.includes(user.email || "") : false;
  const loading = isPending;

  useEffect(() => {
    if (error) {
      setAuthError(error.message || "An authentication error occurred.");
    } else {
      setAuthError(null);
    }
  }, [error]);

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/admin", 
      });
    } catch (e: any) {
      console.error("Authentication Error:", e);
      setAuthError("Failed to initiate Google sign-in.");
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setAuthError(null);
      await authClient.signIn.email({
        email,
        password,
        callbackURL: "/admin",
      });
    } catch (e: any) {
      console.error("Sign-in Error:", e);
      setAuthError("Invalid credentials.");
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      setAuthError(null);
      await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: "/admin",
      });
    } catch (e: any) {
      console.error("Sign-up Error:", e);
      setAuthError("Failed to sign up.");
    }
  };

  const logout = async () => {
    try {
      await authClient.signOut();
      window.location.href = "/";
    } catch (e) {
      console.error("Logout Error:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, authError, signInWithGoogle, signInWithEmail, signUpWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
