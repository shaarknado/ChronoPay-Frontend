"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react"; // Assuming lucide-react is used, else I'll check

interface ResumedBadgeProps {
  itemId: string;
}

export function ResumedBadge({ itemId }: ResumedBadgeProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="absolute top-0 right-0 -mt-2 -mr-2 z-10 flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-xs font-medium text-indigo-300 shadow-sm backdrop-blur-md animate-in fade-in zoom-in duration-300 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      <span>Resumed where you left off</span>
    </div>
  );
}
