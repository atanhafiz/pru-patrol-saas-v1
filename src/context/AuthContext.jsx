import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // fetch profile
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
        if (prof) {
          setProfile(prof);
          redirectByRole(prof.role);
        } else {
          const fallback = {
            email: sessionUser.email,
            role: "admin",
            full_name: "System Admin",
          };
          setProfile(fallback);
          redirectByRole(fallback.role);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    };

    // combine session + listener
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

  const redirectByRole = (role) => {
    setTimeout(() => {
      if (role === "admin") navigate("/admin/dashboard");
      else if (role === "guard") navigate("/guard/dashboard");
      else navigate("/");
    }, 200);
  };

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
