import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useAuth } from "@/features/auth";


const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["patient", "doctor"], {
    message: "Please select a role",
  }),
});

type SignupForm = z.infer<typeof signupSchema>;

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [selectedRole, setSelectedRole] = useState<"patient" | "doctor" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    try {
      setError(null);
      await signup(data.name, data.email, data.password, data.role);
      navigate(`/${data.role}/dashboard`);
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.");
    }
  };

  const selectRole = (role: "patient" | "doctor") => {
    setSelectedRole(role);
    setValue("role", role);
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-white mb-6">Create Account</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Full Name
          </label>
          <input
            {...register("name")}
            type="text"
            placeholder="John Doe"
            className="input-field w-full"
          />
          {errors.name && (
            <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>
          )}
        </div>

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

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            I am a
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => selectRole("patient")}
              className={`text-sm py-2 px-4 rounded-lg border transition-colors ${
                selectedRole === "patient"
                  ? "bg-brand-600 border-brand-600 text-white"
                  : "bg-surface-overlay border-surface-border text-gray-200 hover:bg-surface-border"
              }`}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => selectRole("doctor")}
              className={`text-sm py-2 px-4 rounded-lg border transition-colors ${
                selectedRole === "doctor"
                  ? "bg-brand-600 border-brand-600 text-white"
                  : "bg-surface-overlay border-surface-border text-gray-200 hover:bg-surface-border"
              }`}
            >
              Doctor
            </button>
          </div>
          {errors.role && (
            <p className="text-xs text-red-400 mt-1">{errors.role.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <p className="text-sm text-gray-500 text-center mt-4">
        Already have an account?{" "}
        <Link to="/login" className="text-brand-400 hover:text-brand-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
