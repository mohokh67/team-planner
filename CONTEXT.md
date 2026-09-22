# Team Planner

A single-page capacity-planning tool: define a team's available capacity, list the work you want to do against it, and see how much fits.

## Language

**Plan**:
One capacity-planning exercise: a named, standalone set of people, a unit, and tickets. Identified by a UUIDv4. The unit of persistence and the unit of sharing.
_Avoid_: Project, board, session

**Unit**:
The single label (e.g. "days", "story points") chosen once per Plan that both People's capacity and Ticket/Subtask estimates are expressed in. Purely a display label; carries no conversion logic.
_Avoid_: Points, metric

**Person**:
A named team member within a Plan, holding one capacity figure in the Plan's unit.
_Avoid_: Member, resource

**Capacity**:
A Person's individual available amount, in the Plan's unit. Summed across all People to produce the Plan's total available capacity.
_Avoid_: Availability, velocity (velocity is the historical throughput metric this number is modeled on, but the app never computes or verifies it — it's just entered by hand)

**Ticket**:
A unit of work (epic, initiative, story, task — the distinction is not modeled) within a Plan. A Ticket is either a **leaf** (no Subtasks: carries its own estimate, checkbox, and color) or a **parent** (one or more Subtasks: its own estimate is ignored, and it carries no color).
_Avoid_: Item, issue, task (task is a valid free-text Type value, not the entity name)

**Subtask**:
A leaf child of a parent Ticket. Always a leaf: carries its own estimate, checkbox, and color. A Subtask cannot itself have children.
_Avoid_: Child ticket, sub-item

**Type**:
An optional free-text label on a Ticket (e.g. "epic", "story"). Cosmetic only — no behavior in the app reads or branches on it.
_Avoid_: Category, kind

**Estimate**:
The amount of work a leaf (Ticket or Subtask) carries, in the Plan's unit.
_Avoid_: Size, points, cost

**Checked**:
The state marking a leaf as committed/selected for the current allocation. A parent Ticket's checkbox is a derived bulk-toggle over its Subtasks' checked state (indeterminate when only some are checked), not an independent value.
_Avoid_: Selected, included, active

**Allocated**:
The sum of Estimates across all checked leaves in a Plan. Compared against total Capacity to determine what's left or over.
_Avoid_: Committed, used, spent

**Overflow**:
The condition where Allocated exceeds total Capacity. Rendered distinctly (red segment) rather than clamped, with the numeric remainder going negative.
_Avoid_: Overcommit, overbooked

**Read key**:
A Plan's UUID. Knowing it grants read access to that Plan's data. Carried in the URL and cached in localStorage.
_Avoid_: Plan ID (technically correct, but "read key" is the term when discussing the access model specifically)

**Edit token**:
A separate random secret per Plan, required for write access. Cached in localStorage and carried in the URL alongside the read key. Losing it (e.g. clearing browser storage without having saved the link) degrades that Plan to read-only for you.
_Avoid_: Auth token, API key (there is no authentication; this is a bearer secret, not an identity)
