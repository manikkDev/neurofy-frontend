/**
 * Phase 7 – Loading Spinner Component
 * 
 * Accessible loading indicator with ARIA labels
 */
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ size = "md", message, fullScreen = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2
        className={`${sizeClasses[size]} animate-spin text-blue-600`}
        aria-hidden="true"
      />
      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gray-50"
        role="status"
        aria-live="polite"
      >
        {spinner}
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite">
      {spinner}
    </div>
  );
}
