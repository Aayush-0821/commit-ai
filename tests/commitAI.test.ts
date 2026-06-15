import { describe, test, expect } from "vitest";

describe("Commit Message", () => {
  test("Follows Conventional Commit Format", () => {
    const messages = [
      "feat(auth): add jwt authentication",
      "fix(api): handle error response",
      "chore(workflow): update dependencies",
      "refactor(core): simplify logic",
      "docs(readme): update documentation",
      "test(unit): add test coverage",
    ];

    const regex = /^(feat|fix|chore|refactor|docs|test)\([a-zA-Z0-9-_]+\): .+/;

    messages.forEach((message) => {
      expect(regex.test(message)).toBe(true);
    });
  });

  test("Rejects Invalid Commit Messages", () => {
    const invalidMessages = [
      "fixed stuff",

      "update code",

      "User Safety: safe",

      "Added feature",
    ];

    const regex = /^(feat|fix|chore|refactor|docs|test)\([a-zA-Z0-9-_]+\): .+/;

    invalidMessages.forEach((message) => {
      expect(regex.test(message)).toBe(false);
    });
  });
});
