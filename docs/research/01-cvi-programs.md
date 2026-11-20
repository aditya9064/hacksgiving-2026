# 01 — Community Violence Intervention (CVI) Programs & Their Data Systems

How CVI programs worldwide handle data, coordination, and proving impact. What they got right, and where they went wrong.

> Source quality varies. Vendor or advocacy sources are flagged. Verify any number before putting it on a slide.

## Summary table

| Program | Where | What they did with data | Worked ✅ | Went wrong ❌ |
| --- | --- | --- | --- | --- |
| 414LIFE / Blueprint for Peace | Milwaukee | Hospital-based Cure Violence model. MCW evaluation geomapped events. | Geospatial "reach" tracking (82% of 2020 events had locations). Showed that 75% of referrals met criteria. | Phase 1 found **no statistically significant** reinjury difference against a weak historical comparison group. Outcome evidence was null, so funding is fragile. |
| Safe Streets | Baltimore | Cure Violence sites, evaluated by Johns Hopkins (2026) | −42% youth homicides, −21% youth nonfatal shootings | Huge per-site variance: 5 sites fell 37–100%, 2 sites **rose 46% and 89%**. Pooled averages hid failing sites. |
| Advance Peace | Richmond & Sacramento, CA | Peacemaker Fellowship, with a "LifeMAP" plan per fellow | −61% fatal and nonfatal assaults vs. a synthetic control (JAMA) | Tiny cohorts make effect sizes fragile. Depends on police identifying who is highest-risk. |
| READI | Chicago | RCT with 2,456 men. Participants found by **ML on arrest data**, outreach workers, and jail release screening. | **Outreach-referred** participants: −79% shooting/homicide arrests, −43% victimization | Algorithm-identified participants did no better. The headline result (p=0.13) was inconclusive. Only 55% started the program. |
| Crisis Management System | NYC | Credible messengers plus a service network, assessed by John Jay | Identified what evaluation readiness requires | No **common data standard** across providers, so outcomes could not be compared |
| GRYD | Los Angeles | ETO, then Apricot 360 (2022). Monthly dashboards shared with providers. | Providers see the **same dashboards** as the city, which builds trust. Built a feedback loop on dropout by zone. | Expensive enterprise vendors. *(Source is a sponsored vendor article.)* |
| Ceasefire + DVP | Oakland | Police-led identification, plus 12 months of life coaching | −43% homicides at its peak (NICJR) | City disinvested between 2019 and 2023. Staff fell from 32–40 to 16–20 and shootings went from 67 to 119. **Nobody tracked fidelity, so the decay went unnoticed until people died.** |
| Violence Reduction Unit | Scotland / Glasgow | Public-health, multi-agency data sharing since 2005 | Glasgow homicides −66% over 20 years | Took decades. Causal credit is debated. |
| Cardiff Model | Wales / UK | Hospital ED shares **anonymized, location-level** assault data with police and councils | Hospital admissions for violence fell (rate ratio 0.58 vs. comparison cities). Up to 75% of ED assaults were never reported to police. | Early numbers *rose* once reporting improved, which risks a false "failure" reading |
| CVI data hubs (Urban Institute) | Cleveland, Delaware | Mobile-first tools that work with low signal. Delaware used Power Apps for in-field case entry. | Removed manual steps that were causing data-quality problems | Microsoft and Azure tooling still needs IT capacity that grassroots groups lack |

## Key takeaways for us

1. **Human relationships beat algorithms** (READI). Do not score people. Support the outreach worker.
2. **Location-level, anonymized data is enough** to coordinate (Cardiff). Individual data is not needed for situational awareness.
3. **Fidelity data saves programs** (Oakland, Baltimore). Track *activity* such as mediations, responses, follow-ups, and staffing, not only citywide homicides.
4. **Shared dashboards build trust** (GRYD). Partners must see what funders see.
5. **A common data standard comes first** (NYC). Without it, nothing can be compared.
6. **Mobile and low-signal capture** (Cleveland, Delaware). Workers are in the field, not at desks.
7. **Null outcome results kill funding** (414LIFE, Oakland). Process and reach metrics are a nonprofit's lifeline.

## Sources

- Urban Institute, CVI data hubs: https://www.urban.org/catalyst-grant-program-insights/improving-community-violence-interventions-developing-data-hubs
- Urban Institute, CVIPI evaluation TA: https://www.urban.org/projects/community-violence-intervention-research-and-evaluation-support
- MCW, 414LIFE Phase 1 evaluation: https://www.mcw.edu/-/media/MCW/Departments/Comprehensive-Injury-Center/Injury-Reports/Phase-1-Evaluation-414LIFE_Final-Executive-and-Full-Report.pdf
- WMJ, 414LIFE reach: https://wmjonline.org/123no3/brandolino/
- JHU, Safe Streets 2026: https://hub.jhu.edu/2026/06/02/safe-streets-baltimore-reduced-youth-gun-violence/
- JAMA Network Open, Advance Peace: https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2853471
- Advance Peace Sacramento: https://www.mdpi.com/2413-8851/6/1/6
- READI: https://pmc.ncbi.nlm.nih.gov/articles/PMC10898100/ and https://www.nber.org/papers/w30852
- John Jay REC, NYC: https://johnjayrec.nyc/2023/11/10/designingsafety/
- GRYD (sponsored): https://insider.govtech.com/california/sponsored/data-informed-culture-and-program-management-software-fuels-impact-of-los-angeles-comprehensive-community-care
- Oakland: https://www.oaklandca.gov/files/assets/city/v/1/evidence-on-ceasefire-final-06.17.25.pdf and https://nicjr.org/files/galleries/Final-CF-Report-Oakland-01_24_(1).pdf
- Glasgow VRU (secondary source): https://glasgowhistory.co.uk/violence-reduction-unit
- Cardiff Model: https://orca.cardiff.ac.uk/id/eprint/15855/ and https://emj.bmj.com/content/30/12/1020
