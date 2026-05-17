"use client";

import { CreateWebWorkerMLCEngine, MLCEngineInterface } from "@mlc-ai/web-llm";

export const MODEL_ID = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

let engineInstance: MLCEngineInterface | null = null;
let engineLoading: Promise<MLCEngineInterface> | null = null;

export async function getEngine(
  onProgress: (progress: number, text: string) => void
): Promise<MLCEngineInterface> {
  if (engineInstance) return engineInstance;
  // Prevent multiple simultaneous loads
  if (engineLoading) return engineLoading;

  engineLoading = (async () => {
    const worker = new Worker(
      new URL("../workers/llm.worker.ts", import.meta.url),
      { type: "module" }
    );
    engineInstance = await CreateWebWorkerMLCEngine(worker, MODEL_ID, {
      initProgressCallback: (report) => {
        onProgress(Math.round(report.progress * 100), report.text ?? "");
      },
    });
    return engineInstance;
  })();

  return engineLoading;
}

export async function screenCandidate(
  engine: MLCEngineInterface,
  jobDescription: string,
  resume: string,
  onChunk: (text: string) => void
): Promise<{ score: number | null; reasons: string[] }> {

  // FIX: Guard against empty/null strings — WebLLM bindings crash on non-strings
  const safeJob = (jobDescription ?? "").trim().slice(0, 3000);
  const safeResume = (resume ?? "").trim().slice(0, 3000);

  if (!safeJob || !safeResume) {
    throw new Error("Job description and resume must not be empty.");
  }

  const systemPrompt = `You are an expert HR screener. Evaluate how well a candidate's resume matches a job description.
You MUST respond with ONLY a JSON object, no other text before or after it.
Respond ONLY with valid JSON in this exact format (no other text):
{
  "score": <number from 1 to 10, one decimal place>,
  "reasons": [
    "<reason 1: specific strength or weakness>",
    "<reason 2: specific strength or weakness>",
    "<reason 3: specific strength or weakness>"
  ]
}

Scoring guide:
- 9-10: Exceptional match, exceeds all requirements
- 7-8: Strong match, meets most requirements  
- 5-6: Partial match, meets some requirements
- 3-4: Weak match, missing key requirements
- 1-2: Poor match, significant gaps

Be objective and specific. Reference actual details from the resume and job description.`;




  const userPrompt = `JOB DESCRIPTION:\n${safeJob}\n\nCANDIDATE RESUME:\n${safeResume}`;

  const stream = await engine.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    stream: true,
    temperature: 0.1,
    // response_format: { type: "json_object" },
    max_tokens: 300,
  });

  let fullText = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    fullText += delta;
    onChunk(fullText);
  }

  try {
    const parsed = JSON.parse(fullText);
    const { parseScore } = await import("./utils");
    return {
      score: parseScore(String(parsed.score ?? "")),
      reasons: Array.isArray(parsed.reasons)
        ? parsed.reasons.slice(0, 3).map(String)
        : ["Could not parse reasons."],
    };
  } catch {
    const { parseScore } = await import("./utils");
    const m = fullText.match(/"score"\s*:\s*(\d+(?:\.\d+)?)/);
    return {
      score: m ? parseScore(m[1]) : null,
      reasons: ["Could not parse structured output. Please retry."],
    };
  }
}