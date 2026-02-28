import { AccountData } from './useAccountData'

export interface ReviewInput {
  account: AccountData | null
  video?: File | null
  transcription?: string | null
}

export interface ReviewFeedback {
  rating: number
}

// Pass account data and video, returns feedback as JSON
export function getReview(input: ReviewInput): ReviewFeedback {
  
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const transcript = String(body.transcriptText || "").trim();

    if (!transcript) {
      return NextResponse.json({ error: "No transcriptText provided." }, { status: 400 });
    }

    const prompt = `
You are evaluating a candidate's startup pitch answer from a recorded interview.
You are both:
- a VC judging product/market fit and feasibility
- a software engineering interviewer judging clarity and structure

Score from 1 to 10 (integers) and return ONLY valid JSON with this exact shape:

{
  "scores": {
    "delivery": 1-10,
    "clarity_structure": 1-10,
    "product_viability": 1-10,
    "implementability": 1-10,
    "overall": 1-10
  },
  "summary": "1-2 sentence verdict",
  "strengths": ["...","...","..."],
  "improvements": ["...","...","..."],
  "red_flags": ["..."],
  "next_steps": ["..."]
}

Transcript:
${transcript}
`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const content = resp.choices[0]?.message?.content ?? "{}";
    return NextResponse.json(JSON.parse(content));
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export const runtime = "nodejs";

function parseGitHubRepoUrl(url: string) {
  const m = url.trim().match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)(?:[/?#].*)?$/i);
  if (!m) throw new Error("Invalid GitHub repo URL. Example: https://github.com/vercel/next.js");
  return { owner: m[1], repo: m[2].replace(/\.git$/i, "") };
}

function daysAgo(dateIso: string) {
  const ms = Date.now() - new Date(dateIso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreRepoSignals(input: {
  hasReadme: boolean;
  hasLicense: boolean;
  hasCI: boolean;
  pushedAt: string;
  openIssues: number;
  commitsLast30: number;
  contributorsCount: number;
  languagesCount: number;
  hasPackageScripts: boolean;
}) {
  const explanations: string[] = [];

  // Documentation (0-2)
  let doc = 0;
  if (input.hasReadme) doc += 1; else explanations.push("Missing README (harder to judge what it does / how to run).");
  if (input.hasLicense) doc += 1; else explanations.push("Missing LICENSE (can raise diligence/IP concerns).");

  // Activity (0-3)
  let activity = 0;
  const d = daysAgo(input.pushedAt);
  if (d <= 7) activity += 2;
  else if (d <= 30) activity += 1;
  else explanations.push(`No recent push in ${d} days (looks inactive).`);

  if (input.commitsLast30 >= 10) activity += 1;
  else if (input.commitsLast30 === 0) explanations.push("No commits in the last 30 days.");
  activity = clamp(activity, 0, 3);

  // Hygiene (0-3)
  let hygiene = 0;
  if (input.hasCI) hygiene += 1; else explanations.push("No CI detected (e.g., GitHub Actions).");
  if (input.hasPackageScripts) hygiene += 1; else explanations.push("No obvious build/test scripts found (package.json scripts).");
  if (input.contributorsCount >= 2) hygiene += 1; else explanations.push("Single contributor (weaker team execution signal).");

  // Delivery readiness (0-2)
  let delivery = 0;
  if (input.openIssues > 0) delivery += 1;
  if (input.languagesCount >= 1) delivery += 1;

  const total = doc + activity + hygiene + delivery;

  return {
    score10: clamp(total, 0, 10),
    breakdown: { documentation: doc, activity, hygiene, delivery_readiness: delivery },
    explanations,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const repoUrl = String(body.repoUrl || "").trim();
    if (!repoUrl) return NextResponse.json({ error: "Missing repoUrl" }, { status: 400 });

    const { owner, repo } = parseGitHubRepoUrl(repoUrl);

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN || undefined,
      userAgent: "startup-evaluator-hackathon",
    });

    const [repoResp, langsResp] = await Promise.all([
      octokit.repos.get({ owner, repo }),
      octokit.repos.listLanguages({ owner, repo }),
    ]);

    // README
    let hasReadme = true;
    try { await octokit.repos.getReadme({ owner, repo }); } catch { hasReadme = false; }

    // LICENSE
    let hasLicense = true;
    try { await octokit.licenses.getForRepo({ owner, repo }); } catch { hasLicense = false; }

    // CI: .github/workflows exists?
    let hasCI = false;
    try {
      const contents = await octokit.repos.getContent({ owner, repo, path: ".github/workflows" });
      // @ts-ignore
      hasCI = Array.isArray(contents.data) && contents.data.length > 0;
    } catch {
      hasCI = false;
    }

    // Commits last 30 days
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let commitsLast30 = 0;
    try {
      const commits = await octokit.repos.listCommits({ owner, repo, since, per_page: 100 });
      commitsLast30 = commits.data.length;
    } catch {
      commitsLast30 = 0;
    }

    // Contributors
    let contributorsCount = 1;
    try {
      const contrib = await octokit.repos.listContributors({ owner, repo, per_page: 100 });
      contributorsCount = contrib.data.length || 1;
    } catch {
      contributorsCount = 1;
    }

    // package.json scripts (Node projects)
    let hasPackageScripts = false;
    try {
      const pkg = await octokit.repos.getContent({ owner, repo, path: "package.json" });
      // @ts-ignore
      const b64 = pkg.data?.content;
      if (typeof b64 === "string") {
        const decoded = Buffer.from(b64, "base64").toString("utf8");
        const parsed = JSON.parse(decoded);
        hasPackageScripts = !!parsed?.scripts && Object.keys(parsed.scripts).length > 0;
      }
    } catch {
      hasPackageScripts = false;
    }

    const pushedAt = repoResp.data.pushed_at || repoResp.data.updated_at!;
    const openIssues = repoResp.data.open_issues_count || 0;
    const languages = langsResp.data || {};
    const languagesCount = Object.keys(languages).length;

    const score = scoreRepoSignals({
      hasReadme,
      hasLicense,
      hasCI,
      pushedAt,
      openIssues,
      commitsLast30,
      contributorsCount,
      languagesCount,
      hasPackageScripts,
    });

    return NextResponse.json({
      input: { repoUrl, owner, repo },
      summary: {
        fullName: repoResp.data.full_name,
        stars: repoResp.data.stargazers_count,
        forks: repoResp.data.forks_count,
        openIssues,
        pushedAt,
        daysSincePush: daysAgo(pushedAt),
        languages,
      },
      signals: {
        hasReadme,
        hasLicense,
        hasCI,
        commitsLast30,
        contributorsCount,
        hasPackageScripts,
      },
      score,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
}
