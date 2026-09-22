// The plan store: the single seam for Plan domain logic.
// Pure functions only — no React, no Supabase, no browser storage.
// Every business rule (rollup, overflow, leaf-only coloring) lives here.

export interface Person {
  id: string;
  name: string;
  capacity: number;
}

export interface Subtask {
  id: string;
  label: string;
  estimate: number;
  color: string;
  checked: boolean;
}

export interface Ticket {
  id: string;
  label: string;
  type: string;
  estimate: number;
  color: string;
  checked: boolean;
  subtasks: Subtask[];
}

export interface Plan {
  id: string;
  name: string;
  unitLabel: string;
  editToken: string;
  people: Person[];
  tickets: Ticket[];
}

export type LeafRef = { ticketId: string; subtaskId?: string };

export interface LeafItem {
  ticketId: string;
  subtaskId?: string;
  label: string;
  estimate: number;
  color: string;
  checked: boolean;
}

export type ParentCheckState = "checked" | "unchecked" | "indeterminate";

// Fixed-order categorical defaults (dataviz skill: validated 8-hue order, never cycled
// within a single legend — here it seeds new leaf items before the user overrides it).
const DEFAULT_COLORS = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

function randomId(): string {
  return crypto.randomUUID();
}

function randomToken(length = 24): string {
  const bytes = new Uint8Array(length / 2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function isLeafTicket(ticket: Ticket): boolean {
  return ticket.subtasks.length === 0;
}

function mapTicket(
  plan: Plan,
  ticketId: string,
  fn: (ticket: Ticket) => Ticket,
): Plan {
  return {
    ...plan,
    tickets: plan.tickets.map((t) => (t.id === ticketId ? fn(t) : t)),
  };
}

// ---- Plan-level ----

export function createPlan(name: string): Plan {
  return {
    id: randomId(),
    name,
    unitLabel: "",
    editToken: randomToken(),
    people: [],
    tickets: [],
  };
}

export function renamePlan(plan: Plan, name: string): Plan {
  return { ...plan, name };
}

export function setUnitLabel(plan: Plan, unitLabel: string): Plan {
  return { ...plan, unitLabel };
}

// ---- People ----

export function addPerson(plan: Plan, name: string, capacity: number): Plan {
  const person: Person = { id: randomId(), name, capacity };
  return { ...plan, people: [...plan.people, person] };
}

export function removePerson(plan: Plan, personId: string): Plan {
  return { ...plan, people: plan.people.filter((p) => p.id !== personId) };
}

export function updatePerson(
  plan: Plan,
  personId: string,
  patch: Partial<Pick<Person, "name" | "capacity">>,
): Plan {
  return {
    ...plan,
    people: plan.people.map((p) =>
      p.id === personId ? { ...p, ...patch } : p,
    ),
  };
}

// ---- Tickets ----

export function addTicket(plan: Plan, label: string, estimate = 0): Plan {
  const ticket: Ticket = {
    id: randomId(),
    label,
    type: "",
    estimate,
    color: DEFAULT_COLORS[leafItems(plan).length % DEFAULT_COLORS.length],
    checked: false,
    subtasks: [],
  };
  return { ...plan, tickets: [...plan.tickets, ticket] };
}

export function removeTicket(plan: Plan, ticketId: string): Plan {
  return { ...plan, tickets: plan.tickets.filter((t) => t.id !== ticketId) };
}

export function updateTicket(
  plan: Plan,
  ticketId: string,
  patch: Partial<Pick<Ticket, "label" | "type" | "estimate">>,
): Plan {
  return mapTicket(plan, ticketId, (t) => ({ ...t, ...patch }));
}

// ---- Subtasks ----

export function addSubtask(
  plan: Plan,
  ticketId: string,
  label: string,
  estimate = 0,
): Plan {
  return mapTicket(plan, ticketId, (t) => {
    const subtask: Subtask = {
      id: randomId(),
      label,
      estimate,
      color: DEFAULT_COLORS[leafItems(plan).length % DEFAULT_COLORS.length],
      checked: false,
    };
    return { ...t, subtasks: [...t.subtasks, subtask] };
  });
}

export function removeSubtask(
  plan: Plan,
  ticketId: string,
  subtaskId: string,
): Plan {
  return mapTicket(plan, ticketId, (t) => ({
    ...t,
    subtasks: t.subtasks.filter((s) => s.id !== subtaskId),
  }));
}

export function updateSubtask(
  plan: Plan,
  ticketId: string,
  subtaskId: string,
  patch: Partial<Pick<Subtask, "label" | "estimate" | "color">>,
): Plan {
  return mapTicket(plan, ticketId, (t) => ({
    ...t,
    subtasks: t.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, ...patch } : s,
    ),
  }));
}

// ---- Checking / coloring (leaf-only rule enforced here) ----

/** Toggles a leaf: a subtask if subtaskId is given, otherwise the ticket
 * itself (only meaningful when it's a leaf) or, for a parent ticket, a bulk
 * toggle of all its subtasks. */
export function toggleChecked(plan: Plan, ref: LeafRef): Plan {
  return mapTicket(plan, ref.ticketId, (t) => {
    if (ref.subtaskId) {
      return {
        ...t,
        subtasks: t.subtasks.map((s) =>
          s.id === ref.subtaskId ? { ...s, checked: !s.checked } : s,
        ),
      };
    }
    if (isLeafTicket(t)) {
      return { ...t, checked: !t.checked };
    }
    const target = !t.subtasks.every((s) => s.checked);
    return {
      ...t,
      subtasks: t.subtasks.map((s) => ({ ...s, checked: target })),
    };
  });
}

/** Leaf-only coloring rule: a no-op when aimed at a parent ticket. */
export function setColor(plan: Plan, ref: LeafRef, color: string): Plan {
  return mapTicket(plan, ref.ticketId, (t) => {
    if (ref.subtaskId) {
      return {
        ...t,
        subtasks: t.subtasks.map((s) =>
          s.id === ref.subtaskId ? { ...s, color } : s,
        ),
      };
    }
    if (!isLeafTicket(t)) return t;
    return { ...t, color };
  });
}

export function parentCheckState(ticket: Ticket): ParentCheckState | null {
  if (isLeafTicket(ticket)) return null;
  const checkedCount = ticket.subtasks.filter((s) => s.checked).length;
  if (checkedCount === 0) return "unchecked";
  if (checkedCount === ticket.subtasks.length) return "checked";
  return "indeterminate";
}

// ---- Derived calculations ----

export function leafItems(plan: Plan): LeafItem[] {
  const items: LeafItem[] = [];
  for (const t of plan.tickets) {
    if (isLeafTicket(t)) {
      items.push({
        ticketId: t.id,
        label: t.label,
        estimate: t.estimate,
        color: t.color,
        checked: t.checked,
      });
    } else {
      for (const s of t.subtasks) {
        items.push({
          ticketId: t.id,
          subtaskId: s.id,
          label: s.label,
          estimate: s.estimate,
          color: s.color,
          checked: s.checked,
        });
      }
    }
  }
  return items;
}

export function totalCapacity(plan: Plan): number {
  return plan.people.reduce((sum, p) => sum + p.capacity, 0);
}

export function totalAllocated(plan: Plan): number {
  return leafItems(plan)
    .filter((i) => i.checked)
    .reduce((sum, i) => sum + i.estimate, 0);
}

export function remaining(plan: Plan): number {
  return totalCapacity(plan) - totalAllocated(plan);
}

export function overflow(plan: Plan): number {
  return Math.max(0, totalAllocated(plan) - totalCapacity(plan));
}

export function percentOfCapacity(plan: Plan, estimate: number): number {
  const capacity = totalCapacity(plan);
  if (capacity <= 0) return 0;
  return (estimate / capacity) * 100;
}
