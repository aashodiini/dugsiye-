import { describe, expect, it } from "vitest";
import {
  normalizePhone,
  phoneFromPlaceholderEmail,
  placeholderEmail,
} from "@/server/auth/identity";

describe("normalizePhone", () => {
  it.each([
    ["061 234 5678", "+252612345678"],
    ["0612345678", "+252612345678"],
    ["252612345678", "+252612345678"],
    ["+252 61-234-5678", "+252612345678"],
    ["00252612345678", "+252612345678"],
    ["+44 20 7946 0958", "+442079460958"],
  ])("%s becomes %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(["612345678", "hello", "+0123456789", "+25261", ""])("rejects %j", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe("placeholder email", () => {
  it("round-trips a phone number and can never be delivered", () => {
    const email = placeholderEmail("+252612345678");
    expect(email).toBe("252612345678@phone.invalid");
    expect(phoneFromPlaceholderEmail(email)).toBe("+252612345678");
  });

  it("ignores real addresses", () => {
    expect(phoneFromPlaceholderEmail("252612345678@gmail.com")).toBeNull();
  });
});
