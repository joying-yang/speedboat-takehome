- # Design rationale

> Rename to `design-rationale.md` before submitting. This is a required
> deliverable for the Mid/Junior track.

## Path chosen

 2 — Keys & Usage

## The decisions worth defending

Pick the 3–6 visual or interaction decisions you'd most want to walk a
reviewer through. For each: what you chose, what you considered, why
you landed where you did. Screenshots / sketches encouraged, even
rough ones.

### Decision 1 — Separate API Keys and Usage into focused views

- **What I chose:** I used two URL-addressable tabs inside one console shell. API Keys is the default view, while Usage remains directly accessible at /console/usage.
- ![alt text](<Screenshot 2026-11-19 at 10.50.25 AM.png>)
- **What else I considered:** A single dashboard combining everything. Below is an example in between where the usage graphs could potentially be embedded into each row.
![alt text](<Screenshot 2026-11-19 at 10.49.31 AM.png>)
- **Why this won:** It's more intuitive, especially for migrating a current work-flow that is divided into 3. It also separated key-management with usage views.
- **What I'd revisit with more time:** I think the idea of placing everything in one page could be interesting to explore more, but it would require a lot more careful planning.

### Decision 2 — Create key flow
- **What I chose:** Alerts, caps, scopes all configured in the key creation flow. The dialog cannot be accidentally dismissed until the user confirms that the secret was stored securely. Revocation separated. 
- **What else I considered:**  Closing allowed only after a successful clipboard copy, or using a generic confirmation dialog for revocation.
- **Why this won:** Allowed user to understand the functionalities of our API-key management system in one go.
- **What I’d revisit with more time:** Potential ways to make key-rotation easier. Improving organizatino of create flow. Removing alert + limit from workflow and making it edit only, with guiding text to point user toward it.

### Decision 3 — Set Monthly Cap Limit
- **What I chose:** Placing monthly cap limit into the API-key tab. 
- **What else I considered:** Placing it into the usage tab.
- **Why this won:** Separation of concerns (view vs editing). Same tab as per-key caps.
- **What I’d revisit with more time:** Having some entry points in the usage tab to guide towards the monthly cap feature.

## Where I extended the brand

[BRAND.md](BRAND.md) defines a small starter system. Anywhere you added
new tokens, new components, new patterns, or simplified the system —
list that here with the reason.

- Added a larger mono type.metric role for dashboard totals because the supplied typography scale did not include a prominent numeric style.
- Added mono.xs for compact technical metadata such as scope codes.
- Added semantic overlay and shadow tokens for dialogs, raised navigation, and tooltips without introducing another accent color.
- Added reusable DataTable, pagination, sortable-header, QueryStatePanel, IconButton, Tooltip, and WarningNotice patterns.

## Where I pushed back on the brand

If you changed a suggested decision (button shape, input shape, spacing
scale, palette), this is where you defend it.

- I did not materially change the palette, spacing scale, button shapes, field shapes, or type families.
- Used success and warning themes for graph colours even though it doesn't convey semantics because I think we are used to colours being just colours for graphs, and it helps make the graph more attention catching.

## States I designed for

The rubric weighs empty / loading / error states heavily. Confirm you
hit them, with a screenshot or short note for each.

- **Empty state:**
- **Loading state:**
- ![alt text](<Screenshot 2026-11-19 at 12.20.57 AM.png>)
- ![alt text](<Screenshot 2026-11-19 at 12.20.55 AM.png>)
- ![alt text](<Screenshot 2026-11-19 at 12.20.21 AM.png>)
- **Error state (e.g. 401, 429):**
- ![alt text](<Screenshot 2026-11-19 at 12.22.11 AM.png>)
- ![alt text](<Screenshot 2026-11-19 at 12.34.34 AM.png>)
- ![alt text](<Screenshot 2026-11-19 at 12.43.36 AM.png>)
- ![alt text](<Screenshot 2026-11-19 at 12.27.09 AM.png>)
- **Long-content / overflow state (if applicable):**
- ![alt text](<Screenshot 2026-11-19 at 12.31.18 AM.png>)
- **Mobile or narrow viewport (if applicable):
![alt text](<Screenshot 2026-11-19 at 12.33.36 AM.png>)
![alt text](<Screenshot 2026-11-19 at 12.33.44 AM.png>)

## Where AI helped, and where I chose against it

- **AI helped most when:**
  - Implementing feature code with well-defined instructions.
  - Exploring changes in UI quickly.
  - Learning frontend stack + conventions.
  - Test coverage.
- **AI's first draft I rejected:** (and what I did instead)
  - AI frequently came up with unideal designs when left with a little ambiguity. Collection of small things such as defaults, UX state flow didn't really make sense. For example, it added "Status" and "Scopes" columns to the API keys table initially, but instead I absorbed these columns into other ones to reduce dashboard clutter where unnecessary. It also made the flow for copying a key be undismissable unless you click the code icon. Also, code structural choices, such as separating styling and brand rules into properties to be used by classes. 
- **A choice I made that AI wouldn't have:**
  - I think the specific organizatian of functionalities into the usage and api key views are clearly separated intuitively. For example, set monthly account limit is put into api key view instead of under usage, where it's listed under in the README, which is an active choice I made to divide the two tabs into functionally "view only" behaviours and "edit" behaivours.

## What I'd do next

If this were going to production rather than a take-home, the next 1–2
moves I'd make on the design side:
- Collect dogfooding user feedback.
- Systematic and deterministic review of all design states.
