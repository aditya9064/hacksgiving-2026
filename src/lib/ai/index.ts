import { NEEDS, NEIGHBORHOODS, type Need, type StructuredIntake, type Urgency } from "../types";
import { redactPII } from "./redact";

const KEYWORDS: Record<Need, RegExp> = {
  food: /\b(food|grocer|hungry|eat|pantry|meal|formula|diapers?)\b/i,
  rent: /\b(rent|evict|landlord|5[- ]day|notice to (quit|vacate)|behind on)\b/i,
  utilities: /\b(we ?energies|electric|power|gas bill|water bill|shut ?off|disconnect|heat(ing)? (bill|shut))\b/i,
  housing: /\b(homeless|shelter|displaced|fire|flood|staying in (my|our|the) car|nowhere to (stay|go)|no heat|couch)\b/i,
  mediation: /\b(dispute|argu|fight|beef|neighbor|mediat|conflict|threaten|it almost got physical)\b/i,
  safety: /\b(threat|gun|shot|shoot|violence|pop off|retaliat|scared|unsafe|weapon|stab|jump(ed)?)\b/i,
  health: /\b(med(s|ication|ical)|doctor|clinic|dialysis|insulin|pharmacy|hospital|pregnan|mental|anxiety|depress)\b/i,
  transport: /\b(ride|bus|transit|car broke|get to work|uber|lyft|voucher)\b/i,
  youth: /\b(son|daughter|teen|kid|school|youth|15|16|17|my boy|my girl)\b/i,
  legal: /\b(court|lawyer|attorney|legal|notice|warrant|custody|id card|identification)\b/i,
  other: /$^/,
};

function fallbackStructure(redacted: string): Omit<StructuredIntake, "redactedText" | "redactions"> {
  const needs = NEEDS.filter((n) => KEYWORDS[n].test(redacted)) as Need[];
  if (!needs.length) needs.push("other");
  let urgency: Urgency = "normal";
  if (/\b(tonight|today|now|asap|emergency|weapon|gun|physical|fire|shut ?off (is )?(monday|tomorrow|today)|5[- ]day|baby|infant)\b/i.test(redacted)) urgency = "critical";
  else if (/\b(this week|friday|monday|soon|threat|kids|children|dialysis|behind)\b/i.test(redacted)) urgency = "high";
  const hood = NEIGHBORHOODS.find((h) => redacted.toLowerCase().includes(h.toLowerCase())) ?? guessHoodFromStreets(redacted) ?? "Unknown";
  const hh = redacted.match(/\b(\d)\s*(kids|children|people|of us)\b/i);
  const family = redacted.match(/family of (\d)/i);
  const householdSize = family ? Number(family[1]) : hh ? Number(hh[1]) + 1 : undefined;
  const language = /\b(hola|necesito|ayuda|gracias|por favor)\b/i.test(redacted) ? "es" : "en";
  const summary = redacted.replace(/\[(name|phone|address|email)\]/g, "").replace(/\s+/g, " ").trim().slice(0, 90);
  return { summary, needs: needs.slice(0, 3), urgency, neighborhood: hood, householdSize, language };
}

function guessHoodFromStreets(t: string): string | undefined {
  const m: [RegExp, string][] = [
    [/\b(35th|burleigh|sherman)\b/i, "Sherman Park"],
    [/\b(holton|locust|mlk|king dr)\b/i, "Harambee"],
    [/\b(center st|27th|metcalfe)\b/i, "Metcalfe Park"],
    [/\b(fond du lac|north ave|lindsay)\b/i, "Lindsay Heights"],
    [/\b(cesar chavez|national ave|clarke)\b/i, "Clarke Square"],
    [/\b(mitchell st|mitchell street)\b/i, "Historic Mitchell St"],
    [/\b(kinnickinnic|kk ave|bay view)\b/i, "Bay View"],
    [/\b(humboldt|riverwest|center and holton)\b/i, "Riverwest"],
  ];
  return m.find(([re]) => re.test(t))?.[1];
}

const SYSTEM = `You structure incoming requests for help for a Milwaukee community organization.
The text has already had personal identifiers replaced with [name], [phone], [address], [email]. Never try to guess them back.
Return strict JSON: {"summary": string (<= 12 words, neutral, no names), "needs": string[] (1-3 from ${JSON.stringify(NEEDS)}), "urgency": "low"|"normal"|"high"|"critical", "neighborhood": one of ${JSON.stringify(NEIGHBORHOODS)} or "Unknown", "householdSize": number|null, "language": "en"|"es"|"hmn"|"other"}.
Urgency rules: critical = risk to life/safety, shutoff/eviction within 72h, infant without heat; high = within a week or involves kids/health; normal otherwise.
Describe the NEED. Never characterize people as dangerous or as suspects.`;

export async function structureIntake(rawText: string): Promise<StructuredIntake> {
  const { redactedText, redactions } = redactPII(rawText);
  const fallback = fallbackStructure(redactedText);
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { redactedText, redactions, ...fallback };

  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: key });
    const res = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: redactedText },
      ],
    });
    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
    const needs = (Array.isArray(parsed.needs) ? parsed.needs : []).filter((n: string) => (NEEDS as readonly string[]).includes(n)) as Need[];
    return {
      redactedText,
      redactions,
      summary: typeof parsed.summary === "string" && parsed.summary ? parsed.summary : fallback.summary,
      needs: needs.length ? needs : fallback.needs,
      urgency: (["low", "normal", "high", "critical"] as const).includes(parsed.urgency) ? parsed.urgency : fallback.urgency,
      neighborhood: typeof parsed.neighborhood === "string" && parsed.neighborhood ? parsed.neighborhood : fallback.neighborhood,
      householdSize: typeof parsed.householdSize === "number" ? parsed.householdSize : fallback.householdSize,
      language: typeof parsed.language === "string" ? parsed.language : fallback.language,
    };
  } catch (err) {
    console.warn("[ai] falling back to rules:", (err as Error).message);
    return { redactedText, redactions, ...fallback };
  }
}

export async function transcribeAudio(file: File): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set; voice notes need Whisper");
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: key });
  const r = await client.audio.transcriptions.create({ file, model: "whisper-1" });
  return r.text;
}

export async function draftFunderNarrative(stats: Record<string, unknown>): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  const fallback = `Over the reporting period, ComForce MKE and ${stats.partnerCount} partner organizations handled ${stats.total} requests for help across ${stats.neighborhoodCount} Milwaukee neighborhoods. ${stats.verifiedPct}% of completed requests were confirmed by the resident themselves, with a median time from first contact to delivered help of ${stats.medianMinutes} minutes. The most common needs were ${stats.topNeeds}. Every figure in this report is drawn from the live Relay record and can be audited request by request.`;
  if (!key) return fallback;
  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: key });
    const res = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: "Write a 120-160 word impact narrative for a nonprofit funder report. Plain, concrete, no hype, no names of individuals. Use only the numbers given." },
        { role: "user", content: JSON.stringify(stats) },
      ],
    });
    return res.choices[0]?.message?.content?.trim() || fallback;
  } catch {
    return fallback;
  }
}
