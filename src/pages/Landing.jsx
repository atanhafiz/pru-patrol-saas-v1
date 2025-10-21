import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 bg-white/90 backdrop-blur-md shadow-sm z-50 flex items-center justify-between px-4 sm:px-8 py-2 sm:py-3">
        <div className="mx-auto w-full max-w-6xl flex items-center justify-between">
          <Link 
            to="/" 
            className="text-2xl font-bold tracking-wide text-[#0B132B] whitespace-nowrap"
            aria-label="AHE SmartPatrol — Home"
          >
            AHE SmartPatrol
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 ml-auto mr-2 sm:mr-6">
            <Link 
              to="/login" 
              className="
                bg-gradient-to-r from-blue-600 to-blue-700
                hover:from-blue-700 hover:to-blue-800
                text-white font-medium text-sm sm:text-base
                px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow
                hover:shadow-md transition active:scale-[0.98]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
              "
              aria-label="Login"
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className="
                border border-blue-300 text-blue-700
                hover:bg-blue-50
                text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg
                transition
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                group
              "
              aria-label="Register"
            >
              Register
              <span className="block h-[2px] bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </Link>
          </div>
        </div>
      </nav>

      <header className="min-h-[90vh] flex flex-col justify-start items-center text-center px-4 pt-24 sm:pt-32 mb-10 sm:mb-16 bg-gradient-to-br from-[#f0f7ff] via-white to-[#e6f0ff]">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row justify-between items-center">
          <div className="max-w-2xl lg:max-w-xl text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B132B] leading-snug sm:leading-tight max-w-2xl">
                Realtime Security Patrol Management, Automated & Trusted.
              </h1>
              <p className="text-gray-500 text-sm sm:text-base mt-3">
                Trusted by professional security companies across Malaysia.
              </p>
              <p className="text-gray-600 text-sm sm:text-base mt-2 mb-6 max-w-md">
                Manage patrols, attendance, and incident reports — all in one modern platform.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link 
                to="/register" 
                className="mt-2 sm:mt-4 mb-8 sm:mb-12 bg-gradient-to-r from-blue-600 to-blue-700
                           hover:from-blue-700 hover:to-blue-800
                           text-white font-semibold px-6 py-3 rounded-xl
                           shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Get Started
              </Link>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mt-10 lg:mt-0"
          >
            <div className="relative w-full max-w-md mx-auto mt-8">
              <img
                src="/images/dashboard-preview.jpg"
                alt="Dashboard Preview"
                loading="lazy"
                decoding="async"
                width={1280}
                height={720}
                className="w-full h-auto object-cover rounded-2xl shadow-lg border border-gray-200 brightness-[0.98] contrast-[1.02]"
              />
              <p className="absolute bottom-3 left-1/2 -translate-x-1/2
                           text-[10px] sm:text-xs text-gray-700 bg-white/90
                           backdrop-blur-sm px-3 py-1 rounded-full shadow">
                Live Admin Dashboard Preview
              </p>
            </div>
          </motion.div>
        </div>
      </header>

      <motion.section
        className="relative w-full max-w-6xl mx-auto mt-16 sm:mt-24 mb-16 sm:mb-24 px-4 sm:px-0 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start justify-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        {/* Guard AI images */}
        <div className="flex flex-col gap-4">
          <img
            src="/images/guard-ai1.jpg"
            alt="Security Guard On Patrol"
            loading="lazy"
            decoding="async"
            width={600}
            height={800}
            className="w-full h-auto rounded-2xl shadow-lg border border-gray-200 object-cover brightness-[0.98] contrast-[1.02]"
          />
          <img
            src="/images/guard-ai2.jpg"
            alt="Guard Checkpoint Verification"
            loading="lazy"
            decoding="async"
            width={600}
            height={800}
            className="w-full h-auto rounded-2xl shadow-lg border border-gray-200 object-cover brightness-[0.98] contrast-[1.02]"
          />
        </div>
      </motion.section>

      <motion.footer 
        className="mt-16 sm:mt-24 bg-[#0B132B] text-gray-300 py-10 sm:py-14 text-center sm:text-left"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Column 1 — Brand */}
          <div>
            <h2 className="text-white font-bold text-2xl mb-2">AHE SmartPatrol</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Trusted patrol management solution for professional security teams.
            </p>
          </div>

          {/* Column 2 — Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-white transition">Home</a></li>
              <li><a href="/login" className="hover:text-white transition">Login</a></li>
              <li><a href="/register" className="hover:text-white transition">Register</a></li>
              <li><a href="/admin/dashboard" className="hover:text-white transition">Admin Dashboard</a></li>
            </ul>
          </div>

          {/* Column 3 — Contact */}
          <div>
            <h3 className="text-white font-semibold mb-3">Contact</h3>
            <p className="text-sm text-gray-400">
              📧 support@ahetech.com <br />
              📍 Sungai Petani, Kedah, Malaysia
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 border-t border-gray-700 pt-5 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} AHE Technology Sdn Bhd • AHE SmartPatrol • All Rights Reserved
        </div>
      </motion.footer>
    </div>
  );
}
