"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground hover:opacity-90"
    >
      Print
    </button>
  );
}
