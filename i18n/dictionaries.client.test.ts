import { describe, it, expect } from "vitest";
import { getClientDictionary } from "@/i18n/dictionaries.client";

describe("getClientDictionary", () => {
	it("returns the requested locale's dictionary", () => {
		expect(getClientDictionary("fr").notFound.errorBadge).toBe("Erreur 404");
		expect(getClientDictionary("de").notFound.errorBadge).toBe("Fehler 404");
	});

	it("falls back to English for an unrecognized locale", () => {
		expect(getClientDictionary("xx").notFound.errorBadge).toBe("Error 404");
	});

	it("returns the same shape as the server-side getDictionary for English", () => {
		expect(getClientDictionary("en").notFound.errorBadge).toBe("Error 404");
	});
});
