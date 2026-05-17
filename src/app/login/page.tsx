"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!pw.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        router.push("/screen");
        router.refresh();   // forces middleware re-check immediately
      } else {
        setError("Wrong password");
        setLoading(false);
      }
    } catch {
      setError("Network error, try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--surface)",
    }}>
      <div style={{
        background: "white", border: "1px solid var(--outline-variant)",
        borderRadius: "6px", padding: "40px", width: "320px",
      }}>
        <h1 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px", color: "var(--on-surface)" }}>
          ScreenIQ
        </h1>
        <p style={{ fontSize: "13px", color: "var(--on-surface-variant)", marginBottom: "24px" }}>
          Enter your access password
        </p>

        {/* Password input with show/hide */}
        <div style={{ position: "relative", marginBottom: "12px" }}>
          <input
            type={showPw ? "text" : "password"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleLogin()}
            placeholder="Password"
            disabled={loading}
            style={{
              width: "100%", padding: "10px 40px 10px 12px",
              border: "1px solid var(--outline-variant)", borderRadius: "4px",
              fontSize: "14px", boxSizing: "border-box",
              opacity: loading ? 0.6 : 1,
            }}
          />
          <button
            onClick={() => setShowPw((v) => !v)}
            style={{
              position: "absolute", right: "10px", top: "50%",
              transform: "translateY(-50%)", background: "none",
              border: "none", cursor: "pointer", padding: "4px",
              fontSize: "13px", color: "var(--on-surface-variant)",
            }}
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>

        {error && (
          <p style={{ color: "var(--error)", fontSize: "13px", marginBottom: "10px" }}>
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading || !pw.trim()}
          style={{
            width: "100%", padding: "10px",
            background: loading ? "var(--outline-variant)" : "var(--primary)",
            color: "white", border: "none", borderRadius: "4px",
            fontSize: "14px", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}
        >
          {loading && (
            <span style={{
              width: "14px", height: "14px", border: "2px solid white",
              borderTopColor: "transparent", borderRadius: "50%",
              display: "inline-block", animation: "spin 0.7s linear infinite",
            }} />
          )}
          {loading ? "Signing in…" : "Enter"}
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}