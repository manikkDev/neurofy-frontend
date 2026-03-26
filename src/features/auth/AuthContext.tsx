import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types/auth";
import { storage } from "@/lib/storage";
import { authApi } from "@/services/api/authApi";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: "patient" | "doctor") => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = storage.getToken();
      const savedUser = storage.getUser();

      if (token && savedUser) {
        try {
          const response = await authApi.getCurrentUser(token);
          setUser(response);
        } catch (error) {
          storage.clearAuth();
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    storage.setToken(response.accessToken);
    storage.setRefreshToken(response.refreshToken);
    storage.setUser(response.user);
    setUser(response.user);
  };

  const signup = async (name: string, email: string, password: string, role: "patient" | "doctor") => {
    const response = await authApi.signup({ name, email, password, role });
    storage.setToken(response.accessToken);
    storage.setRefreshToken(response.refreshToken);
    storage.setUser(response.user);
    setUser(response.user);
  };

  const logout = () => {
    const token = storage.getToken();
    if (token) {
      authApi.logout(token).catch(() => {});
    }
    storage.clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
