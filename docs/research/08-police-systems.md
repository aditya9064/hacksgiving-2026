# 08 — What Police Departments Do (and Why Relay Is Different)

**Question:** NYPD and other big departments run coordination and data systems. Aren't they already doing this?

**Short answer:** They are doing the same *loop* (intake → dispatch → track → report), but **for enforcement, not for help**. Their systems track *incidents and suspects*. Nobody tracks whether a *resident got what they needed*. They cost $30K to $9M or more, and they are the reason residents call ComForce instead.

## The police toolkit

| System | Who | What it does | Worked ✅ | Went wrong ❌ |
| --- | --- | --- | --- | --- |
| **CompStat** | NYPD, 1994; now copied worldwide | Daily crime data plus weekly accountability meetings for commanders | Made data-driven management mainstream. Crime fell (causality is debated). | Pressure to show lower numbers led to **downgrading crime reports**. Fed stop-and-frisk. Civilian complaints rose. |
| **CAD/RMS** (computer-aided dispatch and records) | Every department (vendors include Hexagon, Mark43, Axon) | 911 intake, dispatch, incident records | Real-time unit coordination | **$30K–$150K for small departments. $750K–$9.1M for enterprise systems** (Ontario, CA: $9.1M). Arlington, TX pays $637K a year *just for maintenance*. |
| **Real-Time Crime Centers / Domain Awareness** | NYPD, Chicago, many others | Fuse cameras, license-plate readers, and sensors into a single view | Fast situational awareness | Surveillance concerns, cost, and no service outcome |
| **ShotSpotter** | **Milwaukee since 2010** (Districts 2, 3, 5, 7) | Acoustic sensors locate gunfire (about 80% of gunfire is never reported to 911) | Faster response to shootings | Mainly Black and Latino districts. Alerts can lead to random stops. MPD said there are **no plans to share it with residents**. |
| **Predictive policing: Chicago "heat list" (SSL)** | CPD, 2012–2019 | Scored people 0–500+ on their likelihood of shooting or being shot | — | Grew to **400,000+ people, including 56% of Black men in the city**. People on the list **got surveillance, not services**. Shut down in 2019 after the Inspector General reviewed it. |
| **Predictive policing: LAPD LASER / PredPol** | LAPD, to 2019 | Forecast person- and place-based hotspots | — | Shut down in 2019. The Inspector General could not isolate any impact. |
| **B-HEARD** (non-police mental-health response) | NYC, 2021– | EMTs and social workers dispatched through 911 | 6,884 patients engaged in FY25 | City audit: 60%+ of mental-health calls ruled ineligible, and **35% of eligible calls got no service**. The share of eligible calls assigned a unit fell from ~80% to 37%. |

## What this means for us

1. **The loop is proven; the purpose is the gap.** Police systems close the loop on *incidents* ("unit arrived, report filed"). No one closes the loop on *people* ("did the family get housed?"). That is Relay's lane.
2. **We are the opposite of the heat list.** Chicago scored people and gave them surveillance. Relay scores *requests* (need type, urgency) and gives people services. Use this contrast in the pitch. It shows the judges we know the history and the hackathon's hard rule.
3. **Cost gap.** Police CAD/RMS costs $750K–$9M. Relay costs about $15 a month. ComForce will never get CAD and doesn't need it.
4. **Trust is the asset.** ComForce is "sometimes on scene before first responders" because residents trust it more than police. A tool that feels like police tech would destroy that. **Nothing flows to law enforcement by default.**
5. **Borrow the good parts of CompStat:** a weekly review of *service* data (response times, unresolved cases) builds accountability. **Avoid its failure:** never tie staff evaluation to raw counts, because that invites gaming. Resident verification is our protection against downgraded numbers.
6. **B-HEARD shows tracking matters even for good programs.** NYC can only report that 35% of eligible calls went unserved *because* it tracks every call. ComForce has no such visibility today.

## Pitch line

> "Police departments spend millions closing the loop on *incidents*. Nobody closes the loop on *people*. Chicago tried scoring people and handed 400,000 residents surveillance instead of services. Relay scores *needs*, not people, and asks the resident whether help arrived."

## Sources

- CompStat: https://en.wikipedia.org/wiki/CompStat and https://www.ebsco.com/research-starters/social-sciences-and-humanities/compstat
- CAD/RMS pricing 2026: https://civiciq.com/blog/2026-public-safety-software-cad-rms-pricing-vendor-guide
- Chicago SSL and LAPD LASER: https://www.techpolicy.press/politicians-move-to-limit-predictive-policing-after-years-of-controversial-failures/
- Milwaukee ShotSpotter: https://shepherdexpress.com/news/features/milwaukee-police-use-shotspotter-technology-to-locate-gunsho/ and https://city.milwaukee.gov/ImageLibrary/Groups/mpdAuthors/SOP/745-SHOTSPOTTERGUNSHOTLOCATIONSYSTEM.pdf
- B-HEARD: https://mentalhealth.cityofnewyork.us/bheard-data and https://www.ibo.nyc.gov/assets/ibo/downloads/pdf/public-safety/2026/2026-january-from-dispatch-to-door-step.pdf
