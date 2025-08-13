# Kaia Peacock Takehome

Live url - [https://d0cc028ac3c4.ngrok-free.app/](https://d0cc028ac3c4.ngrok-free.app/)

This is a take on a moderation system where I set up a small language model to flag comments, and implemented a basic shadowbanning system, where the poster will not see that their post has been moderated.

## Assumptions and technical considerations

One of the key lessons that I've learned from existing social media platforms is that most Abuse, and harassment is low effort. People do not engage diligently, and Just want to express themselves in someway. Shadow banning is in underrated tool, and it can be used to reduce the harm that comes to moderators, content, creators, and particularly to minority groups, such as women, people of color, LGBTQIA plus, or other minority statuses.

I have been hearing about how smaller language models can be used to do lighter work, wear large language models are overkill and computationally expensive. I wanted to attempt to use a smaller language model, and that had some degree of success. Given the time constraints, I relied on a cursor agent to help with setting up the database, installing the language model, and preparing it for deployment on digital ocean.

## Where I got

This is a somewhat functional application. It displays a single comment section, where the user can toggle among pre-seeded users, And see what the application looks like as each of them. There is also an admin panel where you can review flagged comments, or manually flag them yourself. The users will only be able to see content that the backend permits them to see, and does not indicate to them in any way that their content has been moderated. This is accomplished using next JS and cookie based sessions.

At some point during development, I was able to successfully get the AI to moderate some generic xenophobic comments, but that does not seem to be working after setting it up and deploying it. More work could yield better results certainly, but I would probably look to a more established moderation API.

The application includes a suite of end-to-end tests, ensuring the functionality of the website. I'm fairly pleased with the bones of what I produced in the time allotted.

## What app metrics would be useful

- Engagement: DAU/WAU, sessions per user, time to first comment, pages per session
- Creation: comments per user/day, submission success rate (client submit → saved)
- Moderation quality: auto‑flag rate, manual flag/unflag rate, false‑positive rate (auto‑flag → later unflag), moderation latency/timeout/error rate, category mix
- Content visibility: % hidden, median time hidden, time‑to‑unflag
- Funnel: view → type → submit → moderated → visible (drop‑off at each step)
- System health: API latency p50/p95 for moderation, 4xx/5xx rates on key routes

Instrumentation (minimal, privacy‑aware):
- Add an `Event` table with fields: `id`, `userId`, `type`, `properties` (JSON), `createdAt`
- Create a tiny `trackEvent(userId, type, properties)` helper and call it in server actions:
  - `addComment`: `comment_submitted`, `comment_saved`, then `moderation_result {flag,status,category,latencyMs}`
  - `flagComment`/`unflagComment`: `comment_flagged_manual` / `comment_unflagged`
  - `moderateCommentWithSLM`: log latency, errors (`moderation_error`), and decision
- Optional: lightweight page views via a `/api/events` endpoint or a tool like Plausible/PostHog
- Do not store raw comment text; record safe metadata like `contentLength`, flags, status, and timing only

This could be tied into an existing dashboard that the customers are already integrated with, or could be delivered as a standalone experience within the admin view


## Setup instructions

You can set this up using either docker using the makefile in /deploy, or you can manually run the application running `npm run dev` and `./slm-api/start.sh`

I don't recommend running this yourself though because the model takes up a bunch of space and you'll have to clean up after.
