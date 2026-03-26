import { nanoid } from "nanoid";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const MAX_URL_LENGTH = 2083;
const MAX_HOSTNAME_LENGTH = 253;
const MAX_LABEL_LENGTH = 63;
const MAX_PATH_QUERY_LENGTH = 1024;

const LABEL_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
const TLD_REGEX = /^[a-zA-Z]{2,}$/;
const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const CONTROL_CHAR_REGEX = /[\x00-\x1F\x7F]/;

const PRIVATE_DOMAIN_PATTERNS = [
  /^localhost$/i,
  /\.local$/i,
  /\.internal$/i,
  /\.test$/i,
  /\.example$/i,
  /\.invalid$/i,
];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateShortCode(length: number = 6): string {
  return nanoid(length);
}

function isValidInput(url: string): boolean {
  return (
    typeof url === "string" &&
    url.trim().length > 0 &&
    url.length <= MAX_URL_LENGTH
  );
}

function isSafeRawString(url: string): boolean {
  return !CONTROL_CHAR_REGEX.test(url);
}

function isAllowedProtocol(parsed: URL): boolean {
  return ["http:", "https:"].includes(parsed.protocol);
}

function hasNoCredentials(parsed: URL): boolean {
  return !parsed.username && !parsed.password;
}

function isPathQueryWithinLimit(parsed: URL): boolean {
  return parsed.pathname.length + parsed.search.length <= MAX_PATH_QUERY_LENGTH;
}

function isValidHostname(hostname: string): boolean {
  if (!hostname || hostname.length > MAX_HOSTNAME_LENGTH) return false;
  if (IPV4_REGEX.test(hostname)) return false;
  if (hostname.startsWith("[") && hostname.endsWith("]")) return false; // IPv6
  if (decodeURIComponent(hostname) !== hostname) return false; // encoded hostname
  if (PRIVATE_DOMAIN_PATTERNS.some((p) => p.test(hostname))) return false;
  return areLabelsValid(hostname);
}

function areLabelsValid(hostname: string): boolean {
  const labels = hostname.split(".");
  if (labels.length < 2) return false;

  const tld = labels.at(-1);
  if (!TLD_REGEX.test(tld as string)) return false;

  return labels.every(
    (label) =>
      label.length > 0 &&
      label.length <= MAX_LABEL_LENGTH &&
      LABEL_REGEX.test(label),
  );
}

export function isValidUrl(url: string): boolean {
  if (!isValidInput(url) || !isSafeRawString(url)) return false;

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return false;
  }

  return (
    isAllowedProtocol(parsed) &&
    hasNoCredentials(parsed) &&
    isPathQueryWithinLimit(parsed) &&
    isValidHostname(parsed.hostname)
  );
}

export function formatUrl(url: string): string {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}
