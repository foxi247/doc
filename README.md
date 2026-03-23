# MedNavigator AI

**AI Medical Navigation Before the Doctor Visit**

MedNavigator AI is a premium health-tech marketing website and demo platform built with Next.js 14+, TypeScript, and Tailwind CSS. It demonstrates how AI can help patients organize symptoms, route to the right specialist, and prepare a doctor-ready summary — without making any diagnosis or treatment recommendations.

---

## What this is

- A polished, investor-ready marketing website for a health-tech AI product
- A safe, interactive demo showing symptom organization and specialist routing
- Fully integrated with the **NVIDIA Build OpenAI-compatible API** using model `z-ai/glm4.7`
- Designed to operate well within medical safety boundaries

**This is not a medical tool.** It is a navigation and preparation aid only. See the [Safety Policy](/safety) for full details.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Theme | next-themes |
| AI SDK | openai npm package |
| AI Provider | NVIDIA Build (OpenAI-compatible) |
| Model | z-ai/glm4.7 |
| Deployment | Vercel-ready |

---

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd mednavigator-ai

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

---

## Running locally

```bash
# Copy environment file
cp .env.example .env.local

# Edit .env.local with your NVIDIA API key (see below)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Adding your NVIDIA API key

1. Get a free API key from [NVIDIA Build](https://build.nvidia.com)
2. Open `.env.local`
3. Set the following:

```env
NVIDIA_API_KEY=your_api_key_here
NVIDIA_MODEL=z-ai/glm4.7
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_ENABLE_THINKING=true
AI_TIMEOUT_MS=30000
```

> **Important:** Never commit `.env.local` to version control. The API key is server-side only and is never exposed to the client.

If `NVIDIA_API_KEY` is not set, the app will automatically return contextual mock fallback responses — so the demo still works without a key.

---

## How the demo works

1. User visits `/demo`
2. User describes their symptoms in plain text (minimum 10 characters)
3. User optionally selects file types they have available (simulated — no real files uploaded)
4. User clicks "Analyze my symptoms"
5. The frontend sends a `POST` request to `/api/ai`
6. The server route:
   - Validates the request with Zod
   - Sanitizes the input
   - Builds a safety-constrained system prompt
   - Calls the NVIDIA model via the OpenAI SDK
   - Parses and validates the JSON response
   - Falls back to mock data if parsing fails
7. The response is rendered as a structured navigation summary

### What the demo shows
- Urgency guidance (low / medium / high)
- Suggested specialist type
- Possible area of concern
- Navigation summary
- Follow-up questions to discuss with a doctor

### What the demo never does
- Diagnose any medical condition
- Recommend treatment or medication
- Present itself as medical advice

---

## Project structure

```
/app
  /(marketing)
    page.tsx              # Home page
    product/page.tsx      # Product overview
    safety/page.tsx       # Safety policy
    clinics/page.tsx      # For Clinics B2B page
    contact/page.tsx      # Contact form
    demo/page.tsx         # Interactive demo
  /api
    /ai
      route.ts            # NVIDIA API server route
  layout.tsx              # Root layout with metadata
  globals.css             # Global styles + CSS variables
  robots.ts               # Robots.txt
  sitemap.ts              # XML sitemap

/components
  navbar.tsx              # Sticky transparent navbar
  hero.tsx                # Hero section with mockup
  how-it-works.tsx        # 4-step process section
  ai-agents.tsx           # 6 specialist agent cards
  summary-preview.tsx     # Doctor-ready summary card
  safety-section.tsx      # Safety boundaries section
  testimonials.tsx        # User testimonial cards
  clinics-section.tsx     # B2B clinic section
  cta-band.tsx            # CTA banner
  footer.tsx              # Footer with disclaimer
  demo-widget.tsx         # Interactive demo component
  theme-provider.tsx      # next-themes wrapper

/lib
  /ai
    client.ts             # NVIDIA OpenAI client config
    prompts.ts            # System prompt + message builder
    types.ts              # TypeScript types for AI responses
    parser.ts             # JSON response parser + repair
    fallback.ts           # Mock fallback responses
  utils.ts                # Shared utilities (cn, sanitize, etc.)
```

---

## NVIDIA API integration

The integration uses the `openai` npm package pointed at the NVIDIA OpenAI-compatible endpoint:

```ts
import OpenAI from "openai";

const aiClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
});
```

### Key parameters preserved from the reference implementation

| Parameter | Value | Reason |
|---|---|---|
| `model` | `z-ai/glm4.7` | Target model |
| `temperature` | `0.3` | Lower for more structured, safer output |
| `top_p` | `1` | Default |
| `max_tokens` | `1200` | Sufficient for structured JSON |
| `enable_thinking` | `true` | Enables extended reasoning |
| `clear_thinking` | `false` | Preserves reasoning context |

> Note: `reasoning_content` from the model's thinking process is logged server-side but **never exposed to the user interface**.

---

## Safety limitations

- This platform is **not a medical device** under any regulatory framework
- Outputs are **not diagnoses**, treatment recommendations, or clinical evaluations
- The AI is constrained by a safety system prompt that prohibits diagnostic or prescriptive language
- All responses include a mandatory disclaimer
- Emergency scenarios are flagged with urgency guidance, but users are always directed to contact emergency services
- For full details, see the Safety page in the application

---

## Deployment

### Vercel (recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# NVIDIA_API_KEY, NVIDIA_MODEL, NVIDIA_BASE_URL, NVIDIA_ENABLE_THINKING, AI_TIMEOUT_MS
```

### Other platforms

This is a standard Next.js 14 app and can be deployed to any platform that supports Node.js 18+.

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## Environment variables reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `NVIDIA_API_KEY` | Yes (for live AI) | — | Your NVIDIA Build API key |
| `NVIDIA_MODEL` | No | `z-ai/glm4.7` | Model ID |
| `NVIDIA_BASE_URL` | No | `https://integrate.api.nvidia.com/v1` | API base URL |
| `NVIDIA_ENABLE_THINKING` | No | `true` | Enable model thinking |
| `AI_TIMEOUT_MS` | No | `30000` | Request timeout in ms |

---

## License

This project is provided as a demonstration and template. All medical disclaimers apply. See the Safety page for details.
