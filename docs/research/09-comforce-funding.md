# How ComForce MKE gets its money — and why that is the real problem

Researched 2026-11-21. Sources linked inline. Purpose: decide what a "grants" feature in Relay MKE must do to be useful to ComForce rather than generically impressive.

## 1. Where the money comes from today

| Channel | What we know | Source |
| --- | --- | --- |
| **City of Milwaukee contract** (Dept. of Community Wellness & Safety, via **MKE Promise Keepers**) | ComForce has been a Promise Keepers "branch" for ~4 years. This is the only known *recurring* money; it funds a paid role for Vaun Mayes. Promise Keepers works designated "Promise Zones" (areas of concentrated violence). | [Carvd N Stone, Oct 2026](https://carvdnstone.com/comforce-mke-team-unified-and-milwaukees-critical-response-team-continue-making-a-difference-in-communities-impacted-by-violence-through-city-partnership/) |
| **Ad-hoc fundraising** | Raising funds for emergency shelter, annual door-to-door Christmas gift drive, disaster deployments (MKE2TX/MS/NO). Episodic, cause-by-cause. | same |
| **Individual donations** | The website's "Donate Now" button links to the **contact form** — there is no payment path (no PayPal/Cash App/Givebutter, no tax-receipt language). | [comforcemilwaukee.com](https://comforcemilwaukee.com/) — `<a class="btn btn-red" href="/contact">Donate Now</a>` |
| **Own 501(c)(3)?** | No IRS record under "Community Task Force MKE" or "ComForce" (ProPublica Nonprofit Explorer, 2026-11-21). Vaun's earlier org *Program the Parks MKE* (EIN 82-5043035) is a 501(c)(3) with no filed financial data. → ComForce most likely operates **unincorporated or through a fiscal sponsor**, which locks it out of most foundation grants that require 501(c)(3) status and a 990. | ProPublica API |

Vaun Mayes, on the record: *"We've been operating on minimum funding, but we have still shown up to do good work."*

**Bottom line: ComForce is essentially a one-funder organization, and that funder is in trouble.**

## 2. The funder is in trouble

- DCWS (formerly Office of Violence Prevention) received **$5.1M in grant allocations in 2024**, most of it **ARPA** (federal COVID relief) that **runs out in 2026**. Interim director Karin Tyler, April 2025: *"Some of our funding will be ending this year, and some will go into 2026, but not many. It's pretty critical for our office to find other resources."*
- Federal cuts: the White House Office of Gun Violence Prevention was eliminated; SAMHSA and Dept. of Labor grants are uncertain/delayed.
- The office has had **three directors since 2021**, a city **audit** found it did not pay partners on time, and Ald. Michael Murphy publicly **"called for proof that its programs were working."** The office responded by **hiring an epidemiologist** and now reports numbers like *"Critical Response Teams responded to 311 incidents, 76% required follow-up, 1,000+ hours."*

Source: [Milwaukee NNS, Apr 2025](https://milwaukeenns.org/2025/04/23/funding-uncertainties-put-future-of-the-office-of-community-wellness-and-safety-in-jeopardy/)

Implication: every dollar ComForce gets from the City is downstream of DCWS proving *its* outcomes to the Common Council. Partners who hand DCWS clean, cluster-level outcome data make the office's case for it — and become the partners it keeps when the budget shrinks.

## 3. What the money is moving toward (the live opportunities)

| Opportunity | What it wants from partners | Why Relay fits |
| --- | --- | --- |
| **City DCWS — "This Is Our City: The Countdown"** (launched Oct 2026) | Partners commit *dates and places* to bring resources into **26 named incident clusters** (e.g. 23rd & Locust, 25th & Capitol, 11th & Atkinson…) where **88.5% of homicide victims** fall. Sign-up is a **Microsoft Form**; progress tracked on an "action calendar". Theory of change: resources + engagement in clusters → protective factors → fewer shootings. | Relay already geocodes every request. Tagging each one to a cluster and reporting "resources delivered inside cluster N, resident-verified" is exactly the evidence the campaign needs and nobody else will produce. [Carvd N Stone, Oct 2026](https://carvdnstone.com/city-of-milwaukee-launches-this-is-our-city-the-countdown-to-mobilize-community-partners-in-26-areas-impacted-by-violence/) |
| **Milwaukee County DHHS — "Destined for Greater"** (June 2026) | $1.5M state money to connect residents in high-need neighborhoods to jobs, housing, mental health, CVI. Explicit goal: orgs *"connect residents to needed services even when they cannot provide those services themselves."* Partners get funded for referral + follow-through. | That sentence *is* Relay's dispatch + closed-loop model. [Milwaukee NNS, Jun 2026](https://milwaukeenns.org/2026/06/25/backed-by-state-funding-local-groups-collaborate-to-strengthen-violence-prevention-efforts/) |
| **Wisconsin Office of Violence Prevention grants** (state, Gov. Evers) | $15M total; **460 applications, 73 funded (~16%)**; awards $5K–$1.5M; five categories incl. "evidence-based violence intervention and outreach." | Competitive — data wins. [State Affairs, Mar 2026](https://pro.stateaffairs.com/wi/press-releases/milwaukee-county-executive-crowley-announces-1-8-million-grant-from-the-state-of-wisconsin-for-violence-prevention) |
| **Private Milwaukee funders** that back grassroots safety/neighborhood work | Greater Milwaukee Foundation, Zilber Family Foundation (neighborhood initiatives), Bader Philanthropies, Northwestern Mutual Foundation (Amani / Metcalfe Park), Milwaukee Bucks Foundation, Brewers Community Foundation, Potawatomi Foundation, MCW Advancing a Healthier Wisconsin. Nearly all require **501(c)(3) or a fiscal sponsor**, a budget, a logic model, and **outcome reporting**. | Relay can produce the outcome half; the legal half is a to-do for ComForce (fiscal sponsor). |

## 4. What ComForce does right (from a funder's point of view)

1. **Trust and speed** — residents call them directly; they are "occasionally there before first responders." That is the asset every CVI funder is trying to buy and cannot manufacture.
2. **Breadth** — eight divisions covering intake, missing persons, disaster, youth, legal, extraction. Maps onto several funding categories at once (CVI, disaster, youth, housing).
3. **Credible messenger leadership** — Vaun's lived experience and public profile. Funders in this space explicitly prioritize this.
4. **Already inside the system** — four years as a DCWS partner means vendor paperwork, background checks, and a track record exist.

## 5. What is going wrong (and is fixable)

| Problem | Evidence | Cost to ComForce |
| --- | --- | --- |
| **Impact is asserted, not evidenced.** "10K+ residents served, 75+ initiatives" with no method, no period, no verification. | Website; no reports published anywhere. | Fails the exact test the Common Council is applying to DCWS. Cannot answer "how many of those got help?" |
| **Single funder, and that funder is ARPA-dependent.** | §2. | Existential risk in 2026–27. |
| **No donation path.** "Donate Now" → contact form. No recurring giving, no tax receipt, no year-end appeal. | Site HTML. | Leaves the cheapest money (small recurring donors during news moments) on the table. |
| **Probably no 501(c)(3)** (or it is not findable). | ProPublica. | Locked out of most foundation grants; cannot receive DAF gifts; corporate matches fail. |
| **Reporting happens from memory.** Intake is a web contact form + Facebook + phone; nothing records outcomes, times, or places. | Site stack (PHP/MySQL contact form). | Every grant report is a weekend of reconstruction; numbers are unverifiable; staff time is burned on paperwork rather than response. |
| **Fundraising is episodic and personal.** GoFundMes for specific crises (including for Vaun's own family after a fire and hit-and-run, July 2026). | [GoFundMe](https://www.gofundme.com/f/support-vauns-family-after-house-fire) | Donor fatigue, no institutional giving relationship, founder dependency. |
| **Not aligned to the funder's geography.** DCWS now talks in 26 clusters; ComForce talks in neighborhoods and divisions. | §3. | Harder for DCWS to credit ComForce's work in its own reporting. |

## 6. What would actually make their work easier

Ranked by (impact on money) × (how much Relay can do about it this weekend):

1. **Make the evidence a by-product of doing the work.** If every call Jordan takes, every dispatch, every delivery and every resident-verified outcome is already recorded with time, place and partner, then a grant report is a button, not a weekend. *(Relay already does this. We need to surface it in the funder's language.)*
2. **Speak the funder's geography.** Tag requests to DCWS's 26 Countdown clusters and to Promise Zones; report "resources delivered inside clusters, verified by the resident." Pre-fill the Countdown action-calendar commitments from actual activity.
3. **Mirror the funder's own metric.** DCWS reports *incidents responded / % needing follow-up / hours*. Relay can report the same three numbers for ComForce, plus one DCWS cannot: *% confirmed by the resident*.
4. **Diversify with as little new work as possible.** Match ComForce's real activity mix to the 5–8 live funders above, draft the Statement of Need / Outcomes / Evaluation sections from live data, and list what is missing (fiscal sponsor, budget) so a volunteer can close the gaps.
5. **Turn moments into donors.** A working donate link + a one-line "this week we verified help for N households" impact line is cheap, but it is outside the hackathon brief; note it as a recommendation in the pitch rather than building it.

## 7. Caveats

- We have not spoken to ComForce about their books. Everything above is from public sources and the IRS database; ComForce may well have a fiscal sponsor or be filing under another name. The pitch should say "publicly, we could not find…" and ask, not assert.
- Funder names in §3 are plausible fits based on their published priorities, not confirmed open RFPs. Deadlines must be verified before anyone applies.
