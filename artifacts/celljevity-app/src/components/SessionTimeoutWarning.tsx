import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button } from "@/components/ui";
import { getCurrentUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const TIMEOUT_MINUTES = 30;
const WARNING_MINUTES = 2;
const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;
const WARNING_MS = WARNING_MINUTES * 60 * 1000;

export function SessionTimeoutWarning() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);

  const handleInactivityLogout = useCallback(() => {
    toast({
      title: t("session.loggedOutMessage"),
      variant: "destructive",
    });
    logout();
  }, [logout, toast, t]);

  const resetTimers = useCallback(() => {
    if (!user) return;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    
    setShowWarning(false);

    warningRef.current = setTimeout(() => {
      setShowWarning(true);
    }, TIMEOUT_MS - WARNING_MS);

    timeoutRef.current = setTimeout(() => {
      handleInactivityLogout();
    }, TIMEOUT_MS);
  }, [user, handleInactivityLogout]);

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
      await getCurrentUser();
      resetTimers();
    } catch {
      logout();
    }
  };

  if (!user || !showWarning) return null;

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">{t("session.timeoutTitle")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {t("session.timeoutMessage", { minutes: WARNING_MINUTES })}
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => handleInactivityLogout()}>{t("auth.signOut")}</Button>
          <Button onClick={handleStayLoggedIn}>{t("session.stayLoggedIn")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
