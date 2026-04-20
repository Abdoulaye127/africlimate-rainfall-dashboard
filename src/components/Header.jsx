export default function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-800 via-blue-500 to-teal-400 text-white py-6 shadow-xl border-b-2 border-teal-200">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src="/data/logo.jpeg"
            alt="AfriClimate AI Logo"
            className="w-16 h-16 rounded-2xl shadow-lg border-4 border-white object-cover"
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
              AfriClimate AI
            </h1>
            <div className="text-sm font-medium text-blue-100 mt-1">
              Rainfall Products Performance Dashboard
            </div>
          </div>
        </div>
        <nav className="hidden md:flex gap-7 text-md font-semibold">
          <a href="https://africlimate.ai" className="hover:underline transition hover:text-teal-200">Website</a>
          <a href="https://x.com/AfriClimateAI" className="hover:underline transition hover:text-teal-200">Twitter</a>
          <a href="https://www.linkedin.com/company/africlimate-ai" className="hover:underline transition hover:text-teal-200">LinkedIn</a>
        </nav>
      </div>
    </header>
  );
}
