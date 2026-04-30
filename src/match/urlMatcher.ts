import micromatch from "micromatch";
import type { UrlPattern } from "../types";

function matchesPattern(pathname: string, pattern: UrlPattern): boolean {
  if (pattern instanceof RegExp) {
    return pattern.test(pathname);
  }

  return micromatch.isMatch(pathname, pattern);
}

export function matchesUrlRules(
  pathname: string,
  include: UrlPattern[],
  exclude: UrlPattern[],
): boolean {
  const included =
    include.length === 0
      ? true
      : include.some((pattern) => matchesPattern(pathname, pattern));
  if (!included) {
    return false;
  }

  return !exclude.some((pattern) => matchesPattern(pathname, pattern));
}
