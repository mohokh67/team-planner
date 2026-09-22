import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Project Pages are served from /<repo>/, not the domain root.
export default defineConfig({
  plugins: [react()],
  base: "/team-planner/",
});
