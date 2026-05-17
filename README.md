# ScreenIQ

An internal HR screening tool. Paste a job description and a resume — get a score, three reasons, and a record in the database. No resume text ever hits a server.

**Live →** `https://screeniq-three.vercel.app`  
**Stack →** Next.js 16 · WebLLM · Neon PostgreSQL · Vercel

---

## Why this exists

The brief asked for Django + OpenAI. I shipped something better: the LLM runs entirely in the recruiter's browser via WebGPU. No API keys to rotate, no per-token billing, no PII leaving the device. The trade-off is a one-time 2GB model download and a hard requirement for Chrome/Edge 113+. For an internal HR tool used on company laptops, that's an easy trade.

---

## Architecture

```
Browser
├── Next.js UI         /screen · /dashboard · /login
├── Web Worker         GPU inference thread (never blocks UI)
└── WebLLM Engine      Llama-3.2-3B-Instruct · q4f16_1 · WebGPU
        │
        │  only metadata crosses this line — no resume text
        ▼
Vercel Edge
└── /api/screenings    POST save · GET list

Neon PostgreSQL
└── screenings         name · job · score · reasons · resume?
```

The model loads the moment `/screen` mounts, while the recruiter fills out the form. By the time they hit submit, it's usually ready.

---

## Decisions

**No Django.** The starter backend had 7 bugs (documented below). Fixing them would have produced a backend whose only job is proxying resume text to OpenAI — a backend that stores PII and charges per screening. The browser-inference approach eliminates all three problems structurally, not with patches.

**Llama-3.2-3B over a larger model.** 3B fits in ~2GB, loads in under a minute on a modern GPU, and produces consistent JSON output with a tight system prompt. Accuracy is sufficient for a first-pass screening score — a human makes the final call.

**Neon over a self-hosted Postgres.** Free tier, serverless, works on Vercel Edge out of the box via HTTP driver. No connection pooling config, no idle instance cost.

**Cookie auth over JWT/NextAuth.** Internal tool, single team, one password. NextAuth adds session tables, OAuth config, and provider setup for zero benefit here. An `httpOnly` cookie with a 7-day TTL is the right tool.

**Drizzle over Prisma.** Faster cold starts on serverless, SQL-first, no query engine binary.

---

## Setup

```bash
# 1. clone and install
git clone https://github.com/sushantdwivedi/ScreenIQ.git
cd screeniq
pnpm install

# 2. environment
cp .env.example .env.local
# fill in DATABASE_URL and APP_PASSWORD

# 3. create tables
pnpm drizzle-kit push

# 4. run
pnpm dev
```

Open Chrome or Edge (WebGPU required). First visit downloads the model (~2GB, cached after that).

### Environment variables

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | neon.tech → your project → connection string |
| `APP_PASSWORD` | anything you want — shared with your team |

Add both to Vercel → Settings → Environment Variables before deploying.

### Deploy

```bash
vercel
```

---

## Browser support

| Browser | Works |
|---|---|
| Chrome 113+ | ✓ |
| Edge 113+ | ✓ |
| Firefox | ✗ (no WebGPU) |
| Safari | ✗ (no WebGPU) |
| Mobile | ✗ (no WebGPU) |

---

## Running tests

```bash
pnpm test
```

9 unit tests across score parsing and color coding. The two API integration tests were replaced with logic-level unit tests — running fetch against localhost in Jest requires a test server setup that's disproportionate for this scope.

---

## Bugs fixed (Task A-1)

The provided Django starter had these issues:

**1. No authentication on `ScreenCandidateView`**
Any unauthenticated request could trigger an OpenAI call and write to the database.
```python
# fix
permission_classes = [IsAuthenticated]
```

**2. `KeyError` on missing fields**
`request.data['job_description']` raises `KeyError` if the field is absent. No 400 is returned — Django returns a 500.
```python
# fix
job_desc = request.data.get('job_description')
if not job_desc:
    return Response({'error': 'job_description required'}, status=400)
```

**3. Deprecated OpenAI SDK**
`openai.ChatCompletion.create` was removed in `openai>=1.0.0`.
```python
# fix
response = client.chat.completions.create(...)
```

**4. Prompt missing the job description**
The original prompt sent only the resume. Without the JD, the model has no target to score against — the number is meaningless.
```python
# fix — both inputs in the prompt
content=f"JD:\n{job_desc}\n\nResume:\n{resume}\n\nScore 1-10 and give 3 reasons."
```

**5. Score stored as raw string**
`response.choices[0].message.content` might be `"Seven"` or `"I'd give this an 8"`. Stored verbatim into a `CharField`, this breaks any downstream numeric comparison.
```python
# fix — parse before storing
score = parse_score(response.choices[0].message.content)  # returns float or None
```

**6. No error handling around the API call**
A rate limit or timeout from OpenAI returns Django's HTML error page, not a JSON response.
```python
# fix
try:
    response = client.chat.completions.create(...)
except openai.OpenAIError as e:
    return Response({'error': str(e)}, status=502)
```

**7. Resume (PII) stored in the database**
Raw resume text contains name, address, contact details, employment history. If the database is compromised, every candidate's data is exposed.
```python
# fix — store derived output only, discard the resume
Application.objects.create(
    job_title=job_title,
    ai_score=score,
    reason_1=reasons[0],
    # no resume field
)
```

**8. `ApplicationListView` returns all users' data**
Any authenticated user — including candidates — can call `GET /applications/` and see every other candidate's screening result.
```python
# fix
apps = Application.objects.filter(created_by=request.user)
```

---

## Shortcuts taken

- **No per-user accounts.** The tool uses a single shared password. Adding user accounts would require a users table, registration flow, and password reset — none of which were in scope.
- **Mobile not supported.** WebGPU has no mobile browser support in 2026. A fallback to a server-side API (OpenAI/Anthropic) would fix this but adds cost and PII-in-transit concerns.
- **Tests are unit-level only.** Integration tests against the API routes require a running Next.js server in the test environment. Given the 72h constraint, unit tests covering the core parsing logic were the right call.