# Assignment Solutions

---

## Part A — Backend

### A-1: Bugs in the starter code

Eight issues identified and fixed. Full breakdown in README.md under "Bugs fixed". Summary:

| # | Bug | Impact |
|---|---|---|
| 1 | No auth on POST endpoint | Anyone can trigger AI calls and write to DB |
| 2 | `KeyError` on missing fields | Unhandled 500 instead of 400 |
| 3 | Deprecated `openai.ChatCompletion.create` | Crashes on openai>=1.0.0 |
| 4 | Prompt omits job description | Score has no reference point — meaningless |
| 5 | Score stored as raw LLM string | Breaks numeric comparisons downstream |
| 6 | No try/except around OpenAI call | Returns HTML error on API failure |
| 7 | Resume stored in DB | PII exposure on any breach |
| 8 | `ApplicationListView` returns all records | Any user sees all candidates |

---

### A-2: AI prompt design

The system prompt is the contract with the model. It needs to be specific enough that the output is consistent across runs, and strict enough that parsing doesn't require guesswork.

```
You are an expert HR screener. You MUST respond with ONLY a JSON object, 
no other text before or after it.

{"score": <number 1-10>, "reasons": ["<reason1>", "<reason2>", "<reason3>"]}

Scoring guide:
- 9-10: Exceptional match, exceeds all requirements
- 7-8: Strong match, meets most requirements
- 5-6: Partial match, meets some requirements
- 3-4: Weak match, missing key requirements
- 1-2: Poor match, significant gaps

Be specific. Reference actual details from both the resume and job description.
```

Three things this does deliberately:

**Temperature 0.1** — consistency over creativity. A score of 7.2 should mean the same thing run-to-run.

**JSON-only output** — no preamble, no markdown fences. The parser looks for `{"score":...}` and fails gracefully if it doesn't find it.

**Explicit scoring rubric in the prompt** — without it, different models (and different runs of the same model) calibrate their own scale. A 7 from one run shouldn't mean "exceptional" and a 7 from the next mean "borderline".

---

### A-3: Security fix

Two issues in the provided security code:

**Model stores resume text**
```python
# before
resume = models.TextField()

# after — field removed entirely
# the resume is processed in the browser and discarded
# only score and reasons are sent to the server
```

**List view returns all records**
```python
# before
apps = Application.objects.all()

# after
apps = Application.objects.filter(created_by=request.user)
```

In this implementation, the security fix goes further than filtering by user — resume text is never sent to the server at all. Inference runs in the browser. The API receives only `{ candidateName, jobTitle, aiScore, reasons[] }`. There's nothing to leak.

---

## Part B — Frontend

### B-1: /screen

`ScreenForm.tsx` — client component managing:
- Two textareas (job description, resume)
- Two text inputs (candidate name, job title)
- WebLLM engine lifecycle (load on mount, screen on submit)
- Phase state: `idle → loading-model → ready → screening → done`
- `sessionStorage` persistence so form data survives HMR reloads in dev

The model starts loading when the page mounts — not when the user hits submit. On a typical connection the 2GB model downloads in 60–90 seconds. A recruiter filling out a form takes longer than that.

---

### B-2: /dashboard

`DashboardTable.tsx` — handles 500+ rows via client-side pagination (50 rows/page). Row expansion shows AI reasons and optionally the saved resume if the user opted in.

Score color coding:
- `≥ 7.5` — green / Strong
- `5–7.4` — amber / Review  
- `< 5` — red / Weak

`/dashboard` is a server component. It fetches from Neon at request time (`force-dynamic`), passes data down to the client table component. No client-side fetch, no loading state on the dashboard itself.

---

### B-3: Edge case score parsing

`parseScore()` in `src/lib/utils.ts` handles every format the model might return:

```typescript
parseScore("7")           // → 7
parseScore("7.3")         // → 7.3
parseScore("Seven")       // → 7
parseScore("Score: 8/10") // → 8
parseScore("excellent")   // → null
parseScore(null)          // → null
```

Order of operations:
1. Direct word lookup (`"seven"` → `7`)
2. Regex extract first decimal or integer from string
3. Range check — anything outside 0–10 returns null
4. Caller handles null (shows retry message)

---

## Part C — AI Integration

### C-1: Streaming

Streaming is implemented via WebLLM's OpenAI-compatible streaming API:

```typescript
const stream = await engine.chat.completions.create({
  messages: [...],
  stream: true,
  temperature: 0.1,
  max_tokens: 300,
});

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content ?? "";
  fullText += delta;
  onChunk(fullText);   // fires setState in ScreenForm — UI updates per token
}
```

Each token fires `onChunk` which calls `setStreamOutput` in `ScreenForm`. The raw JSON builds up character by character in a monospace preview box. When the stream ends, the complete text is parsed.

No SSE, no WebSockets, no Django Channels needed — the model runs in-browser, so "streaming" is just an async iterator over local GPU output.

---

### C-2: Bias detection and reduction

AI screening tools fail quietly. A model trained on historical hiring data encodes historical hiring biases — if a company historically hired from three universities, the model learns to prefer resumes from those universities. The score looks objective. It isn't.

**Where bias enters**

The most common vectors are prompt framing and training data distribution. A prompt that asks "is this a strong candidate?" without defining criteria forces the model to infer what "strong" looks like from its training data. That inference reflects whoever wrote the data, not the job requirements.

Language style is a second vector. Models trained predominantly on formal American English prose score resumes written in British English or by non-native speakers lower — not because the qualifications are weaker, but because the writing pattern deviates from what was rewarded during training.

**Detection**

Statistical detection requires logging outcomes by demographic group (where voluntarily disclosed and legally permissible) and running differential score analysis across equivalent qualification sets. A consistent gap of more than 0.5 points for identical experience warrants investigation.

Red-teaming is faster: construct identical resumes differing only in name, institution, or pronoun. A gap above 1 point is detectable bias. Run this quarterly as the model or prompt changes.

**Reduction in this implementation**

The system prompt defines scoring criteria explicitly — skills match, experience match, requirement gaps — and instructs the model to reference specific details from the JD and resume. This reduces the model's latitude to fill scoring gaps with inferred demographic signals.

More importantly: ScreenIQ displays the score alongside three written reasons, and there is no automated reject-on-score feature. A human reviews the reasoning before any decision is made. The AI is advisory. That single design choice is the most effective bias mitigation available — not because it fixes the model, but because it keeps a human in the loop.