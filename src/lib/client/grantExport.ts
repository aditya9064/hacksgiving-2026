// Word export of a drafted grant application + evidence pack. Loaded on demand (docx is heavy).
import type { ApplicationDraft, Funder, LogicModel, Story, UnitEconomics, RequirementId } from "../grants";
import { REQUIREMENTS } from "../grants";
import type { ClusterStats } from "../clusters";

export interface ApplicationExport {
  funder: Funder;
  period: string;
  draft: ApplicationDraft;
  logic: LogicModel;
  econ: UnitEconomics;
  story: Story | null;
  clusters: ClusterStats;
  readyIds: RequirementId[];
  gapIds: RequirementId[];
}

export async function exportApplicationDocx(x: ApplicationExport) {
  const d = await import("docx");
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType } = d;
  const p = (text: string, opts: { bold?: boolean; color?: string; size?: number; after?: number } = {}) =>
    new Paragraph({ spacing: { after: opts.after ?? 120 }, children: [new TextRun({ text, bold: opts.bold, color: opts.color, size: opts.size })] });
  const h1 = (t: string) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240 }, children: [new TextRun(t)] });
  const h2 = (t: string) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
  const cell = (text: string, bold = false, fill?: string) =>
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold, size: 18 })] })], shading: fill ? { type: ShadingType.CLEAR, color: "auto", fill } : undefined });
  const table = (head: string[], rows: (string | number)[][]) =>
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ tableHeader: true, children: head.map((h) => cell(h, true, "E7F4FB")) }), ...rows.map((r) => new TableRow({ children: r.map((v) => cell(String(v))) }))] });
  const paras = (t: string) => t.split(/\n+/).filter(Boolean).map((s) => p(s, { after: 160 }));
  const label = (id: RequirementId) => REQUIREMENTS.find((r) => r.id === id)?.label ?? id;

  const children = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Grant application draft")] }),
    p(`${x.funder.name} — ${x.funder.program}`, { bold: true }),
    p(`Prepared by ComForce MKE with Relay MKE · ${x.period} · ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`, { color: "6B7280", size: 18 }),
    p("Draft for editing. Every figure is drawn from the Relay record and can be audited request by request. Verify the funder's current deadline and portal requirements before submitting.", { color: "6B7280", size: 18, after: 240 }),
    h1("1. Statement of need"),
    ...paras(x.draft.need),
    h1("2. Outcomes and evidence"),
    ...paras(x.draft.outcomes),
    h1("3. Evaluation plan"),
    ...paras(x.draft.evaluation),
    h1("Appendix A · Logic model"),
    table(["Inputs", "Activities", "Outputs", "Outcomes"], Array.from({ length: Math.max(x.logic.inputs.length, x.logic.activities.length, x.logic.outputs.length, x.logic.outcomes.length) }, (_, i) => [x.logic.inputs[i] ?? "", x.logic.activities[i] ?? "", x.logic.outputs[i] ?? "", x.logic.outcomes[i] ?? ""])),
    p(`Impact: ${x.logic.impact}`, { after: 240 }),
    h1("Appendix B · Activity by DCWS Countdown cluster"),
    p(`${x.clusters.pctInClusters}% of requests fell inside ${x.clusters.clustersReached} of the City's 26 incident clusters; ${x.clusters.verifiedInClusters} of ${x.clusters.deliveredInClusters} deliveries there were confirmed by the resident. Cluster centroids are approximate; counts are per area only.`),
    table(["Cluster", "Intersection", "Requests", "Delivered", "Resident-verified", "Open"], x.clusters.rows.map((r) => [r.cluster.n, r.cluster.name, r.total, r.delivered, r.verified, r.open])),
    h1("Appendix C · Platform cost"),
    table(["Measure", "Value"], [["Period platform cost", `$${x.econ.periodCost.toFixed(2)}`], ["Per request", `$${x.econ.perRequest.toFixed(2)}`], ["Per resident-verified outcome", x.econ.perVerified ? `$${x.econ.perVerified.toFixed(2)}` : "n/a"], ...x.econ.assumptions.map((a) => [a.item, `$${a.cost} ${a.unit}`])]),
    p(x.econ.note, { color: "6B7280", size: 18 }),
  ];
  if (x.story) children.push(h1("Appendix D · One case, de-identified"), h2(x.story.title), p(x.story.body));
  children.push(
    h1("Appendix E · Readiness for this funder"),
    table(["Requirement", "Status"], [...x.readyIds.map((id) => [label(id), "Ready"]), ...x.gapIds.map((id) => [label(id), "To supply"])]),
  );

  const doc = new Document({ creator: "Relay MKE", title: `Grant draft — ${x.funder.name}`, sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `relay-mke-grant-${x.funder.id}-${x.period.toLowerCase().replace(/\s+/g, "-")}.docx`;
  a.click();
  URL.revokeObjectURL(a.href);
}
