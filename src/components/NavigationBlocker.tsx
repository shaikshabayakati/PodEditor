import { useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NavigationBlockerProps {
  shouldBlock: boolean;
}

export function NavigationBlocker({ shouldBlock }: NavigationBlockerProps) {
  const [showDialog, setShowDialog] = useState(false);

  // Handle browser-level navigation (refresh, close tab, etc.)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldBlock) {
        e.preventDefault();
        // Standard modern browser way to trigger the native confirmation
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [shouldBlock]);

  // Handle internal React Router navigation
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      shouldBlock && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowDialog(true);
    }
  }, [blocker.state]);

  const handleConfirm = () => {
    setShowDialog(false);
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  };

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to leave the workspace? Any unsaved changes might be lost. Make sure to export your project if you want to keep your progress.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Stay</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Leave</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
