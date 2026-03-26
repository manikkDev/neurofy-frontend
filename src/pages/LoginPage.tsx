import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useAuth } from "@/features/auth";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      await login(data.email, data.password);
      
      const user = JSON.parse(localStorage.getItem("neurofy_user") || "{}");
      navigate(`/${user.role}/dashboard`);
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Email
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder="you@example.com"
            className="input-field w-full"
          />
          {errors.email && (
            <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Password
          </label>
          <input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            className="input-field w-full"
          />
          {errors.password && (
            <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-sm text-gray-500 text-center mt-4">
        Don't have an account?{" "}
        <Link to="/signup" className="text-brand-400 hover:text-brand-300">
          Sign up
        </Link>
      </p>
    </div>
  );
}
