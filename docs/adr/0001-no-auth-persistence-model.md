# No-auth persistence: Supabase with open RLS, UUID read-key + edit-token write-key

The app is a static GitHub Pages site with no backend of its own, but needs Plans to persist and be reachable from any browser, not just the one that created them. We chose Supabase as the store, with RLS left open (anon role can read/write any row) rather than gated per-row — because without real authentication, RLS has no signal to gate on (every anonymous request looks identical; a policy can't tell "the caller who legitimately knows this Plan's UUID" from anyone else).

Given that, access control is pushed entirely into two application-level bearer secrets carried in the URL and cached in localStorage: the Plan's UUID (read key) and a separate random edit token (write key, checked in application logic, not enforced by the database). Security rests on both being practically unguessable, and on the app never exposing a "list all Plans" query. This was a deliberate tradeoff for a low-stakes, single-user planning tool — real per-Plan authorization would require adding actual authentication, which was explicitly ruled out.

Considered and rejected: RLS policies keyed on the Plan UUID itself — doesn't work, since RLS cannot verify a request "knows" the UUID it's filtering on versus an attacker enumerating rows.
