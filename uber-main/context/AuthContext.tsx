import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  deleteUser as firebaseDeleteUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import {
  GUEST_USER,
  getGuestModeEnabled,
  setGuestModeEnabled,
} from "@/lib/guestMode";

interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  canAccessApp: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  enterGuestMode: () => Promise<void>;
  exitGuestMode: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [mappedUser, setMappedUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [guestChecked, setGuestChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize guest mode
  useEffect(() => {
    getGuestModeEnabled().then((enabled) => {
      setIsGuest(enabled);
      setGuestChecked(true);
    });
  }, []);

  // Sync user profile from Firestore
  const syncProfile = useCallback(async (fUser: FirebaseUser) => {
    try {
      const userRef = doc(db, "users", fUser.uid);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (err) {
        console.error("[AuthContext] Error fetching user " + fUser.uid + ":", err);
        throw err;
      }

      let profileData: any = null;

      if (!userSnap.exists()) {
        // Create new user profile if it doesn't exist
        const parts = (fUser.displayName || "").trim().split(/\s+/);
        const firstName = parts[0] || "VARLIFE";
        const lastName = parts.slice(1).join(" ") || "User";
        
        profileData = {
          id: fUser.uid,
          email: fUser.email || "",
          first_name: firstName,
          last_name: lastName,
          full_name: fUser.displayName || `${firstName} ${lastName}`.trim(),
          phone: fUser.phoneNumber || "",
          profile_image_url: fUser.photoURL || "",
          auth_provider: fUser.providerData[0]?.providerId || "email",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await setDoc(userRef, profileData);
      } else {
        profileData = userSnap.data();
      }

      setMappedUser({
        id: fUser.uid,
        clerk_id: fUser.uid, // Keep compatibility
        email: profileData.email,
        full_name: profileData.full_name,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: profileData.phone,
        profile_image_url: profileData.profile_image_url,
        auth_provider: profileData.auth_provider,
        student_verification_status: profileData.student_verification_status ?? "none",
        user_metadata: {
          full_name: profileData.full_name,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          avatar_url: profileData.profile_image_url,
        },
      });
    } catch (error) {
      console.error("[AuthContext] Firestore sync failed:", error);
      setMappedUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen to Firebase Auth changes
  useEffect(() => {
    if (!guestChecked) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        if (isGuest) {
          setIsGuest(false);
          await setGuestModeEnabled(false);
        }
        await syncProfile(user);
      } else {
        setMappedUser(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [guestChecked, isGuest, syncProfile]);

  const enterGuestMode = useCallback(async () => {
    setIsGuest(true);
    setMappedUser(null);
    await setGuestModeEnabled(true);
    setLoading(false);
  }, []);

  const exitGuestMode = useCallback(async () => {
    setIsGuest(false);
    setMappedUser(null);
    await setGuestModeEnabled(false);
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (isGuest) {
        await exitGuestMode();
        return;
      }
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("[AuthContext] signOut error:", error);
    }
  }, [isGuest, exitGuestMode]);

  const deleteAccount = useCallback(async () => {
    if (auth.currentUser) {
      try {
        await firebaseDeleteUser(auth.currentUser);
      } catch (error) {
        console.error("[AuthContext] deleteAccount error:", error);
        throw error;
      }
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      await syncProfile(auth.currentUser);
    }
  }, [syncProfile]);

  const effectiveUser = mappedUser ?? (isGuest ? GUEST_USER : null);
  const isAuthenticated = !!mappedUser;
  const canAccessApp = isAuthenticated || isGuest;

  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser,
        session: firebaseUser ? { user: firebaseUser } : null,
        loading: loading || !guestChecked,
        isAuthenticated,
        isGuest,
        canAccessApp,
        signOut,
        refreshUser,
        enterGuestMode,
        exitGuestMode,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
