# Idea Longlist

Eleven candidate directions, each scored in [evaluation-matrix.md](evaluation-matrix.md).

| ID | Idea | Track(s) | One-liner |
| --- | --- | --- | --- |
| A | **Neighborhood crime/needs dashboard** | Awareness | Maps of open data (WIBR, 311, ACS) by neighborhood |
| B | **Resource-finder chatbot** | Referrals | "Where can I get emergency shelter tonight?" answered over a 211-style directory |
| C | **Closed-loop request & referral tracker** | Referrals, Coordination | Request tickets with an owner, a status, and who delivered the help |
| D | **Text/voice-to-case AI intake** | Data collection | Messy texts and voice notes become structured, redacted case records |
| E | **Auto impact report for funders** | Impact | One click produces a grant-ready report with charts and narrative from real activity |
| F | **Rapid-response partner network** | Coordination, Training | Structured, claimable alerts to partner orgs and volunteers in place of chaotic group chats |
| G | **Missing Persons coordination kit** | Coordination | Family intake, flyer generator, search-zone assignment, tip line |
| H | **De-escalation training simulator** | Training | An AI role-play of tense scenarios with feedback for new volunteers |
| I | **Field Guide / knowledge base** | Training | Searchable AI assistant over ComForce playbooks ("first 24h of a missing person case") |
| J | **Disaster deployment logistics** (MKE2TX etc.) | Coordination | Donation, supply, volunteer and transport tracking for out-of-state relief |
| K | **Volunteer wellness / secondary-trauma check-ins** | Training | Burnout tracking for frontline workers |

## Predicted competitor ideas

Most teams will build **A** (a crime map) or **B** (a chatbot). Both are easy to start. Both are also weak on criteria:
A drifts toward surveillance optics and doesn't change any workflow. B duplicates IMPACT 211.

## Key insight

Ideas **C + D + E + F** are not four products. They are **four stages of one loop**, the loop every ComForce division already runs:

```
INTAKE  →  COORDINATE  →  DELIVER  →  VERIFY  →  REPORT
  (D)         (F)           (C)        (C)        (E)
```

So the winning move is one engine with one loop, configured for all eight divisions, with G, I, and J as *templates* on top of the engine rather than separate apps.
