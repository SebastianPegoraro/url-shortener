import { cn, generateShortCode, isValidUrl, formatUrl } from "../../lib/utils";
import { nanoid } from "nanoid";

// Mock nanoid for predictable output
jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => "abcdef"),
}));

describe("cn", () => {
  it("merges class names and removes duplicates", () => {
    expect(cn("foo", "bar", "foo")).toContain("foo");
    expect(cn("foo", "bar", "foo")).toContain("bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", null, undefined)).toBe("foo");
  });
});

describe("generateShortCode", () => {
  it("returns a string of given length", () => {
    (nanoid as jest.Mock).mockReturnValue("abcdef");
    expect(generateShortCode(6)).toBe("abcdef");
  });

  it("uses default length when not provided", () => {
    (nanoid as jest.Mock).mockReturnValue("abcdef");
    expect(generateShortCode()).toBe("abcdef");
  });
});

describe("isValidUrl", () => {
  it("returns true for valid URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://example.com")).toBe(true);
  });

  it("returns false for invalid URLs", () => {
    expect(isValidUrl("ftp://example.com")).toBe(false);
    expect(isValidUrl("not a url")).toBe(false);
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("htp:/bad")).toBe(false);
  });
});

describe("formatUrl", () => {
  it("prepends https:// if missing", () => {
    expect(formatUrl("example.com")).toBe("https://example.com");
    expect(formatUrl("www.example.com")).toBe("https://www.example.com");
  });

  it("does not prepend if protocol exists", () => {
    expect(formatUrl("http://example.com")).toBe("http://example.com");
    expect(formatUrl("https://example.com")).toBe("https://example.com");
  });
});
