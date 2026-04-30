export function isPathProxied(pathname: string, proxyKeys: string[]): boolean {
  return proxyKeys.some((key) => {
    if (key.startsWith("^")) {
      return new RegExp(key).test(pathname);
    }

    return pathname.startsWith(key);
  });
}
