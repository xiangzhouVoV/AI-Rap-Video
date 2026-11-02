// Only allow return paths within this website, never auth/API destinations.
export function safeAuthReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) {
    return "/";
  }
  try {
    const url = new URL(value, "https://return.invalid");
    const path = decodeURIComponent(url.pathname);
    if (
      url.origin !== "https://return.invalid" ||
      path.startsWith("//") ||
      /[\\\u0000-\u001f\u007f]/.test(path) ||
      /^\/(api|login)(\/|$)/.test(path)
    ) {
      return "/";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
