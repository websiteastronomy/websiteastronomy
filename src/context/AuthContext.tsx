"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authClient } from "@/lib/auth-client";
import { getMyRBACProfile } from "@/app/actions/auth";

interface AuthContextType {
  user: any | null;
  isAdmin: boolean;
  roleName: string;
  permissions: string[];
  loading: boolean;
  authError: string | null;
  refreshRBAC: () => Promise<void>;
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
  refreshRBAC: async () => {},
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
  const loading = isPending || rbacLoading;

  const refreshRBAC = useCallback(async () => {
    if (!user?.id) {
      setRoleName("none");
      setPermissions([]);
      return;
    }

    setRbacLoading(true);
    try {
      const profile = await getMyRBACProfile();
      setRoleName(profile?.roleName || "none");
      setPermissions(profile?.permissions || []);
    } catch {
      setRoleName("none");
      setPermissions([]);
    } finally {
      setRbacLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshRBAC();
  }, [refreshRBAC]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const onFocus = () => {
      refreshRBAC();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === "rbac-profile-updated") {
        refreshRBAC();
      }
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    const intervalId = window.setInterval(() => {
      refreshRBAC();
    }, 30000);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(intervalId);
    };
  }, [refreshRBAC, user?.id]);

  useEffect(() => {
    if (error) {
      setAuthError(error.message || "An authentication error occurred.");
    } else {
      setAuthError(null);
    }
  }, [error]);

  const isAdmin = roleName === "Admin";
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
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      console.error("Sign-in Error:", error);
      setAuthError(error.message || "Invalid email or password.");
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    setAuthError(null);
    const { error } = await authClient.signUp.email({ email, password, name });
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
        refreshRBAC,
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
