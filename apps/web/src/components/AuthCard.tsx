import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { GlassCard } from "./ui";

type AuthForm = {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
};

export function AuthCard({ initialMode = "login" }: { initialMode?: "login" | "register" }) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const setUser = useAppStore((state) => state.setUser);
  const { register, handleSubmit } = useForm<AuthForm>();

  const mutation = useMutation({
    mutationFn: async (values: AuthForm) => {
      const response =
        mode === "register"
          ? await api.register(values)
          : await api.login({ email: values.email, password: values.password });
      localStorage.setItem("choochoo-token", response.token);
      return response;
    },
    onSuccess: (response: { user: any }) => {
      setUser(response.user);
      toast.success(mode === "register" ? "Account created" : "Welcome back");
    },
    onError: (error: Error) => toast.error(error.message)
  });

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{mode === "register" ? "Create account" : "Login"}</h2>
        <button className="text-sm text-emerald-200" onClick={() => setMode(mode === "register" ? "login" : "register")}>
          {mode === "register" ? "Already have one?" : "Need an account?"}
        </button>
      </div>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        {mode === "register" ? (
          <>
            <input {...register("name", { required: true })} placeholder="Name" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" />
            <input {...register("phone")} placeholder="WhatsApp" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" />
            <input {...register("address")} placeholder="Default address" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" />
          </>
        ) : null}
        <input {...register("email", { required: true })} placeholder="Email" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" />
        <input {...register("password", { required: true })} placeholder="Password" type="password" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" />
        <button className="w-full rounded-2xl bg-emerald-300 px-4 py-3 font-semibold text-night">
          {mode === "register" ? "Create account" : "Sign in"}
        </button>
      </form>
    </GlassCard>
  );
}
