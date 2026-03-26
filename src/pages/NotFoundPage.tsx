import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-7xl font-bold text-brand-600 mb-4">404</p>
        <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary inline-block">
          Go Home
        </Link>
      </div>
    </div>
  );
}
