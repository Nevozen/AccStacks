"use client";

import { AlertCircle, AlertTriangle, Check, Info, X } from "lucide-react";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="light"
      className="workspace-toaster"
      position="bottom-right"
      mobileOffset={{ bottom: "max(12px, env(safe-area-inset-bottom))", left: 12, right: 12 }}
      closeButton
      icons={{
        success: <Check aria-hidden="true" />,
        error: <AlertCircle aria-hidden="true" />,
        warning: <AlertTriangle aria-hidden="true" />,
        info: <Info aria-hidden="true" />,
        close: <X aria-hidden="true" />,
      }}
      toastOptions={{
        closeButtonAriaLabel: "Dismiss notification",
      }}
    />
  );
}
