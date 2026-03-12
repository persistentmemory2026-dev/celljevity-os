import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button, Input, Label, Card, CardContent } from "@/components/ui";
import { motion } from "framer-motion";

export default function Register() {
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const { register, isRegistering } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setErrorMsg("Passwords do not match");
    }
    setErrorMsg("");
    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900 py-12">
      <img 
        src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
        alt="Background" 
        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
      />
      
      <div className="relative z-10 w-full max-w-lg px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-white mb-2">Create Account</h1>
            <p className="text-slate-300">Begin your longevity journey with Celljevity</p>
          </div>

          <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                    {errorMsg}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-200">First Name</Label>
                    <Input 
                      required 
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Last Name</Label>
                    <Input 
                      required 
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Email Address</Label>
                  <Input 
                    type="email" 
                    required 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-200">Password</Label>
                  <Input 
                    type="password" 
                    required 
                    minLength={8}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Confirm Password</Label>
                  <Input 
                    type="password" 
                    required 
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-6 text-lg rounded-xl mt-4"
                  disabled={isRegistering}
                >
                  {isRegistering ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center mt-8 text-slate-400">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-accent hover:text-white font-medium cursor-pointer">Sign in</span>
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
