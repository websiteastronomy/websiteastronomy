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
    setAuthError(null);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/admin", 
    });
    if (error) {
      console.error("Google Sign-in Error:", error);
      setAuthError(error.message || "Failed to initiate Google sign-in.");
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setAuthError(null);
    const { data, error } = await authClient.signIn.email({
      email,
      password,
    });
    if (error) {
      console.error("Sign-in Error:", error);
      setAuthError(error.message || "Invalid email or password.");
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    setAuthError(null);
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name,
    });
    if (error) {
      console.error("Sign-up Error:", error);
      setAuthError(error.message || "Failed to create account.");
    }
  };

  const logout = async () => {
    const { error } = await authClient.signOut();
    if (error) {
      console.error("Logout Error:", error);
    }
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, authError, signInWithGoogle, signInWithEmail, signUpWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
