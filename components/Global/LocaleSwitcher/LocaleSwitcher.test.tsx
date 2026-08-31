import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockPathname = { value: "/en/posts/hello" };

vi.mock("next/navigation", () => ({
	usePathname: () => mockPathname.value,
}));

import LocaleSwitcher from "@/components/Global/LocaleSwitcher/LocaleSwitcher";

describe("LocaleSwitcher", () => {
	beforeEach(() => {
		mockPathname.value = "/en/posts/hello";
		document.cookie = "NEXT_LOCALE=; path=/; max-age=0"; // clear
	});

	it("renders a link per supported locale, in its own native-language label", () => {
		render(<LocaleSwitcher currentLocale="en" />);

		expect(screen.getByRole("link", { name: "English" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Français" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Deutsch" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Español" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Italiano" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Português" })).toBeInTheDocument();
	});

	it("marks the current locale's link with aria-current", () => {
		render(<LocaleSwitcher currentLocale="fr" />);

		expect(screen.getByRole("link", { name: "Français" })).toHaveAttribute("aria-current", "true");
		expect(screen.getByRole("link", { name: "English" })).not.toHaveAttribute("aria-current");
	});

	it("re-prefixes the current page's path with the target locale, preserving the rest of the path", () => {
		mockPathname.value = "/en/posts/hello";
		render(<LocaleSwitcher currentLocale="en" />);

		expect(screen.getByRole("link", { name: "Deutsch" })).toHaveAttribute("href", "/de/posts/hello");
	});

	it("falls back to the target locale's root when the current page is the locale's home page", () => {
		mockPathname.value = "/en";
		render(<LocaleSwitcher currentLocale="en" />);

		expect(screen.getByRole("link", { name: "Deutsch" })).toHaveAttribute("href", "/de");
	});

	it("sets the NEXT_LOCALE cookie when a locale link is clicked", () => {
		render(<LocaleSwitcher currentLocale="en" />);

		fireEvent.click(screen.getByRole("link", { name: "Deutsch" }));

		expect(document.cookie).toContain("NEXT_LOCALE=de");
	});
});
