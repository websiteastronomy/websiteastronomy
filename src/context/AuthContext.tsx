"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
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
  const [hasLoadedRBAC, setHasLoadedRBAC] = useState(false);
  const refreshInFlight = useRef(false);

  const user = session?.user || null;
  const loading = isPending || (!!user?.id && !hasLoadedRBAC);

  const refreshRBACInternal = useCallback(async (silent: boolean) => {
    if (!user?.id) {
      setRoleName("none");
      setPermissions([]);
      setHasLoadedRBAC(true);
      return;
    }

    if (refreshInFlight.current) {
      return;
    }

    refreshInFlight.current = true;
    if (!silent) {
      setRbacLoading(true);
    }
    try {
      const profile = await getMyRBACProfile();
      setRoleName(profile?.roleName || "none");
      setPermissions(profile?.permissions || []);
      setHasLoadedRBAC(true);
    } catch {
      setRoleName("none");
      setPermissions([]);
      setHasLoadedRBAC(true);
    } finally {
      if (!silent) {
        setRbacLoading(false);
      }
      refreshInFlight.current = false;
    }
  }, [user?.id]);

  const refreshRBAC = useCallback(async () => {
    await refreshRBACInternal(false);
  }, [refreshRBACInternal]);

  useEffect(() => {
    if (!user?.id) {
      setHasLoadedRBAC(true);
      return;
    }

    setHasLoadedRBAC(false);
    refreshRBACInternal(false);
  }, [refreshRBACInternal, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const onFocus = () => {
      refreshRBACInternal(true);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === "rbac-profile-updated") {
        refreshRBACInternal(true);
      }
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    const intervalId = window.setInterval(() => {
      refreshRBACInternal(true);
    }, 30000);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(intervalId);
    };
  }, [refreshRBACInternal, user?.id]);

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
