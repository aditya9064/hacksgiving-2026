# 04 — Disaster Relief, Mutual Aid & Low-Cost Field Tools

ComForce runs out-of-state relief deployments (MKE2TX, MKE2MS, MKE2NO) and local fire, displacement, and missing-person responses.

| Tool / effort | What it is | Worked ✅ | Went wrong ❌ |
| --- | --- | --- | --- |
| **Ushahidi** (Haiti 2010) | Crowdsourced SMS-to-map crisis reporting (shortcode 4636) | Paradigm shift. Thousands of volunteers built "the most complete map of humanitarian needs." | **Reports were mapped but never acted on.** People who texted for rescue sometimes got no help, and **were never told.** There were mistranslations, duplicates, inconsistent triage between volunteers, and no community control of data. |
| **Crisis Cleanup** | Free collaborative disaster **work-order** system for volunteer groups | Claimable work orders, less duplication, run by a very small team | Built for structured disaster cleanup, not interpersonal crisis or CVI |
| **COVID mutual aid networks** | Signal/WhatsApp chats plus spreadsheets or Airtable | Fast, free, in channels people already use. Encryption protected vulnerable neighbors. | Chaos at scale: messages get buried, nobody knows who has a request, nothing is measured |
| **KoboToolbox / ODK** | Open-source offline forms | Free, offline, fewer entry errors | "Free does not mean sustainable." It still needs training, maintenance, and governance. |

## Takeaways for us

1. **Visibility without action is harmful** (Ushahidi). Every request needs an owner and a reply back to the requester, *including* "we can't help, here's who can."
2. **The work-order model works** (Crisis Cleanup). A request is a ticket that can be claimed, tracked, and closed.
3. **Group chats are the status quo to beat.** Our tool must be *as easy as a group chat* but with ownership and memory.
4. **Plan for maintenance from day one.** Hackathon code that only the authors understand dies on Monday.

## Sources

- Ushahidi Haiti case study: https://communitymap.ca/textbook/part-ix-case-studies/case-study-disaster-response-mapping/
- Ushahidi evaluation (FR): https://journals.openedition.org/humanitaire/1306?lang=en
- Ushahidi self-deployment: https://link.springer.com/chapter/10.1007/978-3-032-11061-9_13
- Crisis Cleanup: https://www.crisiscleanup.org/disasters
- Mutual aid tech: https://civilsociety.dev/articles/mutual-aid-networks/ and https://www.alwaysreadyhq.com/9605/lessons-learned-from-mutual-aid-initiatives/
- KoboToolbox lessons: https://www.alternatives-humanitaires.org/en/2026/07/29/humanitarian-artificial-intelligence-begins-before-the-model-lessons-from-kobotoolbox-for-responsible-digital-commons/
