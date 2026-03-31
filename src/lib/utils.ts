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

/**
 * Combines multiple class value inputs into a single normalized Tailwind CSS class string.
 *
 * @param inputs - Class name values (strings, arrays, objects) to be combined
 * @returns A single string with class names merged and conflicting Tailwind utilities resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a URL-safe short identifier.
 *
 * @param length - Number of characters in the identifier (default: 6)
 * @returns A URL-safe short identifier of the specified length
 */
export function generateShortCode(length: number = 6): string {
  return nanoid(length);
}

/**
 * Checks that an input URL string is present and within the allowed maximum length.
 *
 * @param url - The raw input string to validate
 * @returns `true` if `url` is a string, contains at least one non-whitespace character after trimming, and its length is less than or equal to `MAX_URL_LENGTH`; `false` otherwise.
 */
function isValidInput(url: string): boolean {
  return (
    typeof url === "string" &&
    url.trim().length > 0 &&
    url.length <= MAX_URL_LENGTH
  );
}

/**
 * Checks that the input string contains no ASCII control characters.
 *
 * @param url - The raw input string to validate
 * @returns `true` if the string contains no ASCII control characters, `false` otherwise.
 */
function isSafeRawString(url: string): boolean {
  return !CONTROL_CHAR_REGEX.test(url);
}

/**
 * Checks whether the given URL uses the http or https protocol.
 *
 * @param parsed - The URL object to evaluate
 * @returns `true` if the URL's protocol is `http:` or `https:`, `false` otherwise.
 */
function isAllowedProtocol(parsed: URL): boolean {
  return ["http:", "https:"].includes(parsed.protocol);
}

/**
 * Determines whether a parsed URL has no embedded username or password.
 *
 * @param parsed - The parsed URL to inspect for credentials
 * @returns `true` if the URL has neither a username nor a password, `false` otherwise.
 */
function hasNoCredentials(parsed: URL): boolean {
  return !parsed.username && !parsed.password;
}

/**
 * Checks whether a URL's pathname and query string together do not exceed the maximum allowed length.
 *
 * @param parsed - The parsed URL object to evaluate
 * @returns `true` if the combined length of `parsed.pathname` and `parsed.search` is less than or equal to `MAX_PATH_QUERY_LENGTH`, `false` otherwise.
 */
function isPathQueryWithinLimit(parsed: URL): boolean {
  return parsed.pathname.length + parsed.search.length <= MAX_PATH_QUERY_LENGTH;
}

/**
 * Determines whether a hostname meets the structural and policy constraints used for URL validation.
 *
 * A valid hostname is non-empty, does not exceed the maximum hostname length, is not an IPv4 address or an IPv6 literal (bracketed), is not percent-encoded, does not match known private or special-use domain patterns (e.g., localhost, .local, .internal, .test, .example, .invalid), and consists of dot-separated labels where the final label is an alphabetic TLD of at least two characters and every label conforms to length and character rules.
 *
 * @returns `true` if the `hostname` satisfies all constraints, `false` otherwise.
 */
function isValidHostname(hostname: string): boolean {
  if (!hostname || hostname.length > MAX_HOSTNAME_LENGTH) return false;
  if (IPV4_REGEX.test(hostname)) return false;
  if (hostname.startsWith("[") && hostname.endsWith("]")) return false; // IPv6
  if (decodeURIComponent(hostname) !== hostname) return false; // encoded hostname
  if (PRIVATE_DOMAIN_PATTERNS.some((p) => p.test(hostname))) return false;
  return areLabelsValid(hostname);
}

/**
 * Validates that a dot-separated hostname is composed of acceptable labels and ends with a valid TLD.
 *
 * @param hostname - The hostname to validate (one or more labels separated by `.`)
 * @returns `true` if the hostname has at least two labels, the final label satisfies TLD constraints, and every label is 1–63 characters long and matches the allowed label pattern; `false` otherwise.
 */
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

/**
 * Validates that a string is a safe, allowed HTTP or HTTPS URL.
 *
 * Performs input-level checks (empty/too-long input, control characters), parses the URL, and enforces that the scheme is `http` or `https`, that no credentials are present, that the combined pathname and query length is within allowed limits, and that the hostname is valid (not an IP literal, not a disallowed/private domain, not percent-encoded, and with labels meeting length and character rules).
 *
 * @param url - The URL string to validate
 * @returns `true` if `url` is a valid HTTP/HTTPS URL meeting all safety and structural constraints described above, `false` otherwise
 */
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

/**
 * Ensure a URL string includes an explicit HTTP or HTTPS scheme.
 *
 * @param url - A URL string that may be missing the `http://` or `https://` scheme
 * @returns The original `url` if it already starts with `http://` or `https://`, otherwise the input prefixed with `https://`
 */
export function formatUrl(url: string): string {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}
