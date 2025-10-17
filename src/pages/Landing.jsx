import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex justify-between items-center px-10 py-5 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-primary">AHE Tech Patrol</h1>
        <div className="space-x-4">
          <Link to="/login" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90">
            Login
          </Link>
          <Link to="/register" className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white">
            Register
          </Link>
        </div>
      </nav>

      <header className="flex flex-col md:flex-row justify-between items-center flex-1 px-10">
        <div className="max-w-xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Realtime Security Patrol Management, Automated & Trusted.</h2>
          <p className="text-lg mb-6 text-gray-600">Urus rondaan, kehadiran & laporan pasukan anda dengan satu platform moden.</p>
          <Link to="/register" className="px-6 py-3 bg-accent text-white rounded-lg font-semibold">Get Started</Link>
        </div>
        <img src="https://placehold.co/500x350?text=Dashboard+Preview" alt="Dashboard preview" className="rounded-xl mt-10 md:mt-0 shadow-md" />
      </header>

      <footer className="bg-primary text-white text-center py-4">
        © {new Date().getFullYear()} AHE Technology Sdn Bhd
      </footer>
    </div>
  );
}
