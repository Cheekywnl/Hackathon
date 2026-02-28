# AI Startup Interview Evaluator

Hackathon-ready web app that evaluates startup pitches by comparing what founders say against their GitHub repositories.

## Features

- Record a pitch (audio or video)
- Paste GitHub repo URL
- AI analysis: technical credibility, pitch clarity, fundability
- Strengths, weaknesses, inconsistencies, actionable suggestions
- Optional PDF report export
- Demo mode for quick testing

## Quick Start

```bash
npm install
cp .env.example .env.local
# Add OPENAI_API_KEY to .env.local
npm run dev
```

Open http://localhost:3000

## Tech Stack

Next.js 14 · React · Tailwind · OpenAI GPT + Whisper
