"use client";

interface ModelLoaderProps {
  progress: number;      // 0–100
  statusText: string;
}

export function ModelLoader({ progress, statusText }: ModelLoaderProps) {
  return (
    <div
      className="rounded p-4 mb-6"
      style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
          Loading AI Model
        </span>
        <span
          className="text-sm data-mono"
          style={{ color: "var(--on-surface-variant)" }}
        >
          {progress}%
        </span>
      </div>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: "4px", background: "var(--outline-variant)" }}
      >
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: "var(--secondary)",
          }}
        />
      </div>
      <p className="text-xs mt-2" style={{ color: "var(--on-surface-variant)" }}>
        {statusText || "Downloading model weights — this only happens once."}
      </p>
    </div>
  );
}