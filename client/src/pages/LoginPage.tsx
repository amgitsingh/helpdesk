import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Headphones } from "lucide-react";
import { authClient } from "../lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFields = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (isPending) return null;
  if (session) return <Navigate to="/" replace />;

  async function onSubmit(values: LoginFields) {
    setServerError(null);
    const { error } = await authClient.signIn.email(values);
    if (error) {
      setServerError(error.message ?? "Invalid email or password.");
      return;
    }
    navigate("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient background blobs */}
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.07] dark:opacity-[0.12]"
        style={{ background: "var(--color-primary)", filter: "blur(120px)" }}
        aria-hidden
      />
      <div
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.05] dark:opacity-[0.1]"
        style={{ background: "var(--color-primary)", filter: "blur(100px)" }}
        aria-hidden
      />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />

      <div className="relative w-full max-w-sm px-4">
        <Card className="shadow-xl dark:shadow-2xl">
          <CardHeader className="text-center pb-5">
            {/* Logo mark */}
            <div className="mx-auto mb-3 h-11 w-11 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <Headphones size={22} className="text-primary-foreground" strokeWidth={2.5} />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription>
              Sign in to your Helpdesk account
            </CardDescription>
          </CardHeader>

          <CardContent>
            {serverError && (
              <div
                data-testid="server-error-banner"
                className="mb-4 flex items-start justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                <span>{serverError}</span>
                <button
                  type="button"
                  onClick={() => setServerError(null)}
                  className="shrink-0 opacity-60 hover:opacity-100 transition-opacity leading-none mt-0.5"
                  aria-label="Dismiss"
                >
                  &#x2715;
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full mt-1">
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          AI-powered support, built for speed
        </p>
      </div>
    </div>
  );
}
