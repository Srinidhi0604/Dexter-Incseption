import { GoogleGenerativeAI } from "@google/generative-ai";

import { ISSUE_CATEGORIES } from "@/lib/constants";

interface ClassifyIssueInput {
  imageUrl: string;
  description?: string;
}

interface ClassifyIssueResult {
  category: string;
  source: "gemini" | "heuristic";
}

const keywordMap: Record<string, string> = {
  garbage: "garbage",
  trash: "garbage",
  waste: "garbage",
  pothole: "pothole",
  road: "pothole",
  light: "streetlight",
  dark: "streetlight",
  leak: "water_leak",
  water: "water_leak",
  graffiti: "graffiti",
  paint: "graffiti",
  drain: "drain_blockage",
  sewage: "drain_blockage",
};

function heuristicClassification(text: string) {
  const normalized = text.toLowerCase();

  for (const [keyword, category] of Object.entries(keywordMap)) {
    if (normalized.includes(keyword)) {
      return category;
    }
  }

  return "garbage";
}

function normalizeCategory(value: string) {
  const cleaned = value.trim().toLowerCase().replace(/[^a-z_]/g, "");
  return ISSUE_CATEGORIES.find((category) => category === cleaned) ?? "garbage";
}

export async function classifyIssue(
  input: ClassifyIssueInput,
): Promise<ClassifyIssueResult> {
  const fallback = heuristicClassification(
    `${input.description ?? ""} ${input.imageUrl}`,
  );

  if (!process.env.GEMINI_API_KEY) {
    return {
      category: fallback,
      source: "heuristic",
    };
  }

  try {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = [
      "Classify this civic issue into one category.",
      `Allowed categories: ${ISSUE_CATEGORIES.join(", ")}`,
      "Return only one category value and nothing else.",
      `Description: ${input.description ?? "No description provided."}`,
      `Image URL reference: ${input.imageUrl.slice(0, 280)}`,
    ].join("\n");

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return {
      category: normalizeCategory(text),
      source: "gemini",
    };
  } catch {
    return {
      category: fallback,
      source: "heuristic",
    };
  }
}
