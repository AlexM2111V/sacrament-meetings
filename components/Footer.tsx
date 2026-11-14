import { WARD_NAME } from "@/lib/meetings-db";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border print:hidden">
      <div className="mx-auto w-full max-w-page px-gutter py-6 text-center text-sm text-muted">
        {WARD_NAME} · Sacrament Meeting Programs
      </div>
    </footer>
  );
}
