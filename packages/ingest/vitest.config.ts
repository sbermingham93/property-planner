import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // The in-process test database takes several seconds to start.
    hookTimeout: 60_000,
  },
});
