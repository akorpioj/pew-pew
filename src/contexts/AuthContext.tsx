import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider, microsoftProvider } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  role: string | null; // Custom claim: 'ADMIN' | 'EXPERT' | 'VIEWER' | null
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Read the custom role claim set by the setUserRole Cloud Function.
        const tokenResult = await firebaseUser.getIdTokenResult();
        setRole((tokenResult.claims["role"] as string) ?? null);
      } else {
        setRole(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleSignInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const handleSignInWithMicrosoft = async () => {
    await signInWithPopup(auth, microsoftProvider);
  };

  const handleSignInWithEmailPassword = async (
    email: string,
    password: string
  ) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        signInWithGoogle: handleSignInWithGoogle,
        signInWithMicrosoft: handleSignInWithMicrosoft,
        signInWithEmailPassword: handleSignInWithEmailPassword,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
