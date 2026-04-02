"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { getMyRBACProfile } from "@/app/actions/auth";

interface AuthContextType {
  user: any | null;
  isAdmin: boolean;
  roleName: string;
  permissions: string[];
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (key: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  roleName: "none",
  permissions: [],
  loading: true,
  authError: null,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logout: async () => {},
  hasPermission: () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, isPending, error } = authClient.useSession();
  const [authError, setAuthError] = useState<string | null>(null);
  const [roleName, setRoleName] = useState<string>("none");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [rbacLoading, setRbacLoading] = useState(false);

  const user = session?.user || null;
  // loading = true until both the session AND the RBAC profile have resolved
  const loading = isPending || rbacLoading;

  // Fetch the user's RBAC profile from the database each time their identity changes.
  // This replaces the old hardcoded ADMIN_EMAILS whitelist with a real DB-driven check.
  useEffect(() => {
    if (!user?.id) {
      // Logged-out state — clear role data immediately
      setRoleName("none");
      setPermissions([]);
      return;
    }

    setRbacLoading(true);
    getMyRBACProfile()
      .then((profile) => {
        setRoleName(profile?.roleName || "none");
        setPermissions(profile?.permissions || []);
      })
      .catch(() => {
        setRoleName("none");
        setPermissions([]);
      })
      .finally(() => setRbacLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (error) {
      setAuthError(error.message || "An authentication error occurred.");
    } else {
      setAuthError(null);
    }
  }, [error]);

  // isAdmin is now derived from the real RBAC role name, not a hardcoded email list.
  const isAdmin = roleName === "Admin";

  /** Checks whether the current user holds a specific permission key. */
  const hasPermission = (key: string) => permissions.includes(key);

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
    const { data, error } = await authClient.signIn.email({ email, password });
    if (error) {
      console.error("Sign-in Error:", error);
      setAuthError(error.message || "Invalid email or password.");
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    setAuthError(null);
    const { data, error } = await authClient.signUp.email({ email, password, name });
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
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        roleName,
        permissions,
        loading,
        authError,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
