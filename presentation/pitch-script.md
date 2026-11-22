# Pitch script — word for word

This is the script to say aloud, in full sentences. The same words are in the deck: press **N** on any slide to see that slide's lines, or open the presenter view.

**Length: 402 words, written in plain sentences so someone who has never seen the app can follow. Your whole slot is 4:00 and the recording takes 1:49 of it, which leaves about 2:10 for talking, presses and the closing hand-off. All 13 slides take 2:52 at a normal speaking pace (140 words a minute) and 3:30 at a slow one (115), so as written this runs over.** Without slides 2, 4 and 5 it is 301 words: 2:09 normal, 2:37 slow. See "If you run long" at the end. Not yet timed aloud.

**→** means press once. Say the words before a **→**, press, then say the words after it. Slides 7, 8 and 9 play by themselves when you arrive, so there is nothing to press on them. Slide 10 is the recording: it starts by itself, full screen, the moment you arrive.

**Rehearse in the presenter view.** Open `slides/index.html?presenter`: the deck on the left, this script on the right with the line to say now in white, the clock, and how much time you should have left when you leave each slide. On the day, open the deck full screen on the projector and press **P**: the presenter view opens in a second window on your laptop and the two stay in step. The words live in one place in the deck (`const SCRIPT` in `slides/index.html`); change them there and here together.

---

## Before the demo

**Slide 1 — Title**

We're Team V, and this is Relay MKE. When a neighbor asks ComForce for help, Relay keeps one shared record of that request. And it is only finished when the resident says the help arrived.

**Slide 2 — About** *(press once, then speak)*

**→** Relay is three simple things. One phone number anyone can call, answered by Jordan, our AI assistant. One board where every ComForce division sees the same requests. And one report that shows funders the help was delivered.

**Slide 3 — Five problems**

You gave us five problem areas, from sharing information to training volunteers. **→** We built one screen for each. **→** And all five share one record, so nothing gets lost.

**Slide 4 — Problem 4 · the map**

For example, today leaders decide where to send help from what they happen to hear. **→** With Relay, a map of Milwaukee shows where help arrived, and where people are still waiting. **→** *(this is the real screen; say nothing and move on)*

**Slide 5 — Problem 5 · training**

Or take training. Today, when an experienced volunteer leaves, their know-how leaves too. **→** With Relay it is written down once, and a new volunteer can just ask a question and get the answer. **→** *(the real screen; move on)*

**Slide 6 — Guardrails**

And it is safe. Before the AI reads any message, **→** names, addresses and phone numbers are removed. **→** A person makes every decision. We never score or predict anyone, and everything you see is made-up test data.

**Slide 7 — The call** *(plays by itself)*

Now follow one request. A resident calls ComForce from any phone, no app needed. Jordan answers in English or Spanish, writes down what they need, and texts them a code to check on it.

**Slide 8 — The work** *(plays by itself)*

A ComForce worker sees it on the board right away, with the next steps already listed. Jordan phones a partner to arrange the help, and the volunteer gets clear directions: where to go and who to ask for.

**Slide 9 — The proof** *(plays by itself)*

But delivered is not the end. Relay texts the resident and asks, did the help arrive? If they don't answer, Jordan calls them back. The request only closes when the resident says yes. Now watch it for real. *(press **→**: the recording starts by itself, full screen, so finish the sentence before you press)*

**Slide 10 — Demo** *(the recording, 1 min 49 s; nothing to say unless you narrate)*

*(The slide is only the video. It starts on arrival and the clock pauses by itself. Press **→** when it ends. The recording stops as Jordan asks whether the help arrived; it does not show the resident's answer, and it has no sound after 0:41.)*

*(The recording carries its own captions. If the silence after 0:41 feels long, say one short line as each part appears, and nothing more: "The worker sees it on the board." · "They connect a partner, the pantry." · "The volunteer gets directions." · "And Jordan calls back to check.")*

---

## After the demo

**Slide 11 — Funder report** *(builds by itself, then one press)*

That request is now proof. Relay writes the funder report by itself, from ComForce's own records, including the times help did not arrive. **→** So when a funder asks, did the help really arrive, ComForce answers with what residents said.

**Slide 12 — Cost** *(press once, then speak)*

**→** Everything you just watched cost one dollar sixty-seven. **→** A whole year costs three hundred and thirty-six dollars. A commercial system costs over two hundred times more. And ComForce owns all of its data.

**Slide 13 — Closing** *(leave it up)*

**→** *(two hands meet and the view moves through them, about three and a half seconds; say the line over them, do not wait in silence)*

Care is not measured by how many we reach. It is measured by how many we don't lose. Thank you.

---

## What the judges asked for, and where you say it

| They asked | You say | Slide |
| --- | --- | --- |
| "Track whether people receive the help they need, while also noting who that help was delivered by" | "it is only finished when the resident says the help arrived" · "The request only closes when the resident says yes" · the recording itself | 1, 9, 10 |
| "Measure outcomes, and communicate their impact" (problem area 3) | "Relay writes the funder report by itself, from ComForce's own records, including the times help did not arrive… ComForce answers with what residents said." | 11 |
| Accessibility: "can frontline workers and community members use it easily?" | "One phone number anyone can call" · "from any phone, no app needed. Jordan answers in English or Spanish" | 2, 7 |
| Responsible technology; never identify or predict individuals; synthetic data only | "names, addresses and phone numbers are removed. A person makes every decision. We never score or predict anyone, and everything you see is made-up test data." | 6 |
| "Retain access to their own data" | "from ComForce's own records" · "And ComForce owns all of its data." | 11, 12 |
| Cost, "a heavy consideration" | "one dollar sixty-seven… three hundred and thirty-six dollars… over two hundred times more" | 12 |
| "Explain how your solution works to non-technical audiences" | No product names, no stack talk and no app jargon: "next steps" rather than tasks, "a code to check on it" rather than a tracking code, "made-up test data" rather than synthetic. | all |

---

## If you run long

Cut in this order; each is one slide and the deck still makes sense without it:

1. Slide 5, Problem 5 · training — not one of the four criteria. Saves 33 words and two presses.
2. Slide 4, Problem 4 · the map — the title already shows Milwaukee and slide 3 already shows this problem solved. Saves 31 words and two presses.
3. Slide 2, About — its three points (one number, one board, one report) are now the three journey slides and the funder slide. Saves 37 words. "In English or Spanish" is already in slide 7's line, so nothing is lost.

To hide a slide, add `data-skip` to its `<section>` tag in `slides/index.html`. To bring back the three hidden problem slides, the tech stack slide or the Benefits slide (it sat between the demo and Cost), delete `data-skip` from them.
