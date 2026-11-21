import type { ActivityEvent, HelpRequest, Partner, Playbook, Status, Need, Urgency } from "../types";

// All names, numbers and stories below are fictional. Neighborhood names are real Milwaukee areas.

export const SEED_PARTNERS: Partner[] = [
  { id: "p-comforce", name: "ComForce MKE", contactName: "On-call lead", phone: "+14145550100", email: "dispatch@comforce.example", address: "3500 W Burleigh St", coords: [43.0738, -87.9612], needs: ["mediation", "safety", "youth", "other"], neighborhoods: ["Sherman Park", "Harambee", "Amani", "Metcalfe Park"], capacity: 6, hours: "24/7 rapid response", verifiedAt: "2026-11-19T12:00:00Z" },
  { id: "p-pantry", name: "Northside Community Pantry", contactName: "Front desk", phone: "+14145550111", email: "intake@northsidepantry.example", address: "4100 W Lisbon Ave", coords: [43.0538, -87.9668], needs: ["food"], neighborhoods: ["Sherman Park", "Lindsay Heights", "Garden Homes"], capacity: 14, hours: "Tue–Sat 10–4", verifiedAt: "2026-11-18T15:00:00Z" },
  { id: "p-housing", name: "Milwaukee Housing Helpline", contactName: "Intake line", phone: "+14145550122", email: "help@mkehousing.example", address: "728 N James Lovell St", coords: [43.0405, -87.9205], needs: ["rent", "housing", "legal"], neighborhoods: ["Citywide"], capacity: 3, hours: "Mon–Fri 9–5", verifiedAt: "2026-11-17T09:00:00Z" },
  { id: "p-energy", name: "Keep the Lights On Fund", contactName: "Pledge desk", phone: "+14145550133", email: "pledges@lightson.example", address: "2200 N 27th St", coords: [43.0595, -87.9475], needs: ["utilities"], neighborhoods: ["Citywide"], capacity: 8, hours: "Mon–Fri 9–6", verifiedAt: "2026-11-19T08:00:00Z" },
  { id: "p-clinic", name: "Westside Free Clinic", contactName: "Charge nurse", phone: "+14145550144", email: "frontdesk@westsideclinic.example", address: "4350 W Lloyd St", coords: [43.0510, -87.9700], needs: ["health"], neighborhoods: ["Washington Park", "Concordia", "Midtown"], capacity: 5, hours: "Mon/Wed/Fri 8–2", verifiedAt: "2026-11-16T10:00:00Z" },
  { id: "p-rides", name: "Ride Share Collective", contactName: "Dispatcher", phone: "+14145550155", email: "rides@collective.example", address: "1900 S 6th St", coords: [43.0085, -87.9185], needs: ["transport"], neighborhoods: ["Citywide"], capacity: 10, hours: "Daily 6am–10pm", verifiedAt: "2026-11-19T07:00:00Z" },
  { id: "p-youth", name: "Harambee Youth Hub", contactName: "Program lead", phone: "+14145550166", email: "hub@harambeeyouth.example", address: "3300 N Holton St", coords: [43.0745, -87.9050], needs: ["youth", "mediation"], neighborhoods: ["Harambee", "Riverwest"], capacity: 4, hours: "Mon–Fri 2–8", verifiedAt: "2026-11-15T13:00:00Z" },
  { id: "p-legal", name: "Tenant Legal Aid MKE", contactName: "Reception", phone: "+14145550177", email: "intake@tenantlegal.example", address: "633 W Wisconsin Ave", coords: [43.0388, -87.9205], needs: ["legal", "rent"], neighborhoods: ["Citywide"], capacity: 2, hours: "Tue/Thu 10–4", verifiedAt: "2026-11-12T13:00:00Z" },
];

interface SeedReq {
  text: string;
  summary: string;
  needs: Need[];
  urgency: Urgency;
  hood: string;
  status: Status;
  owner?: [string, string, string]; // name, org, partnerId
  ageMin: number;
  household?: number;
  feedback?: "yes" | "no" | "partial";
}

const SEEDS: SeedReq[] = [
  { text: "Hi this is [name], we're out of food until Friday and I have 3 kids. We're near 35th and Burleigh.", summary: "Family of 4 needs groceries until payday Friday", needs: ["food"], urgency: "high", hood: "Sherman Park", status: "new", ageMin: 6, household: 4 },
  { text: "My neighbor and I keep getting into it over the parking, last night it almost got physical. Can somebody come talk to us before it gets worse", summary: "Escalating neighbor dispute, requests mediation before it turns physical", needs: ["mediation", "safety"], urgency: "critical", hood: "Harambee", status: "new", ageMin: 14 },
  { text: "We Energies says shutoff is Monday. I'm $210 behind. Single mom, I work but hours got cut.", summary: "Utility shutoff Monday, $210 behind", needs: ["utilities"], urgency: "high", hood: "Metcalfe Park", status: "new", ageMin: 31, household: 3 },
  { text: "Landlord gave me a 5 day notice. I have the money on the 1st but not now. [name], [phone]", summary: "5-day eviction notice, can pay on the 1st", needs: ["rent", "legal"], urgency: "critical", hood: "Clarke Square", status: "claimed", owner: ["Keisha R.", "Milwaukee Housing Helpline", "p-housing"], ageMin: 55, household: 2 },
  { text: "My son's been getting threats at school and now online. He's 15. I don't want this to turn into something", summary: "Teen receiving threats at school and online, parent wants intervention", needs: ["youth", "safety", "mediation"], urgency: "high", hood: "Amani", status: "claimed", owner: ["Marcus T.", "ComForce MKE", "p-comforce"], ageMin: 80 },
  { text: "Need a ride to my dialysis Thursday 7am, my usual ride fell through", summary: "Ride needed for dialysis Thursday 7am", needs: ["transport", "health"], urgency: "high", hood: "Washington Park", status: "claimed", owner: ["Dee L.", "Ride Share Collective", "p-rides"], ageMin: 120 },
  { text: "Elderly mother ran out of blood pressure meds, pharmacy says insurance lapsed", summary: "Senior out of BP medication, insurance lapsed", needs: ["health"], urgency: "high", hood: "Concordia", status: "in_progress", owner: ["Dr. Patel", "Westside Free Clinic", "p-clinic"], ageMin: 200 },
  { text: "House fire on our block last night, family of 5 lost everything, staying in their car", summary: "Family of 5 displaced by fire, sleeping in car", needs: ["housing", "food", "other"], urgency: "critical", hood: "Lindsay Heights", status: "in_progress", owner: ["Marcus T.", "ComForce MKE", "p-comforce"], ageMin: 300, household: 5 },
  { text: "Can I get some help with my water bill, it's $87 past due and they put a notice on the door", summary: "Water bill $87 past due with shutoff notice", needs: ["utilities"], urgency: "normal", hood: "Silver City", status: "in_progress", owner: ["Jamal W.", "Keep the Lights On Fund", "p-energy"], ageMin: 420 },
  { text: "Bus pass for the month so I can keep getting to work and my kid to daycare", summary: "Monthly bus pass for work and daycare", needs: ["transport"], urgency: "normal", hood: "Historic Mitchell St", status: "in_progress", owner: ["Dee L.", "Ride Share Collective", "p-rides"], ageMin: 600 },
  { text: "Grocery delivery for grandma, she can't leave the house with her hip", summary: "Grocery delivery for homebound senior", needs: ["food"], urgency: "normal", hood: "Garden Homes", status: "delivered", owner: ["Tasha B.", "Northside Community Pantry", "p-pantry"], ageMin: 900, household: 1 },
  { text: "Behind $800 on rent after my hours got cut. Trying to avoid eviction", summary: "$800 rent arrears, avoiding eviction", needs: ["rent"], urgency: "high", hood: "Walker's Point", status: "delivered", owner: ["Keisha R.", "Milwaukee Housing Helpline", "p-housing"], ageMin: 1300 },
  { text: "Two groups of young guys keep posting at each other and it's about to pop off this weekend", summary: "Online beef between two youth groups, risk of weekend violence", needs: ["safety", "mediation", "youth"], urgency: "critical", hood: "Harambee", status: "delivered", owner: ["Vaun M.", "ComForce MKE", "p-comforce"], ageMin: 1500 },
  { text: "Need transit vouchers for two weeks to get to my new job until first check", summary: "Two weeks of transit vouchers until first paycheck", needs: ["transport"], urgency: "normal", hood: "Bay View", status: "delivered", owner: ["Dee L.", "Ride Share Collective", "p-rides"], ageMin: 1700 },
  { text: "Food pantry bag for family of 5 please, we come every other week", summary: "Regular pantry support, family of 5", needs: ["food"], urgency: "normal", hood: "Sherman Park", status: "verified", owner: ["Tasha B.", "Northside Community Pantry", "p-pantry"], ageMin: 2600, household: 5, feedback: "yes" },
  { text: "Rent help for November, I'm $400 short", summary: "$400 short on November rent", needs: ["rent"], urgency: "high", hood: "Midtown", status: "verified", owner: ["Keisha R.", "Milwaukee Housing Helpline", "p-housing"], ageMin: 3000, feedback: "yes" },
  { text: "Landlord won't fix the heat, it's 52 degrees inside with a baby", summary: "No heat with infant in home, landlord unresponsive", needs: ["housing", "legal"], urgency: "critical", hood: "Riverwest", status: "verified", owner: ["Ana G.", "Tenant Legal Aid MKE", "p-legal"], ageMin: 4000, household: 3, feedback: "partial" },
  { text: "My brother just got out and needs ID, a phone and somewhere to stay or he'll end up back with the old crowd", summary: "Reentry support: ID, phone, housing", needs: ["housing", "other", "safety"], urgency: "high", hood: "Amani", status: "verified", owner: ["Marcus T.", "ComForce MKE", "p-comforce"], ageMin: 5200, feedback: "yes" },
  { text: "Mediation went well, but the other family still parks in my spot sometimes", summary: "Follow-up after neighbor mediation", needs: ["mediation"], urgency: "low", hood: "Washington Park", status: "verified", owner: ["Vaun M.", "ComForce MKE", "p-comforce"], ageMin: 7000, feedback: "partial" },
  { text: "Heat shut off, two kids, landlord says it's my bill", summary: "Heat shutoff with two children", needs: ["utilities", "housing"], urgency: "critical", hood: "Metcalfe Park", status: "verified", owner: ["Jamal W.", "Keep the Lights On Fund", "p-energy"], ageMin: 8000, household: 3, feedback: "yes" },
];

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function makeShortCode(seed?: number): string {
  let s = "R-";
  for (let i = 0; i < 4; i++) {
    const r = seed !== undefined ? ((seed * 9301 + 49297 * (i + 1)) % 233280) / 233280 : Math.random();
    s += CODE_CHARS[Math.floor(r * CODE_CHARS.length)];
  }
  return s;
}

export function buildSeed(now = new Date()): { requests: HelpRequest[]; activity: ActivityEvent[] } {
  const requests: HelpRequest[] = [];
  const activity: ActivityEvent[] = [];
  SEEDS.forEach((s, i) => {
    const created = new Date(now.getTime() - s.ageMin * 60_000);
    const id = `req-${String(i + 1).padStart(3, "0")}`;
    const push = (minsAfter: number, actor: string, type: ActivityEvent["type"], text: string) => {
      activity.push({ id: `${id}-${activity.length}`, requestId: id, at: new Date(created.getTime() + minsAfter * 60_000).toISOString(), actor, type, text });
    };
    push(0, "resident", "created", `Request received via ${i % 3 === 0 ? "SMS" : i % 3 === 1 ? "web" : "voice note"}`);
    push(0.2, "ai", "structured", `Structured: ${s.needs.join(", ")} · ${s.urgency} · ${s.hood}. ${s.text.includes("[") ? "PII redacted." : "No PII found."}`);
    const order: Status[] = ["new", "claimed", "in_progress", "delivered", "verified"];
    const idx = order.indexOf(s.status);
    let deliveredAt: string | undefined;
    let verifiedAt: string | undefined;
    if (idx >= 1 && s.owner) push(12, s.owner[0], "claimed", `${s.owner[0]} (${s.owner[1]}) claimed this request`);
    if (idx >= 2 && s.owner) push(40, s.owner[0], "note", "Reached resident, confirmed details, arranging delivery");
    // Realistic time-to-help: 25 min to ~4 h depending on the case.
    const deliverMin = Math.min(s.ageMin * 0.6, 25 + ((i * 37) % 215));
    if (idx >= 3 && s.owner) {
      push(deliverMin, s.owner[0], "delivered", "Marked delivered");
      deliveredAt = new Date(created.getTime() + deliverMin * 60_000).toISOString();
      push(deliverMin + 1, "system", "verify_sent", "Sent resident: 'Did the help arrive? Reply 1 yes, 2 partly, 3 no'");
    }
    if (idx >= 4) {
      const reply = s.feedback === "yes" ? "1" : s.feedback === "partial" ? "2" : "3";
      const verifyMin = deliverMin + 30 + ((i * 11) % 90);
      push(verifyMin, "resident", "sms_in", `Resident replied "${reply}"`);
      push(verifyMin, "system", "verified", `Resident confirmed: ${s.feedback}`);
      verifiedAt = new Date(created.getTime() + verifyMin * 60_000).toISOString();
    }
    requests.push({
      id,
      shortCode: makeShortCode(i + 7),
      createdAt: created.toISOString(),
      updatedAt: activity[activity.length - 1].at,
      status: s.status,
      channel: i % 3 === 0 ? "sms" : i % 3 === 1 ? "web" : "voice",
      redactedText: s.text,
      summary: s.summary,
      needs: s.needs,
      urgency: s.urgency,
      neighborhood: s.hood,
      householdSize: s.household,
      language: i % 7 === 3 ? "es" : "en",
      consentToShare: true,
      ownerName: s.owner?.[0],
      ownerOrg: s.owner?.[1],
      partnerId: s.owner?.[2],
      deliveredAt,
      verifiedAt,
      residentFeedback: s.feedback,
    });
  });
  activity.sort((a, b) => a.at.localeCompare(b.at));
  return { requests, activity };
}

export const SEED_PLAYBOOKS: Playbook[] = [
  {
    id: "pb-mediation",
    title: "De-escalating a neighbor dispute",
    tags: ["mediation", "safety"],
    updatedAt: "2026-11-10",
    body: `1. Go in pairs. Never alone.\n2. Call ahead; ask each party separately if they are willing to talk.\n3. Meet on neutral ground (porch, church, community center), never inside either home the first time.\n4. Let each side speak uninterrupted for 3 minutes. Repeat back what you heard.\n5. Ask "what would make this okay for you?" Write the agreement down. Both sign, both get a photo.\n6. Schedule a 7-day check-in before you leave.\n7. If weapons are mentioned or present, leave and escalate to the on-call lead.`,
  },
  {
    id: "pb-shutoff",
    title: "Utility shutoff within 72 hours",
    tags: ["utilities"],
    updatedAt: "2026-11-02",
    body: `1. Ask for the account number and shutoff date (do not store the account number in Relay; the partner takes it directly).\n2. Wisconsin winter moratorium: disconnections for heat are prohibited Nov 1 – Apr 15 for residential customers. Remind the resident to call the utility and state they are a residential customer.\n3. Refer to Keep the Lights On Fund (same-day pledges up to $300) or Energy Assistance (WHEAP) for longer-term.\n4. If there is a medical device or infant in the home, ask the utility for a medical hold.\n5. Mark delivered only after the pledge is confirmed by the utility, not when the form is submitted.`,
  },
  {
    id: "pb-fire",
    title: "Fire displacement, first 24 hours",
    tags: ["housing", "food", "other"],
    updatedAt: "2026-10-28",
    body: `1. Red Cross Disaster Action Team: ask the family if Red Cross already met them on scene; if not, request a DAT visit.\n2. Immediate: a warm place for tonight, food, phone chargers, medication replacement.\n3. Open a Rapid Response Room in Relay and invite pantry + housing partners so everyone sees the same request.\n4. Help the family photograph the damage before cleanup.\n5. Day 2–3: school transportation for kids, replacement IDs, renter's or landlord insurance contact.`,
  },
  {
    id: "pb-youth",
    title: "Youth conflict that started online",
    tags: ["youth", "safety", "mediation"],
    updatedAt: "2026-11-15",
    body: `1. Take screenshots from the parent; do not engage in the thread.\n2. Identify one trusted adult on each side (coach, pastor, auntie).\n3. Offer both groups something they want more than the beef: gym time, studio time, a paid gig.\n4. Separate conversations first, joint only if both agree.\n5. Never share names or screenshots outside the response room. Relay stores the request as a need, never as a list of people.`,
  },
  {
    id: "pb-eviction",
    title: "5-day eviction notice",
    tags: ["rent", "legal"],
    updatedAt: "2026-11-05",
    body: `1. A 5-day notice is not an eviction. The tenant has 5 days to pay or fix the issue before the landlord can file.\n2. Get the notice date and the amount. Refer same day to Tenant Legal Aid MKE for a right-to-counsel screening.\n3. Rental assistance: Milwaukee Housing Helpline can pledge directly to the landlord. Landlord must agree in writing to accept and halt.\n4. If a court date exists, the resident should attend even without a lawyer; a default judgment is the worst outcome.`,
  },
];
