import { ScreenForm } from "@/components/ScreenForm";

export default function ScreenPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:px-20">
      {/* Header Section */}
      <div className="mb-10 max-w-2xl">
        <h1
          className="text-4xl font-semibold tracking-tight mb-3"
          style={{ color: "var(--on-surface)" }}
        >
          Screen a Candidate
        </h1>
        <p 
          className="text-base leading-relaxed"
          style={{ color: "var(--on-surface-variant)", opacity: 0.85 }}
        >
          AI-powered screening runs locally in your browser. 
          <span className="block sm:inline md:ml-1 font-medium text-emerald-600 dark:text-emerald-400">
            No data leaves your device.
          </span>
        </p>
      </div>

      {/* Form Container */}
      <div
        className="rounded-2xl p-6 sm:p-10 transition-all duration-300"
        style={{
          background: "var(--surface, #ffffff)",
          border: "1px solid var(--outline-variant, #f0f0f0)",
          boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <ScreenForm />
      </div>
    </div>
  );
}