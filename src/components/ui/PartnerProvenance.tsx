import { BadgeCheck, ExternalLink, FlaskConical, Info } from "lucide-react";
import { isComForcePartnerTier, type Partner, type RelationshipTier } from "@/lib/types";

const TIER_LABEL: Record<RelationshipTier, string> = {
  confirmed_collaborator: "Confirmed collaborator",
  affiliated: "Affiliated",
  supporter: "Supporter",
  ecosystem: "Same network, no confirmed tie",
  to_verify: "Unverified",
};

/** "Real organization" vs "Fictional demo partner", plus the relationship tier for real ones. */
export function PartnerBadge({ partner, size = "md" }: { partner: Pick<Partner, "isReal" | "relationshipTier">; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "text-[10.5px] px-1.5 py-[1px]" : "text-[11px] px-2 py-0.5";
  if (!partner.isReal) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-surface-2 font-medium text-ink-2 ${cls}`} title="Invented for the demo: name, contacts and capacity are fictional.">
        <FlaskConical size={size === "sm" ? 10 : 11} aria-hidden /> Fictional demo partner
      </span>
    );
  }
  const tier = partner.relationshipTier;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className={`inline-flex items-center gap-1 rounded-full bg-green-soft font-medium text-green ${cls}`} title="Facts from the public sources listed. Not confirmed by the organization.">
        <BadgeCheck size={size === "sm" ? 10 : 11} aria-hidden /> Real organization, from public sources
      </span>
      {tier && (
        <span className={`inline-flex items-center rounded-full bg-brand-soft font-medium text-brand ${cls}`}>
          {isComForcePartnerTier(tier) ? `ComForce partner · ${TIER_LABEL[tier]}` : TIER_LABEL[tier]}
        </span>
      )}
    </span>
  );
}

/** Relationship, public sources and the simulated-capacity disclaimer for a real organization. */
export function PartnerSources({ partner, compact = false }: { partner: Partner; compact?: boolean }) {
  if (!partner.isReal) return null;
  return (
    <div className={`rounded-lg border border-[#bfe7cf] bg-green-soft/50 ${compact ? "p-2.5" : "p-3"} text-[12px]`}>
      {partner.relationship && <p className="leading-snug text-ink">{partner.relationship}</p>}
      {!!partner.evidence?.length && (
        <ul className="mt-2 space-y-1" aria-label={`Sources for ${partner.name}`}>
          {partner.evidence.map((e) => (
            <li key={e.url}>
              <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 text-brand hover:underline">
                <ExternalLink size={11} className="mt-[3px] shrink-0" aria-hidden /> <span>{e.title}</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 flex items-start gap-1 font-medium text-ink-2">
        <Info size={12} className="mt-[2px] shrink-0" aria-hidden /> Capacity is simulated. Not confirmed by this organization.
      </p>
    </div>
  );
}
