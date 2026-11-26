import { describe, expect, it } from "vitest";
import { format } from "@/i18n/locales";
import { en } from "@/i18n/messages/en";
import { so } from "@/i18n/messages/so";

// ADR 0008: switching language must never show a missing translation.

function leaves(obj: object, prefix = ""): [string, unknown][] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? leaves(value, `${prefix}${key}.`)
      : [[`${prefix}${key}`, value] as [string, unknown]],
  );
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("message catalogues", () => {
  it("have exactly the same keys", () => {
    expect(leaves(so).map(([k]) => k).sort()).toEqual(leaves(en).map(([k]) => k).sort());
  });

  it("have no empty messages", () => {
    for (const [key, value] of [...leaves(en), ...leaves(so)]) {
      expect(typeof value === "string" && value.trim().length > 0, key).toBe(true);
    }
  });

  it("use the same {placeholders} in both languages", () => {
    const soByKey = new Map(leaves(so));
    for (const [key, value] of leaves(en)) {
      expect(placeholders(soByKey.get(key) as string), key).toEqual(placeholders(value as string));
    }
  });
});

describe("format", () => {
  it("fills placeholders and leaves unknown ones visible", () => {
    expect(format("Signed in as {name} {missing}", { name: "Faadumo" })).toBe(
      "Signed in as Faadumo {missing}",
    );
  });
});
