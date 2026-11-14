import type { ReactNode } from "react";

// Leader-facing pages. Authentication will be added here in Week 05.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent print:hidden">
        Leader Tools
      </p>
      {children}
    </div>
  );
}
