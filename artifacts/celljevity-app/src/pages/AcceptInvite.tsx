import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { User } from "../App";

interface AcceptInviteProps {
  token: string;
  onAccepted: (user: User) => void;
}

export function AcceptInvite({ token, onAccepted }: AcceptInviteProps) {
  const validation = useQuery(api.invites.validateInvite, { token });
  const acceptInvite = useMutation(api.invites.acceptInvite);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (validation === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(140,36,59,0.1),rgba(255,255,255,0))]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!validation.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(140,36,59,0.1),rgba(255,255,255,0))]">
        <Card className="p-8 w-full max-w-md shadow-2xl border-border/50 bg-card/80 backdrop-blur-xl text-center">
          <div className="mb-6">
            <h1 className="text-4xl font-display font-bold text-foreground mb-2">Celljevity</h1>
            <p className="text-muted-foreground font-medium">Longevity OS</p>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-3">Invalid or Expired Invite</h2>
          <p className="text-muted-foreground mb-4">
            This invite link is no longer valid. It may have expired or already been used.
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your care team for a new invite.
          </p>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const result = await acceptInvite({ token, password });
      localStorage.setItem("userId", result.userId);
      onAccepted({
        _id: result.userId,
        email: result.email,
        name: result.name,
        role: result.role,
        linkedPatientId: result.linkedPatientId,
      });
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(140,36,59,0.1),rgba(255,255,255,0))]">
      <Card className="p-8 w-full max-w-md shadow-2xl border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">Celljevity</h1>
          <p className="text-muted-foreground font-medium">Longevity OS</p>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Welcome, {validation.patientName}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Set a password to access your health dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-foreground">Email</Label>
            <Input
              value={validation.email ?? ""}
              disabled
              className="w-full px-4 py-3 bg-secondary/50 border-border text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-secondary/50 border-border text-foreground focus:ring-primary"
              placeholder="Minimum 8 characters"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Confirm Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-secondary/50 border-border text-foreground focus:ring-primary"
              placeholder="Re-enter password"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full py-6 text-lg bg-primary text-primary-foreground hover:brightness-110 shadow-lg transition-all"
          >
            {submitting ? "Setting up..." : "Set Password & Sign In"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
