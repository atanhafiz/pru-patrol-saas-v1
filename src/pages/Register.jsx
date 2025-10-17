import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [guardName, setGuardName] = useState("");
  const [plateNo, setPlateNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        let user = data.user;
        if (!user) {
          const { data: inData, error: inErr } = await supabase.auth.signInWithPassword({ email, password });
          if (inErr) throw inErr;
          user = inData.user ?? inData?.session?.user;   // ✅ sekarang boleh assign
        }
        
      if (!user) throw new Error("Registration success but no session/user.");

      const role = email.toLowerCase() === "admin@ahetech.my" ? "admin" : "guard";

      const { error: insertErr } = await supabase.from("profiles").insert([
        { id: user.id, email, full_name: fullName, role },
      ]);
      if (insertErr) throw insertErr;

      // Set localStorage for guards
      if (role === "guard") {
        localStorage.setItem("guardName", guardName || fullName);
        localStorage.setItem("plateNo", plateNo || "Unknown");
      }

      setMsg("✅ Registration complete. Redirecting...");
      setTimeout(() => {
        navigate(role === "admin" ? "/admin/dashboard" : "/guard/dashboard");
      }, 600);
    } catch (err) {
      console.error("Register error:", err.message);
      setMsg("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-soft px-4">
      <form onSubmit={handleRegister} className="bg-white shadow-xl p-8 rounded-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 text-primary">Create Your Account</h2>

        {msg && (
          <p className={`text-sm text-center mb-4 ${msg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>
            {msg}
          </p>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-primary mb-1">Full Name</label>
          <input type="text" placeholder="John Doe" value={fullName} onChange={(e)=>setFullName(e.target.value)} className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" required />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-primary mb-1">Guard Name</label>
          <input type="text" placeholder="Amir" value={guardName} onChange={(e)=>setGuardName(e.target.value)} className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-primary mb-1">Plate Number</label>
          <input type="text" placeholder="ABC1234" value={plateNo} onChange={(e)=>setPlateNo(e.target.value)} className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-primary mb-1">Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" required />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-primary mb-1">Password</label>
          <input type="password" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" required />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-accent text-white font-semibold py-3 rounded-lg hover:bg-opacity-90 transition">
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">Already have an account? <a href="/login" className="text-accent font-semibold hover:underline">Login</a></p>
      </form>
    </div>
  );
}
