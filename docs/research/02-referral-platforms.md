# 02 — Closed-Loop Referral Platforms

The brief asks us to "track whether people receive the help they need, while also noting who that help was delivered by." That is a closed-loop referral system. Several companies and governments have built one, with mixed results.

## Summary table

| Platform | Model | Cost | Worked ✅ | Went wrong ❌ |
| --- | --- | --- | --- | --- |
| **findhelp** (formerly Aunt Bertha) | Directory, referrals, and reporting | **$5,400 / $24,000 / $50,000 / $75,000+ per year** (public pricing) | Huge directory, and health systems pay for it | Out of reach for a grassroots nonprofit |
| **Unite Us** (NCCARE360 statewide in North Carolina since 2019) | Closed-loop e-referrals across 25,000+ organizations | Enterprise contracts paid by the state or payer (not public) | Statewide infrastructure. Users praise its tracking. | NC stakeholder memo: "does not use case numbers… allows more than one provider to receive the same referral… does not consistently save case notes", and duplicate or delayed payments to organizations *(advocacy source)*. G2 reviews: "biggest downside is getting other partners on board" and "multiple cases for one client." |
| **Free community e-referral platform** (peer-reviewed study, NE US city) | Free and open to all CBOs | $0 | — | **About 8 referrals a month after 4 years.** Training, reports, a hub, and a comms campaign all failed to raise usage. Reasons: existing processes were "good enough", staff already used other systems, staff disliked the tech, and too few receivers made the network thin. |
| **IMPACT 211** (SE Wisconsin) | Helpline, directory, and app across 9 counties | Free to residents | Trusted, comprehensive directory | Does information and referral, but no public evidence of **closed-loop** outcome tracking |
| **Open Referral HSDS** | Open data standard for service directories (v3.3) | Free and open | Lets directories interoperate, for example importing 211 data | It is a standard, not an application |

## The "referral black hole" problem

Across every platform, the same failures repeat:

1. **Nobody agrees what "closed" means.** One organization marks a referral closed when the service is delivered, another when the client declines, another when it gives up trying to reach them.
2. **Documentation lag.** Updates get logged days late, or never.
3. **Duplicate assignment.** Several providers get the same request and nobody owns it.
4. **Network thinness.** If receivers don't use the tool, senders stop using it.
5. **A new login portal nobody checks.** Adoption dies when the tool lives outside the channels workers already use.

## Takeaways for us

- Define a **small, fixed status vocabulary**: `new → claimed → in_progress → delivered | declined | unreachable | referred_out`, always with *who* and *when*.
- **Claim-to-own** prevents duplicates. One request has one owner at a time, and handoffs are explicit.
- **Meet workers in channels they already use** (SMS, WhatsApp, Messenger). The web dashboard is for coordinators only.
- **Deliver value on day one, alone.** ComForce must benefit even if no partner joins yet. The network effect is a bonus, not a prerequisite.
- **Ask the resident.** Platforms rely on providers to self-report closure. A follow-up text to the *resident* ("Did you get help? Reply 1 = yes, 2 = no") gives a verified outcome no other platform has.
- **Complement 211; don't compete with it.** Use HSDS so the IMPACT 211 directory could be imported.

## Sources

- findhelp pricing: https://company.findhelp.com/pricing/
- Unite Us reviews: https://www.g2.com/products/unite-us/reviews
- NC Unite Us feedback memo (advocacy): https://nsjonline.com/wp-content/uploads/2024/06/North-Carolina-1115-Unite-Us-feedback.pdf
- Closed-loop gaps (vendor blog): https://aigilxhealth.com/blog/closed-loop-referral-tracking-social-care-networks-2026/
- Adoption failure study: https://europepmc.org/article/pmc/10796276
- IMPACT 211: https://www.impactinc.org/impact-211/
- HSDS: https://docs.openreferral.org/en/v3.3.1/hsds/overview.html
