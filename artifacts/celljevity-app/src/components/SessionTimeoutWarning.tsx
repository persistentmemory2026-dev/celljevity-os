import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button } from "@/components/ui";
import { getCurrentUser } from "@workspace/api-client-react";

const TIMEOUT_MINUTES = 30;
const WARNING_MINUTES = 2;
const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;
const WARNING_MS = WARNING_MINUTES * 60 * 1000;

export function SessionTimeoutWarning() {
  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimers = useCallback(() => {
    if (!user) return;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    
    setShowWarning(false);

    // Set warning timer
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
    }, TIMEOUT_MS - WARNING_MS);

    // Set auto-logout timer
    timeoutRef.current = setTimeout(() => {
      logout();
    }, TIMEOUT_MS);
  }, [user, logout]);

  useEffect(() => {
    if (user) {
      resetTimers();
      
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      const handleActivity = () => {
        if (!showWarning) {
          resetTimers();
        }
      };

      events.forEach(event => window.addEventListener(event, handleActivity));
      
      return () => {
        events.forEach(event => window.removeEventListener(event, handleActivity));
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningRef.current) clearTimeout(warningRef.current);
      };
    }
  }, [user, resetTimers, showWarning]);

  const handleStayLoggedIn = async () => {
    try {
      // Hit the API to refresh cookie/session
      await getCurrentUser();
      resetTimers();
    } catch (e) {
      logout();
    }
  };

  if (!user || !showWarning) return null;

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Session Expiring Soon</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          For your security, you will be automatically logged out in 2 minutes due to inactivity. Do you want to stay logged in?
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => logout()}>Log Out Now</Button>
          <Button onClick={handleStayLoggedIn}>Stay Logged In</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
