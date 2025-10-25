import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Fetch profile safely
  const loadProfile = async (uid) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .eq("id", uid)
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn("Profile fetch error:", err.message);
      return null;
    }
  };

  useEffect(() => {
    let active = true;

    const handleSession = async (sessionUser) => {
      if (!active) return;

      if (sessionUser) {
        setUser(sessionUser);
        const prof = await loadProfile(sessionUser.id);

        const profileData =
          prof || {
            email: sessionUser.email,
            role: "admin",
            full_name: "System Admin",
          };

        setProfile(profileData);
        redirectByRole(profileData.role);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    };

    // ✅ Initialize + listener
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data?.session?.user ?? null;
      await handleSession(currentUser);

      supabase.auth.onAuthStateChange((_event, session) => {
        handleSession(session?.user ?? null);
      });
    };

    init();

    return () => {
      active = false;
    };
  }, []);

  // ✅ PATCHED — Prevent redirect if already on guard route
  const redirectByRole = (role) => {
    setTimeout(() => {
      const currentPath = window.location.pathname;

      // Admins: only redirect if not already in admin path
      if (role === "admin" && !currentPath.startsWith("/admin")) {
        navigate("/admin/dashboard");
      }

      // Guards: only redirect if NOT already on a guard route
      else if (role === "guard") {
        const isGuardRoute =
          currentPath.startsWith("/guard/routes") ||
          currentPath.startsWith("/guard/report") ||
          currentPath.startsWith("/guard/selfie") ||
          currentPath.startsWith("/guard/dashboard");

        if (!isGuardRoute) {
          navigate("/guard/dashboard");
        }
      }

      // Others: default to home
      else if (role !== "admin" && role !== "guard") {
        navigate("/");
      }
    }, 200);
  };

  // ✅ Safe sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    navigate("/login");
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-lg text-primary">
        Loading...
      </div>
    );

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
