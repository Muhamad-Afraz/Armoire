import { NextResponse } from "next/server";
import { CATEGORIES } from "@/lib/data";

const globalForGemini = globalThis as typeof globalThis & { __geminiPreferredModel?: string };

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
  }>;
  error?: { message?: string };
};

function parseDataUrl(dataUrl: string) {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl || "");
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

function extractJson(text: string) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("No JSON found in model response");
  }
}

function normalizeCategory(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "Other";
  const lower = raw.toLowerCase();
  const exact = CATEGORIES.find((c) => c.toLowerCase() === lower);
  if (exact) return exact;
  // Prefer the most specific match: a "denim jacket" must not become "Jacket".
  const loose = CATEGORIES
    .filter((c) => lower.includes(c.toLowerCase()) || c.toLowerCase().includes(lower))
    .sort((a, b) => b.length - a.length)[0];
  return loose || "Other";
}

function normalizeColor(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const parts = value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
    if (parts.length) return parts.join(", ");
  }
  return "";
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "GEMINI_API_KEY is not configured." }, { status: 503 });
    }

    const body = (await request.json()) as { image?: string };
    const image = body.image;
    const parsed = image ? parseDataUrl(image) : null;
    if (!parsed) {
      return NextResponse.json({ ok: false, error: "A valid image data URL is required." }, { status: 400 });
    }

    const prompt = [
      "You analyze a single clothing or fashion accessory item photo for a wardrobe app.",
      "Return ONLY valid JSON (no markdown, no explanation) with this exact shape:",
      "{",
      '  "category": "one of the allowed categories",',
      '  "color": "primary color(s) of the item, human-readable (include secondary colors if important)",',
      '  "suggestedName": "short clear item name",',
      '  "pattern": "solid, striped, plaid, floral, graphic, or leave empty",',
      '  "material": "visible fabric such as denim, linen, cotton, wool, leather, silk, or leave empty",',
      '  "notes": "brief optional notes about condition or visible details"',
      "}",
      `Allowed categories: ${CATEGORIES.join(", ")}`,
      "Rules:",
      "- Pick the single MOST SPECIFIC matching category (Denim Jacket instead of Jacket, Oxford Shirt instead of Shirt, Suit Trousers instead of Trousers). The stylist engine depends on this precision.",
      "- Color is very important; be specific (e.g. 'Navy blue', 'White with black stripes', 'Beige/Tan').",
      "- Identify pattern and material whenever visible — they drive colour and formality decisions.",
      "- If the item is wrinkled or folded, still identify it and suggest a neat name; mention condition in notes if relevant.",
      "- suggestedName should be concise (2-5 words).",
    ].join("\n");

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: parsed.mimeType, data: parsed.data } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    };

    const baseUrl = "https://generativelanguage.googleapis.com/v1beta";
    const preferred = globalForGemini.__geminiPreferredModel;
    const initialModels = [
      preferred,
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash-8b-latest",
      "gemini-1.5-flash",
      "gemini-flash-latest",
    ].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i);

    const errors: string[] = [];
    let data: GeminiResponse | null = null;
    let lastStatus = 502;
    let text = "";

    async function tryModel(model: string) {
      const endpoint = `${baseUrl}/models/${model}:generateContent?key=${encodeURIComponent(apiKey!)}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await response.json().catch(() => ({}))) as GeminiResponse;
      if (!response.ok) {
        errors.push(`${model}: ${json?.error?.message || `HTTP ${response.status}`}`);
        lastStatus = response.status || 502;
        return false;
      }

      const candidateText = (json.candidates?.[0]?.content?.parts || [])
        .map((part) => ("text" in part ? part.text : ""))
        .join("")
        .trim();

      if (!candidateText) {
        errors.push(`${model}: returned no text`);
        lastStatus = 502;
        return false;
      }

      data = json;
      text = candidateText;
      globalForGemini.__geminiPreferredModel = model;
      return true;
    }

    for (const model of initialModels) {
      if (await tryModel(model)) break;
    }

    if (!data || !text) {
      // Discover available models for this key/project and retry supported ones.
      try {
        const listResp = await fetch(`${baseUrl}/models?key=${encodeURIComponent(apiKey!)}`);
        const listJson = (await listResp.json().catch(() => ({}))) as {
          models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
          error?: { message?: string };
        };
        if (listResp.ok && Array.isArray(listJson.models)) {
          const discovered = listJson.models
            .filter((m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent"))
            .map((m) => (m.name || "").replace(/^models\//, ""))
            .filter(Boolean)
            .filter((m) => !initialModels.includes(m));

          // Prefer flash/vision-capable general models first.
          discovered.sort((a, b) => {
            const score = (name: string) =>
              (name.includes("flash") ? 0 : 10) +
              (name.includes("lite") ? 1 : 0) +
              (name.includes("latest") ? 0 : 1);
            return score(a) - score(b);
          });

          for (const model of discovered.slice(0, 8)) {
            if (await tryModel(model)) break;
          }
        } else if (!listResp.ok && listJson?.error?.message) {
          errors.push(`ListModels: ${listJson.error.message}`);
          lastStatus = listResp.status || lastStatus;
        }
      } catch (e) {
        errors.push(`ListModels: ${e instanceof Error ? e.message : "failed"}`);
      }
    }

    if (!data || !text) {
      const detail = errors.slice(0, 6).join(" | ");
      return NextResponse.json(
        { ok: false, error: detail || "Gemini request failed. Check GEMINI_API_KEY, project access, and enabled Generative Language API." },
        { status: lastStatus },
      );
    }

    const json = extractJson(text) as Record<string, unknown>;
    const category = normalizeCategory(json.category);
    const color = normalizeColor(json.color ?? json.primaryColor ?? json.colors);
    const suggestedName = typeof json.suggestedName === "string" && json.suggestedName.trim()
      ? json.suggestedName.trim()
      : typeof json.name === "string" && json.name.trim()
        ? json.name.trim()
        : "";
    const pattern = typeof json.pattern === "string" ? json.pattern.trim() : "";
    const material = typeof json.material === "string" ? json.material.trim() : "";
    const detail = typeof json.notes === "string" ? json.notes.trim() : "";
    const notes = [pattern, material, detail].filter(Boolean).join(" · ");

    return NextResponse.json({
      ok: true,
      analysis: {
        category,
        color,
        suggestedName,
        notes,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not analyze the item.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
