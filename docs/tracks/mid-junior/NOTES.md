# NOTES

> Rename to `NOTES.md` before submitting.

## Path chosen

 2 — Keys & Usage

## Total time spent

~8 hours.

## Stack

- **Frontend:** React
- **Local run command:** docker compose up --build -d
- **Hosting / preview URL, if any:** https://frontend-production-1943543c.up.railway.app/
- **Anything else worth naming:**

## AI tools used

Codex.

Relied on Codex GPT-5.6 Sol High heavily for the frontend. I used it to help me iterate and refine the code architecture and the design layout, and leaned on it heavily for generating the actual code for the frontend   
It got in the way when asked to implement features or make design decisions without explicit breakdowns or input from me.

## Three things I'm proud of

- Polish quality + robustness. I think the dashboard looks professional and behaves profesionally with robust handling of states.
- Engineering quality. I designed the frontend scaffolding to be cleanly organized into modularized features and with respect to architecturarl methodolgy that I think approprate for this project size.  
- Deployment was quite simple.

## What I cut

The cuts often tell us more than the inclusions.

- Per API-key row based inline graphs. Decided it was too cluttered and over-engineered for the dashboard.
- New backend logic for getting top-consumers table. Decided to follow the priority ordering for this project which puts emphasis on product-design rather than backend extensions so I just added some fake transformations for the usage data instead.

## What I'd do with more time

- Explore making time ranges' start and end configurable.
- Add notification simulation for alerts.
- Explore persistence options for thresholds and alerts.
- Specific API key -> usage chart investigation flow.
- Stretch goals.

## Anything you want a reviewer to know

I didn't touch much of the backend to focus on this track's priorities, but had a few things that I otherwise would've done.
- Implement backend filtering for model and key sorting and pagination.
- Implement GET and PATCH for spend limits and alert thresholds.
- The scoping options didn't map to Parasail's production scoping / access levels so I took a best guess at what the interactive logic for those would be.
## Feedback on this take-home (optional)
It's great!
