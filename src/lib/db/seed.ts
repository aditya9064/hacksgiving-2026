import type { ActivityEvent, HelpRequest, Partner, Playbook, Status, Need, Urgency } from "../types";

// STORM REPLAY + EVERYDAY MIX: FEMA DR-4923 (severe storms, tornadoes and flooding, Apr 13–23, 2026).
// Every resident, story, name and dollar amount below is fictional. What is real: the neighborhoods
// (City of Milwaukee polygons) and where they sit, which comes from public aggregates cached by
// tools/storm-data/pull.mjs into data/public/dr4923-milwaukee.json:
//   - FEMA housing-assistance registrations by ZIP (53218, 53209, 53216, 53206, 53210 hit hardest)
//   - MFD Fire/Rescue calls per neighborhood during the storm vs. the six weeks before
//   - MFD 2023 building fires per neighborhood
// Storm requests are mixed with house fires (MFD 2023 building fires) and everyday requests.
// Card times stay relative to "now" so the board replays the storm as if it were happening live.

export const SEED_PARTNERS: Partner[] = [
  { id: "p-comforce", name: "ComForce MKE", needs: ["mediation", "safety", "youth", "other"], neighborhoods: ["Sherman Park", "Harambee", "Amani", "Franklin Heights", "Old North Milwaukee"], capacity: 6, hours: "24/7 rapid response", verifiedAt: "2026-11-19T12:00:00Z" },
  { id: "p-disaster", name: "ComForce Disaster Relief", needs: ["housing", "food", "other"], neighborhoods: ["Citywide"], capacity: 8, hours: "24/7 during declared disasters", verifiedAt: "2026-11-20T06:00:00Z" },
  { id: "p-cleanup", name: "Northside Muck-Out Crew", needs: ["housing", "other"], neighborhoods: ["Old North Milwaukee", "Silver Spring", "Hampton Heights", "Lincoln Creek", "Thurston Woods", "Arlington Heights"], capacity: 7, hours: "Daily 7am–7pm", verifiedAt: "2026-11-20T07:00:00Z" },
  { id: "p-pantry", name: "Northside Community Pantry", needs: ["food"], neighborhoods: ["Sherman Park", "Garden Homes", "Rufus King", "McGovern Park"], capacity: 14, hours: "Tue–Sat 10–4", verifiedAt: "2026-11-18T15:00:00Z" },
  { id: "p-housing", name: "Milwaukee Housing Helpline", needs: ["rent", "housing", "legal"], neighborhoods: ["Citywide"], capacity: 3, hours: "Mon–Fri 9–5", verifiedAt: "2026-11-17T09:00:00Z" },
  { id: "p-energy", name: "Keep the Lights On Fund", needs: ["utilities"], neighborhoods: ["Citywide"], capacity: 8, hours: "Mon–Fri 9–6", verifiedAt: "2026-11-19T08:00:00Z" },
  { id: "p-clinic", name: "Westside Free Clinic", needs: ["health"], neighborhoods: ["Washington Park", "Concordia", "Midtown", "Uptown", "Rufus King"], capacity: 5, hours: "Mon/Wed/Fri 8–2", verifiedAt: "2026-11-16T10:00:00Z" },
  { id: "p-rides", name: "Ride Share Collective", needs: ["transport"], neighborhoods: ["Citywide"], capacity: 10, hours: "Daily 6am–10pm", verifiedAt: "2026-11-19T07:00:00Z" },
  { id: "p-youth", name: "Harambee Youth Hub", needs: ["youth", "mediation"], neighborhoods: ["Harambee", "Riverwest", "Sherman Park"], capacity: 4, hours: "Mon–Fri 2–8", verifiedAt: "2026-11-15T13:00:00Z" },
  { id: "p-legal", name: "Tenant Legal Aid MKE", needs: ["legal", "rent"], neighborhoods: ["Citywide"], capacity: 2, hours: "Tue/Thu 10–4", verifiedAt: "2026-11-12T13:00:00Z" },
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

// Source tags: [STORM] FEMA DR-4923 ZIP registrations / MFD storm-window Fire/Rescue spike
// [FIRE23] MFD 2023 building fires per neighborhood · [EVERYDAY] rent, utilities, health, rides
// [CORE] ComForce violence-prevention and reentry work. Mixed and shuffled on purpose.
const DISASTER: [string, string, string] = ["Marcus T.", "ComForce Disaster Relief", "p-disaster"];
const SEEDS: SeedReq[] = [
  // [STORM 53209][MFD] Old North Milwaukee Fire/Rescue 3.6/day during the storm vs 1.95 before
  { text: "Basement took 3 feet of water overnight, furnace and water heater are under. Me and my 2 kids, my son has asthma and it already smells. Near Teutonia and Villard.", summary: "Flooded basement, no heat or hot water, child with asthma", needs: ["housing", "health"], urgency: "critical", hood: "Old North Milwaukee", status: "new", ageMin: 6, household: 3 },
  // [CORE]
  { text: "My neighbor and I keep getting into it over the parking, last night it almost got physical. Can somebody come talk to us before it gets worse", summary: "Escalating neighbor dispute, requests mediation before it turns physical", needs: ["mediation", "safety"], urgency: "critical", hood: "Harambee", status: "new", ageMin: 14 },
  // [EVERYDAY]
  { text: "We Energies says shutoff is Monday. I'm $210 behind. Single mom, I work but hours got cut.", summary: "Utility shutoff Monday, $210 behind", needs: ["utilities"], urgency: "high", hood: "Metcalfe Park", status: "new", ageMin: 31, household: 3 },
  // [STORM 53218][MFD] Hampton Heights Fire/Rescue 0.9/day during the storm vs 0.36 before
  { text: "Tree went through the back of the house during the tornado warning, part of the roof is open and there's a line down in the yard. Fire department taped it off. Where do we sleep tonight?", summary: "Tree through roof, line down, family of 4 needs shelter tonight", needs: ["housing", "safety"], urgency: "critical", hood: "Hampton Heights", status: "new", ageMin: 48, household: 4 },
  // [EVERYDAY]
  { text: "Landlord gave me a 5 day notice. I have the money on the 1st but not now. [name], [phone]", summary: "5-day eviction notice, can pay on the 1st", needs: ["rent", "legal"], urgency: "critical", hood: "Clarke Square", status: "claimed", owner: ["Keisha R.", "Milwaukee Housing Helpline", "p-housing"], ageMin: 55, household: 2 },
  // [STORM 53218]
  { text: "I'm 72 and I can't carry the wet carpet and drywall out of the basement by myself. City says put it on the curb.", summary: "Senior needs basement muck-out after flooding", needs: ["housing", "other"], urgency: "high", hood: "Silver Spring", status: "claimed", owner: ["Luis P.", "Northside Muck-Out Crew", "p-cleanup"], ageMin: 80, household: 1 },
  // [CORE]
  { text: "My son's been getting threats at school and now online. He's 15. I don't want this to turn into something", summary: "Teen receiving threats at school and online, parent wants intervention", needs: ["youth", "safety", "mediation"], urgency: "high", hood: "Amani", status: "claimed", owner: ["Marcus T.", "ComForce MKE", "p-comforce"], ageMin: 120 },
  // [FIRE23] Lincoln Village: 17 building fires in 2023, second most in the city
  { text: "House fire on our block last night, family of 5 lost everything, staying in their car", summary: "Family of 5 displaced by fire, sleeping in car", needs: ["housing", "food", "other"], urgency: "critical", hood: "Lincoln Village", status: "in_progress", owner: DISASTER, ageMin: 200, household: 5 },
  // [STORM 53209]
  { text: "My dad's blood pressure meds and his CPAP got ruined when the basement flooded. Pharmacy says it's too early to refill.", summary: "Senior's BP meds and CPAP lost in flood, refill refused", needs: ["health"], urgency: "high", hood: "Rufus King", status: "in_progress", owner: ["Dr. Patel", "Westside Free Clinic", "p-clinic"], ageMin: 300 },
  // [EVERYDAY]
  { text: "Need a ride to my dialysis Thursday 7am, my usual ride fell through", summary: "Ride needed for dialysis Thursday 7am", needs: ["transport", "health"], urgency: "high", hood: "Washington Park", status: "in_progress", owner: ["Dee L.", "Ride Share Collective", "p-rides"], ageMin: 420 },
  // [STORM 53206][MFD][FIRE23] Franklin Heights Fire/Rescue 1.9/day during the storm vs 0.7 before; 16 building fires in 2023
  { text: "Fire last night started in the basement after the water got to the electrical panel. Family of 4 is out, staying with a cousin on the couch.", summary: "Family of 4 displaced by electrical fire after flooding", needs: ["housing", "other"], urgency: "critical", hood: "Franklin Heights", status: "in_progress", owner: DISASTER, ageMin: 600, household: 4 },
  // [STORM 53209]
  { text: "Grandma's food all went bad in the outage and she can't get to the store with her hip.", summary: "Grocery delivery for homebound senior after outage", needs: ["food"], urgency: "normal", hood: "Garden Homes", status: "delivered", owner: ["Tasha B.", "Northside Community Pantry", "p-pantry"], ageMin: 900, household: 1 },
  // [EVERYDAY]
  { text: "Behind $800 on rent after my hours got cut. Trying to avoid eviction", summary: "$800 rent arrears, avoiding eviction", needs: ["rent"], urgency: "high", hood: "Walker's Point", status: "delivered", owner: ["Keisha R.", "Milwaukee Housing Helpline", "p-housing"], ageMin: 1300 },
  // [CORE]
  { text: "Two groups of young guys keep posting at each other and it's about to pop off this weekend", summary: "Online beef between two youth groups, risk of weekend violence", needs: ["safety", "mediation", "youth"], urgency: "critical", hood: "Harambee", status: "delivered", owner: ["Vaun M.", "ComForce MKE", "p-comforce"], ageMin: 1500 },
  // [STORM 53209][MFD] Fairfield Fire/Rescue 1.2/day during the storm vs 0.3 before
  { text: "Car flooded out on the street. Need rides to work for two weeks until insurance pays.", summary: "Rides to work for 2 weeks, car lost to flooding", needs: ["transport"], urgency: "normal", hood: "Fairfield", status: "delivered", owner: ["Dee L.", "Ride Share Collective", "p-rides"], ageMin: 1700 },
  // [STORM 53218]
  { text: "Pantry bag please, family of 5. We lost everything in the fridge and freezer when the power went.", summary: "Pantry support for family of 5 after power loss", needs: ["food"], urgency: "normal", hood: "McGovern Park", status: "verified", owner: ["Tasha B.", "Northside Community Pantry", "p-pantry"], ageMin: 2600, household: 5, feedback: "yes" },
  // [EVERYDAY]
  { text: "Landlord won't fix the heat, it's 52 degrees inside with a baby", summary: "No heat with infant in home, landlord unresponsive", needs: ["housing", "legal"], urgency: "critical", hood: "Riverwest", status: "verified", owner: ["Ana G.", "Tenant Legal Aid MKE", "p-legal"], ageMin: 3000, household: 3, feedback: "partial" },
  // [CORE]
  { text: "My brother just got out and needs ID, a phone and somewhere to stay or he'll end up back with the old crowd", summary: "Reentry support: ID, phone, housing", needs: ["housing", "other", "safety"], urgency: "high", hood: "Amani", status: "verified", owner: ["Marcus T.", "ComForce MKE", "p-comforce"], ageMin: 4000, feedback: "yes" },
  // [STORM 53206 renters, major damage]
  { text: "Sewage backed up into the basement in the storm and the landlord won't pump it out. We have a baby.", summary: "Sewage backup, landlord won't remediate, infant in home", needs: ["housing", "legal"], urgency: "critical", hood: "North Division", status: "verified", owner: ["Ana G.", "Tenant Legal Aid MKE", "p-legal"], ageMin: 5200, household: 3, feedback: "yes" },
  // [FIRE23] Uptown: 14 building fires in 2023
  { text: "Kitchen fire last month, Red Cross put us up for 3 nights. Now I need a security deposit for a new place.", summary: "Security deposit needed after kitchen fire displacement", needs: ["housing", "rent"], urgency: "high", hood: "Uptown", status: "verified", owner: ["Keisha R.", "Milwaukee Housing Helpline", "p-housing"], ageMin: 7000, household: 2, feedback: "yes" },
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
