import { describe, expect, it } from "vitest";
import { matchesUrlRules } from "../../src/match/urlMatcher";

describe("matchesUrlRules", () => {
  it("matches glob includes", () => {
    expect(matchesUrlRules("/api/users", ["/api/**"], [])).toBe(true);
    expect(matchesUrlRules("/web/users", ["/api/**"], [])).toBe(false);
  });

  it("supports regexp patterns", () => {
    expect(matchesUrlRules("/api/v1/orders", [/^\/api\/v\d+/], [])).toBe(true);
  });

  it("exclude has priority", () => {
    expect(matchesUrlRules("/api/health", ["/api/**"], ["/api/health"])).toBe(
      false,
    );
  });
});
