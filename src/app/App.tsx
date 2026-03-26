import { RouterProvider } from "react-router-dom";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "@/features/auth";
import { router } from "./router";

export function App() {
  return (
    <AuthProvider>
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </AuthProvider>
  );
}
