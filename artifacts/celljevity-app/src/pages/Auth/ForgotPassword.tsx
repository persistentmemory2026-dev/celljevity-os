import { useState } from "react";
import { Link } from "wouter";
import { Button, Input, Label, Card, CardContent } from "@/components/ui";
import { motion } from "framer-motion";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send reset link");
      }
      
      setStatus("success");
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
      <img src={`${import.meta.env.BASE_URL}images/auth-bg.png`} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />
      
      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-white mb-2">Reset Password</h1>
            <p className="text-slate-300">We'll send you a link to reset your password</p>
          </div>

          <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl">
            <CardContent className="p-8">
              {status === "success" ? (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-200">
                    If an account exists for {email}, a password reset link has been sent.
                  </div>
                  <Link href="/login">
                    <Button className="w-full bg-white/20 hover:bg-white/30 text-white">Return to Login</Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {status === "error" && (
                    <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm">{errorMsg}</div>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-slate-200">Email Address</Label>
                    <Input 
                      type="email" required 
                      value={email} onChange={e => setEmail(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-6 text-lg rounded-xl shadow-lg shadow-accent/25" disabled={status === "loading"}>
                    {status === "loading" ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <p className="text-center mt-8 text-slate-400">
            Remember your password? <Link href="/login"><span className="text-accent hover:text-white font-medium cursor-pointer transition-colors">Sign in</span></Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
