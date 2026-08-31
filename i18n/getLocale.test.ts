import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRootLocale = vi.fn();
const mockNotFound = vi.fn(() => {
	throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/root-params", () => ({
	locale: () => mockRootLocale(),
}));

vi.mock("next/navigation", () => ({
	notFound: () => mockNotFound(),
}));

import { getLocale } from "@/i18n/getLocale";

describe("getLocale", () => {
	beforeEach(() => {
		mockRootLocale.mockReset();
		mockNotFound.mockClear();
	});

	it("returns the root locale value when it's a supported locale", async () => {
		mockRootLocale.mockResolvedValue("fr");

		expect(await getLocale()).toBe("fr");
		expect(mockNotFound).not.toHaveBeenCalled();
	});

	it("calls notFound() when the root locale value isn't a supported locale", async () => {
		mockRootLocale.mockResolvedValue("ja");

		await expect(getLocale()).rejects.toThrow("NEXT_NOT_FOUND");
		expect(mockNotFound).toHaveBeenCalledTimes(1);
	});

	it("calls notFound() when the root locale value is undefined", async () => {
		mockRootLocale.mockResolvedValue(undefined);

		await expect(getLocale()).rejects.toThrow("NEXT_NOT_FOUND");
		expect(mockNotFound).toHaveBeenCalledTimes(1);
	});
});
