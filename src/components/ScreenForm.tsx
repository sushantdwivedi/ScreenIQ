// "use client";

// import { useState, useRef, useCallback, useEffect } from "react";
// import { getEngine, screenCandidate } from "@/lib/webllm";
// import { MLCEngineInterface } from "@mlc-ai/web-llm";
// import { ScoreDisplay } from "./ScoreDisplay";

// type Phase = "idle" | "loading-model" | "ready" | "screening" | "done" | "error";

// // Rough token estimate for 3B model on mid-range GPU: ~15 tok/s, ~150 tokens output
// const EST_SECONDS = 18;

// export function ScreenForm() {
//   const [jobDesc, setJobDesc] = useState(() =>
//     typeof window !== "undefined" ? sessionStorage.getItem("sq_jobDesc") ?? "" : ""
//   );
//   const [resume, setResume] = useState(() =>
//     typeof window !== "undefined" ? sessionStorage.getItem("sq_resume") ?? "" : ""
//   );
//   const [candidateName, setCandidateName] = useState(() =>
//     typeof window !== "undefined" ? sessionStorage.getItem("sq_name") ?? "" : ""
//   );
//   const [jobTitle, setJobTitle] = useState(() =>
//     typeof window !== "undefined" ? sessionStorage.getItem("sq_title") ?? "" : ""
//   );
// const [saveResume, setSaveResume] = useState(false);
//   const [phase, setPhase] = useState<Phase>("idle");
//   const [modelProgress, setModelProgress] = useState(0);
//   const [modelStatus, setModelStatus] = useState("");
//   const [streamOutput, setStreamOutput] = useState("");
//   const [result, setResult] = useState<{ score: number | null; reasons: string[] } | null>(null);
//   const [error, setError] = useState("");

//   // Screening timer
//   const [elapsed, setElapsed] = useState(0);
//   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
//   const screeningStartRef = useRef<number>(0);

//   const engineRef = useRef<MLCEngineInterface | null>(null);

//   // Persist helpers
//   const update = (setter: (v: string) => void, key: string) => (v: string) => {
//     setter(v);
//     sessionStorage.setItem(key, v);
//   };

//   // START MODEL LOAD AS SOON AS PAGE MOUNTS — user fills form while it loads
//   useEffect(() => {
//     if (engineRef.current) return;
//     setPhase("loading-model");
//     getEngine((pct, text) => {
//       setModelProgress(pct);
//       setModelStatus(text);
//     })
//       .then((eng) => {
//         engineRef.current = eng;
//         setPhase("ready");
//       })
//       .catch(() => {
//         setError("WebGPU not available. Use Chrome or Edge 113+.");
//         setPhase("error");
//       });
//   }, []);

//   // Timer for screening phase
//   useEffect(() => {
//     if (phase === "screening") {
//       screeningStartRef.current = Date.now();
//       setElapsed(0);
//       timerRef.current = setInterval(() => {
//         setElapsed(Math.floor((Date.now() - screeningStartRef.current) / 1000));
//       }, 500);
//     } else {
//       if (timerRef.current) clearInterval(timerRef.current);
//     }
//     return () => { if (timerRef.current) clearInterval(timerRef.current); };
//   }, [phase]);

//   const handleSubmit = useCallback(async () => {
//     if (!jobDesc.trim() || !resume.trim()) {
//       setError("Please fill in both the job description and resume.");
//       return;
//     }
//     if (!engineRef.current) {
//       setError("Model is still loading, please wait.");
//       return;
//     }
//     setError("");
//     setResult(null);
//     setStreamOutput("");
//     setPhase("screening");

//     try {
//       const screening = await screenCandidate(
//         engineRef.current,
//         jobDesc,
//         resume,
//         (chunk) => setStreamOutput(chunk)
//       );
//       setResult(screening);
//       setPhase("done");

//       if (screening.score !== null && candidateName.trim()) {
//         await fetch("/api/screenings", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             candidateName: candidateName.trim(),
//             jobTitle: jobTitle.trim() || "Unspecified",
//             aiScore: screening.score,
//             reasons: screening.reasons,
//               resumeText: saveResume ? resume.trim() : null, 
//           }),
//         });
//       }
//     } catch (e) {
//       console.error(e);
//       setError(e instanceof Error ? e.message : "Screening failed. Please try again.");
//       setPhase("ready");
//     }
//   }, [jobDesc, resume, candidateName, jobTitle]);

//   const inputStyle: React.CSSProperties = {
//     background: "white",
//     border: "1px solid var(--outline-variant)",
//     borderRadius: "4px",
//     padding: "10px 12px",
//     fontSize: "14px",
//     color: "var(--on-surface)",
//     fontFamily: "var(--font-sans)",
//     width: "100%",
//     boxSizing: "border-box",
//   };

//   const labelStyle: React.CSSProperties = {
//     fontSize: "12px",
//     fontWeight: 700,
//     letterSpacing: "0.08em",
//     textTransform: "uppercase",
//     color: "var(--on-surface-variant)",
//     display: "block",
//     marginBottom: "6px",
//   };

//   const remaining = Math.max(0, EST_SECONDS - elapsed);
//   const screeningPct = Math.min(95, Math.round((elapsed / EST_SECONDS) * 100));

//   return (
//     <div>
//       {/* ── Model loading banner (shown while user fills form) ── */}
//       {phase === "loading-model" && (
//         <div style={{
//           background: "var(--surface-container-low)",
//           border: "1px solid var(--outline-variant)",
//           borderRadius: "4px",
//           padding: "12px 16px",
//           marginBottom: "20px",
//         }}>
//           <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
//             <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--on-surface)" }}>
//               Loading AI model in background…
//             </span>
//             <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--on-surface-variant)" }}>
//               {modelProgress}%
//             </span>
//           </div>
//           <div style={{ height: "3px", background: "var(--outline-variant)", borderRadius: "2px", overflow: "hidden" }}>
//             <div style={{
//               height: "100%",
//               width: `${modelProgress}%`,
//               background: "var(--secondary)",
//               transition: "width 0.4s ease",
//             }} />
//           </div>
//           <p style={{ fontSize: "12px", color: "var(--on-surface-variant)", marginTop: "6px" }}>
//             {modelStatus || "Downloading Llama-3.2-3B — cached after first load, fill the form while you wait"}
//           </p>
//         </div>
//       )}

//       {phase === "ready" && (
//         <div style={{
//           display: "flex", alignItems: "center", gap: "8px",
//           padding: "8px 12px", marginBottom: "20px", borderRadius: "4px",
//           background: "#e8f5e9", border: "1px solid #a5d6a7",
//         }}>
//           <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2e7d32", display: "inline-block" }} />
//           <span style={{ fontSize: "13px", color: "#1b5e20", fontWeight: 500 }}>
//             AI model ready — screening takes ~{EST_SECONDS}s
//           </span>
//         </div>
//       )}

//       {/* ── Error ── */}
//       {error && (
//         <div style={{
//           marginBottom: "16px", padding: "10px 14px", borderRadius: "4px",
//           background: "#ffdad6", color: "#93000a", border: "1px solid #ba1a1a",
//           fontSize: "13px",
//         }}>
//           {error}
//         </div>
//       )}

//       {/* ── Screening progress overlay ── */}
//       {phase === "screening" && (
//         <div style={{
//           background: "var(--surface-container-low)",
//           border: "1px solid var(--outline-variant)",
//           borderRadius: "6px",
//           padding: "20px",
//           marginBottom: "24px",
//         }}>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
//             <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--on-surface)" }}>
//               Screening in progress
//             </span>
//             <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--on-surface-variant)" }}>
//               {elapsed}s elapsed · ~{remaining}s left
//             </span>
//           </div>
//           {/* Progress bar */}
//           <div style={{ height: "4px", background: "var(--outline-variant)", borderRadius: "2px", overflow: "hidden", marginBottom: "12px" }}>
//             <div style={{
//               height: "100%",
//               width: `${screeningPct}%`,
//               background: "var(--primary)",
//               transition: "width 0.5s ease",
//             }} />
//           </div>
//           {/* What's happening */}
//           <p style={{ fontSize: "12px", color: "var(--on-surface-variant)", marginBottom: "8px" }}>
//             {elapsed < 3 && "Sending prompt to local model…"}
//             {elapsed >= 3 && elapsed < 8 && "Model is reading the job description…"}
//             {elapsed >= 8 && elapsed < 14 && "Evaluating resume against requirements…"}
//             {elapsed >= 14 && "Generating score and reasons…"}
//           </p>
//           {/* Live token stream */}
//           {streamOutput && (
//             <pre style={{
//               fontFamily: "var(--font-mono)",
//               fontSize: "11px",
//               color: "var(--on-surface-variant)",
//               background: "var(--surface-container)",
//               borderRadius: "3px",
//               padding: "8px 10px",
//               maxHeight: "80px",
//               overflow: "hidden",
//               margin: 0,
//               whiteSpace: "pre-wrap",
//               wordBreak: "break-all",
//             }}>
//               {streamOutput}
//             </pre>
//           )}
//         </div>
//       )}

//       {/* ── Form fields ── */}
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
//         <div>
//           <label style={labelStyle}>Candidate Name</label>
//           <input type="text" value={candidateName}
//             onChange={(e) => update(setCandidateName, "sq_name")(e.target.value)}
//             placeholder="Jane Smith" style={inputStyle} />
//         </div>
//         <div>
//           <label style={labelStyle}>Job Title</label>
//           <input type="text" value={jobTitle}
//             onChange={(e) => update(setJobTitle, "sq_title")(e.target.value)}
//             placeholder="Senior Frontend Engineer" style={inputStyle} />
//         </div>
//       </div>

//       <div style={{ marginBottom: "16px" }}>
//         <label style={labelStyle}>Job Description</label>
//         <textarea value={jobDesc}
//           onChange={(e) => update(setJobDesc, "sq_jobDesc")(e.target.value)}
//           placeholder="Paste the full job description here…"
//           rows={8} style={{ ...inputStyle, resize: "vertical" }} />
//       </div>

//       <div style={{ marginBottom: "24px" }}>
//         <label style={labelStyle}>Candidate Resume</label>
//         <textarea value={resume}
//           onChange={(e) => update(setResume, "sq_resume")(e.target.value)}
//           placeholder="Paste the candidate's resume text here…"
//           rows={10} style={{ ...inputStyle, resize: "vertical" }} />
//         <p style={{ fontSize: "11px", color: "var(--on-surface-variant)", marginTop: "4px" }}>
//           Resume never leaves your browser — all AI runs locally.
//         </p>
//       </div>

// <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", cursor: "pointer" }}>
//   <input
//     type="checkbox"
//     checked={saveResume}
//     onChange={(e) => setSaveResume(e.target.checked)}
//     style={{ width: "16px", height: "16px", accentColor: "var(--primary)", cursor: "pointer" }}
//   />
//   <span style={{ fontSize: "13px", color: "var(--on-surface-variant)" }}>
//     Also save resume text to server (for HR records)
//   </span>
// </label>

//       {/* ── Submit ── */}
//       <button
//         onClick={handleSubmit}
//         disabled={phase === "loading-model" || phase === "screening"}
//         style={{
//           background: (phase === "loading-model" || phase === "screening")
//             ? "var(--outline-variant)" : "var(--primary)",
//           color: "white",
//           border: "none",
//           borderRadius: "4px",
//           padding: "10px 28px",
//           fontSize: "14px",
//           fontWeight: 600,
//           cursor: (phase === "loading-model" || phase === "screening") ? "not-allowed" : "pointer",
//           fontFamily: "var(--font-sans)",
//         }}
//       >
//         {phase === "loading-model" && `Model loading (${modelProgress}%)…`}
//         {phase === "screening" && "Screening…"}
//         {(phase === "idle" || phase === "ready" || phase === "done" || phase === "error") && "Screen Candidate"}
//       </button>

//       {/* ── Result ── */}
//       {phase === "done" && result && (
//         <ScoreDisplay
//           score={result.score}
//           reasons={result.reasons}
//           streaming={false}
//           rawOutput=""
//         />
//       )}
//     </div>
//   );
// }



"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getEngine, screenCandidate } from "@/lib/webllm";
import { MLCEngineInterface } from "@mlc-ai/web-llm";
import { ScoreDisplay } from "./ScoreDisplay";

type Phase = "idle" | "loading-model" | "ready" | "screening" | "done" | "error";

const EST_SECONDS = 18;

export function ScreenForm() {
  const [jobDesc, setJobDesc] = useState(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("sq_jobDesc") ?? "" : ""
  );
  const [resume, setResume] = useState(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("sq_resume") ?? "" : ""
  );
  const [candidateName, setCandidateName] = useState(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("sq_name") ?? "" : ""
  );
  const [jobTitle, setJobTitle] = useState(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("sq_title") ?? "" : ""
  );
  const [saveResume, setSaveResume] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [modelProgress, setModelProgress] = useState(0);
  const [modelStatus, setModelStatus] = useState("");
  const [streamOutput, setStreamOutput] = useState("");
  const [result, setResult] = useState<{ score: number | null; reasons: string[] } | null>(null);
  const [error, setError] = useState("");

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screeningStartRef = useRef<number>(0);

  const engineRef = useRef<MLCEngineInterface | null>(null);

  const update = (setter: (v: string) => void, key: string) => (v: string) => {
    setter(v);
    sessionStorage.setItem(key, v);
  };

  useEffect(() => {
    if (engineRef.current) return;
    setPhase("loading-model");
    getEngine((pct, text) => {
      setModelProgress(pct);
      setModelStatus(text);
    })
      .then((eng) => {
        engineRef.current = eng;
        setPhase("ready");
      })
      .catch(() => {
        setError("WebGPU not available. Use Chrome or Edge 113+.");
        setPhase("error");
      });
  }, []);

  useEffect(() => {
    if (phase === "screening") {
      screeningStartRef.current = Date.now();
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - screeningStartRef.current) / 1000));
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const handleSubmit = useCallback(async () => {
    if (!jobDesc.trim() || !resume.trim()) {
      setError("Please fill in both the job description and resume.");
      return;
    }
    if (!engineRef.current) {
      setError("Model is still loading, please wait.");
      return;
    }
    setError("");
    setResult(null);
    setStreamOutput("");
    setPhase("screening");

    try {
      const screening = await screenCandidate(
        engineRef.current,
        jobDesc,
        resume,
        (chunk) => setStreamOutput(chunk)
      );
      setResult(screening);
      setPhase("done");

      if (screening.score !== null && candidateName.trim()) {
        await fetch("/api/screenings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateName: candidateName.trim(),
            jobTitle: jobTitle.trim() || "Unspecified",
            aiScore: screening.score,
            reasons: screening.reasons,
            resumeText: saveResume ? resume.trim() : null,
          }),
        });
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Screening failed. Please try again.");
      setPhase("ready");
    }
  }, [jobDesc, resume, candidateName, jobTitle, saveResume]);

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "var(--on-surface-variant)",
    display: "block",
    marginBottom: "8px",
  };

  const remaining = Math.max(0, EST_SECONDS - elapsed);
  const screeningPct = Math.min(95, Math.round((elapsed / EST_SECONDS) * 100));

  return (
    <div className="space-y-6">
      {/* ── Model loading banner ── */}
      {phase === "loading-model" && (
        <div
          className="rounded-lg p-4 transition-all duration-300"
          style={{
            background: "var(--surface-container-low)",
            border: "1px solid var(--outline-variant)",
          }}
        >
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-sm font-medium tracking-tight" style={{ color: "var(--on-surface)" }}>
              Initializing Core Local Engine
            </span>
            <span className="text-xs data-mono font-medium" style={{ color: "var(--secondary)" }}>
              {modelProgress}%
            </span>
          </div>
          <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "var(--surface-container)" }}>
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${modelProgress}%`,
                background: "var(--secondary)",
              }}
            />
          </div>
          <p className="text-xs mt-2.5" style={{ color: "var(--on-surface-variant)", lineHeight: "1.4" }}>
            {modelStatus || "Downloading Llama-3.2-3B weights directly to browser storage..."}
          </p>
        </div>
      )}

      {/* ── Engine Ready Status ── */}
      {phase === "ready" && (
        <div
          className="flex items-center gap-3 p-3.5 rounded-lg border text-sm transition-all animate-fade-in"
          style={{
            background: "rgba(0, 107, 88, 0.04)",
            borderColor: "rgba(0, 107, 88, 0.2)",
            color: "var(--secondary)"
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "var(--secondary)" }}></span>
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--secondary)" }}></span>
          </span>
          <span className="font-medium tracking-tight">
            Local compute active · Ready for secure processing (~{EST_SECONDS}s check)
          </span>
        </div>
      )}

      {/* ── Error Notification ── */}
      {error && (
        <div
          className="p-3.5 rounded-lg border text-sm font-medium tracking-tight flex items-start gap-2.5"
          style={{
            background: "rgba(186, 26, 26, 0.04)",
            color: "var(--error)",
            borderColor: "rgba(186, 26, 26, 0.2)"
          }}
        >
          <span>✕</span>
          <div>{error}</div>
        </div>
      )}

      {/* ── Screening progress overlay ── */}
      {phase === "screening" && (
        <div
          className="rounded-lg p-5 border shadow-sm"
          style={{
            background: "var(--surface-container-low)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <div className="flex justify-between items-baseline mb-3">
            <span className="text-sm font-medium tracking-tight" style={{ color: "var(--on-surface)" }}>
              Analyzing Candidate Fit
            </span>
            <span className="data-mono text-xs" style={{ color: "var(--on-surface-variant)" }}>
              {elapsed}s elapsed · ~{remaining}s remaining
            </span>
          </div>

          <div className="h-1 w-full rounded-full overflow-hidden mb-3" style={{ background: "var(--surface-container)" }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${screeningPct}%`,
                background: "var(--primary)",
              }}
            />
          </div>

          <p className="text-xs mb-4 font-medium" style={{ color: "var(--outline)" }}>
            {elapsed < 3 && "Warming up secure WebGPU partition…"}
            {elapsed >= 3 && elapsed < 8 && "Parsing key structural criteria from job specification…"}
            {elapsed >= 8 && elapsed < 14 && "Mapping candidate background against role parameters…"}
            {elapsed >= 14 && "Compiling alignment index and justification text…"}
          </p>

          {streamOutput && (
            <div className="relative rounded border" style={{ background: "var(--surface)", borderColor: "var(--outline-variant)" }}>
              <div className="absolute top-2 right-3 text-[9px] font-bold uppercase tracking-wider select-none" style={{ color: "var(--outline)" }}>
                Live Sandbox Output
              </div>
              <pre className="data-mono text-[11px] p-3.5 max-height-[110px] overflow-y-auto block leading-relaxed" style={{ color: "var(--on-surface-variant)", whiteSpace: "pre-wrap" }}>
                {streamOutput}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ── Form fields ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label style={labelStyle}>Candidate Name</label>
          <input
            type="text"
            value={candidateName}
            onChange={(e) => update(setCandidateName, "sq_name")(e.target.value)}
            placeholder="e.g., Jane Smith"
            className="w-full text-sm px-3.5 py-2.5 rounded border outline-none transition-all focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
            style={{
              background: "var(--surface)",
              borderColor: "var(--outline-variant)",
              color: "var(--on-surface)"
            }}
          />
        </div>
        <div>
          <label style={labelStyle}>Job Title</label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => update(setJobTitle, "sq_title")(e.target.value)}
            placeholder="e.g., Senior Frontend Engineer"
            className="w-full text-sm px-3.5 py-2.5 rounded border outline-none transition-all focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
            style={{
              background: "var(--surface)",
              borderColor: "var(--outline-variant)",
              color: "var(--on-surface)"
            }}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Job Description</label>
        <textarea
          value={jobDesc}
          onChange={(e) => update(setJobDesc, "sq_jobDesc")(e.target.value)}
          placeholder="Paste organizational responsibilities and structural requirements…"
          rows={6}
          className="w-full text-sm px-3.5 py-2.5 rounded border outline-none transition-all focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] resize-y font-normal"
          style={{
            background: "var(--surface)",
            borderColor: "var(--outline-variant)",
            color: "var(--on-surface)",
            lineHeight: "1.5"
          }}
        />
      </div>

      <div>
        <label style={labelStyle}>Candidate Resume</label>
        <textarea
          value={resume}
          onChange={(e) => update(setResume, "sq_resume")(e.target.value)}
          placeholder="Paste verified background, qualifications, and performance history details…"
          rows={8}
          className="w-full text-sm px-3.5 py-2.5 rounded border outline-none transition-all focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] resize-y font-normal"
          style={{
            background: "var(--surface)",
            borderColor: "var(--outline-variant)",
            color: "var(--on-surface)",
            lineHeight: "1.5"
          }}
        />
        <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: "var(--outline)" }}>
          <span className="text-[14px]">🛡️</span>
          <span>Zero-Knowledge Processing: Analysis executes securely in isolated sandbox runtime memory.</span>
        </div>
      </div>

      {/* ── Record Retention Toggle ── */}
      <div className="pt-1">
        <label className="inline-flex items-center gap-3 cursor-pointer group select-none">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={saveResume}
              onChange={(e) => setSaveResume(e.target.checked)}
              className="peer sr-only"
            />
            <div
              className="w-4 h-4 rounded border transition-all peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] flex items-center justify-center"
              style={{ borderColor: "var(--outline-variant)", background: "var(--surface)" }}
            >
              <input
                type="checkbox"
                checked={saveResume}
                onChange={(e) => setSaveResume(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "var(--primary)", cursor: "pointer" }}
              />

            </div>
          </div>
          <span className="text-xs font-medium transition-colors group-hover:text-[var(--on-surface)]" style={{ color: "var(--on-surface-variant)" }}>
            Also save resume text to server (for HR records)
          </span>
        </label>
      </div>

      <hr style={{ borderColor: "var(--outline-variant)" }} className="my-2" />

      {/* ── Submit Action ── */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSubmit}
          disabled={phase === "loading-model" || phase === "screening"}
          className="w-full sm:w-auto text-sm px-7 py-2.5 font-medium rounded tracking-tight transition-all active:scale-[0.99]"
          style={{
            background: (phase === "loading-model" || phase === "screening")
              ? "var(--surface-container-low)"
              : "var(--primary)",
            color: (phase === "loading-model" || phase === "screening")
              ? "var(--outline)"
              : "var(--on-primary)",
            border: (phase === "loading-model" || phase === "screening")
              ? "1px solid var(--outline-variant)"
              : "none",
            cursor: (phase === "loading-model" || phase === "screening") ? "not-allowed" : "pointer",
          }}
        >
          {phase === "loading-model" && `Engine Initializing (${modelProgress}%)`}
          {phase === "screening" && "Evaluating Profiles..."}
          {(phase === "idle" || phase === "ready" || phase === "done" || phase === "error") && "Execute Screening Matrix"}
        </button>
      </div>

      {/* ── Result ── */}
      {phase === "done" && result && (
        <div className="pt-4 border-t animate-fade-in" style={{ borderColor: "var(--outline-variant)" }}>
          <ScoreDisplay
            score={result.score}
            reasons={result.reasons}
            streaming={false}
            rawOutput=""
          />
        </div>
      )}
    </div>
  );
}