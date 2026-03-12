import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Input, Label, Card, CardContent } from "@/components/ui";
import { motion } from "framer-motion";

export default function ResetPassword() {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  
  const token = new URLSearchParams(window.location.search).get("token") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setErrorMsg("Invalid or missing reset token");
    if (password !== confirmPassword) return setErrorMsg(t("auth.passwordsMismatch"));
    if (password.length < 8) return setErrorMsg("Password must be at least 8 characters");

    setStatus("loading");
    setErrorMsg("");
    
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reset password");
      }
      
      setStatus("success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setErrorMsg(message);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
      <img src={`${import.meta.env.BASE_URL}images/auth-bg.png`} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />
      
      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-white mb-2">{t("auth.newPassword")}</h1>
          </div>

          <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl">
            <CardContent className="p-8">
              {status === "success" ? (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-200">
                    {t("auth.resetSuccess")}
                  </div>
                  <Link to="/login">
                    <Button className="w-full bg-accent text-accent-foreground py-6 text-lg rounded-xl">{t("auth.signIn")}</Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {status === "error" && (
                    <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm">{errorMsg}</div>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-slate-200">{t("auth.newPassword")}</Label>
                    <Input 
                      type="password" required minLength={8}
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">{t("auth.confirmPassword")}</Label>
                    <Input 
                      type="password" required minLength={8}
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-6 text-lg rounded-xl" disabled={status === "loading"}>
                    {status === "loading" ? t("common.loading") : t("auth.resetPassword")}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
