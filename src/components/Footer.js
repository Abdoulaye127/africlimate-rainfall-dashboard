export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-blue-900 via-blue-800 to-green-700 text-white py-10 mt-20 shadow-inner border-t-2 border-blue-400">
      <div className="max-w-7xl mx-auto px-6 grid gap-10 md:grid-cols-3 md:gap-16">
        <div className="flex items-center gap-5">
          <img
            src="/data/logo.jpeg"
            alt="AfriClimate AI Logo"
            className="w-14 h-14 rounded-xl shadow-md border-4 border-blue-600 object-cover"
          />
          <div>
            <h2 className="text-white text-xl font-extrabold mb-2 drop-shadow-md">AfriClimate AI</h2>
            <p className="text-base text-blue-100">
              Empowering Africa with AI-driven climate intelligence.<br />
              <span className="mt-2 inline-block text-teal-200 text-xs">Proudly serving communities & researchers</span>
            </p>
          </div>
        </div>
        <div>
          <h3 className="text-white font-extrabold mb-3">Resources</h3>
          <ul className="space-y-2 text-base">
            <li><a href="https://africlimate.ai" className="hover:underline hover:text-teal-200">Official Website</a></li>
            <li><button type="button" className="bg-transparent underline text-inherit px-0 py-0 hover:text-teal-200 cursor-pointer" aria-label="Systematic Review">Systematic Review</button></li>
            <li><button type="button" className="bg-transparent underline text-inherit px-0 py-0 hover:text-teal-200 cursor-pointer" aria-label="AI Climate Tools">AI Climate Tools</button></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-extrabold mb-3">Contact</h3>
          <ul className="space-y-2 text-base">
            <li><span className="text-teal-200">Email:</span> research@africlimate.ai</li>
            <li><span className="text-teal-200">Twitter:</span> <a href="https://x.com/AfriClimateAI" className="hover:underline hover:text-teal-200">@AfriClimateAI</a></li>
            <li><span className="text-teal-200">LinkedIn:</span> <a href="https://linkedin.com/company/africlimate-ai" className="hover:underline hover:text-teal-200">AfriClimate AI</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-10 border-t border-blue-400 pt-4 text-center text-xs text-blue-100 opacity-90">
        © {new Date().getFullYear()} AfriClimate AI — All Rights Reserved.
      </div>
    </footer>
  );
}
