import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: [
      "convex/**/*.test.ts",
      "artifacts/celljevity-app/src/**/*.test.ts",
    ],
    exclude: ["**/node_modules/**", ".worktrees"],
  },
});
