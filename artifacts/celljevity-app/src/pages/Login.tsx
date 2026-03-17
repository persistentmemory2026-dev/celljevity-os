import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await onLogin(email, password);
      if (!success) {
        toast({
          title: "Login Failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "Login Failed",
        description: err instanceof Error ? err.message : "Login failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,224,173,0.15),rgba(255,255,255,0))]">
      <Card className="p-8 w-full max-w-md shadow-2xl border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">Celljevity</h1>
          <p className="text-muted-foreground font-medium">Longevity OS</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-foreground">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-secondary/50 border-border text-foreground focus:ring-primary"
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-secondary/50 border-border text-foreground focus:ring-primary"
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 text-lg bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_20px_-5px_rgba(120,224,173,0.5)] transition-all"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
