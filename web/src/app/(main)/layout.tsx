import type { ReactNode } from "react";

import { AuthGate } from "@/components/auth/auth-gate";
import { MobileShell } from "@/components/layout/mobile-shell";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <MobileShell>{children}</MobileShell>
    </AuthGate>
  );
}
