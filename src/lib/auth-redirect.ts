const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const normalizePath = (path: string) => {
  if (!path) {
    return "/";
  }
  return path.startsWith("/") ? path : `/${path}`;
};

export function getAuthRedirectUrl(path = "/profile") {
  const normalizedPath = normalizePath(path);
  const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (envSiteUrl) {
    return `${trimTrailingSlash(envSiteUrl)}${normalizedPath}`;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}${normalizedPath}`;
  }

  return undefined;
}