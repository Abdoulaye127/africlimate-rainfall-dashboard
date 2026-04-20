import { Search } from 'lucide-react';

export default function SearchBar({ searchQuery, setSearchQuery }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Search products, locations..."
        className="w-full p-3 pl-10 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
        aria-label="Search"
      />
      <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
    </div>
  );
}
