import { BarChart3 } from 'lucide-react';

export default function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <BarChart3 className="text-blue-700 animate-spin" size={48} aria-label="Loading spinner" />
    </div>
  );
}
