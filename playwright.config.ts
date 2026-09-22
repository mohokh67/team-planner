import { defineConfig, devices } from "@playwright/test";

const PORT = 5190;
const BASE_URL = `http://localhost:${PORT}/team-planner/`;

// The Supabase URL/key here are never actually dialed - every request to
// them is intercepted by e2e/mockSupabase.ts. They just need to be
// well-formed enough for src/lib/supabase.ts not to throw on startup.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_SUPABASE_URL: "https://mock.supabase.co",
      VITE_SUPABASE_ANON_KEY: "mock-anon-key",
    },
  },
});
