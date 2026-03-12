import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { Button, Input, Label, Card, CardContent } from "@/components/ui";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const { login, isLoggingIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      await login({ email, password });
    } catch {
      setErrorMsg(t("auth.invalidCredentials"));
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
      <img 
        src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
        alt="Background" 
        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
      />
      
      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 mb-6 shadow-2xl">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-10 h-10 rounded-lg" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">{t("auth.brandTitle")}</h1>
            <p className="text-slate-300">{t("auth.brandSubtitle")}</p>
          </div>

          <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                    {errorMsg}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label className="text-slate-200">{t("auth.email")}</Label>
                  <Input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-accent"
                    placeholder={t("auth.emailPlaceholder")}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-200">{t("auth.password")}</Label>
                    <Link to="/forgot-password">
                      <span className="text-sm text-accent hover:text-accent-foreground cursor-pointer transition-colors">{t("auth.forgotPassword")}</span>
                    </Link>
                  </div>
                  <Input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    className="bg-white/5 border-white/10 text-white focus-visible:ring-accent"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-6 text-lg rounded-xl shadow-lg shadow-accent/25"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <Activity className="w-5 h-5 animate-pulse" />
                  ) : (
                    t("auth.signIn")
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center mt-8 text-slate-400">
            {t("auth.noAccount")}{" "}
            <Link to="/register">
              <span className="text-accent hover:text-white font-medium cursor-pointer transition-colors">{t("auth.createOne")}</span>
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
