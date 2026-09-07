import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockPathname = { value: "/en/posts/hello" };

vi.mock("next/navigation", () => ({
	usePathname: () => mockPathname.value,
}));

import LocaleSwitcher from "@/components/Global/LocaleSwitcher/LocaleSwitcher";

const openMenu = () => fireEvent.click(screen.getByRole("button", { name: /change language/i }));

describe("LocaleSwitcher", () => {
	beforeEach(() => {
		mockPathname.value = "/en/posts/hello";
		document.cookie = "NEXT_LOCALE=; path=/; max-age=0"; // clear
	});

	it("shows only the current locale's flag until opened", () => {
		render(<LocaleSwitcher currentLocale="en" />);

		expect(screen.getByRole("button", { name: /current: English/i })).toBeInTheDocument();
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	});

	it("opens a menu listing every supported locale, in its own native-language label", () => {
		render(<LocaleSwitcher currentLocale="en" />);
		openMenu();

		expect(screen.getByRole("listbox")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /English/i })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /Français/i })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /Deutsch/i })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /Español/i })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /Italiano/i })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /Português/i })).toBeInTheDocument();
	});

	it("marks the current locale's link with aria-current", () => {
		render(<LocaleSwitcher currentLocale="fr" />);
		openMenu();

		expect(screen.getByRole("link", { name: /Français/i })).toHaveAttribute("aria-current", "true");
		expect(screen.getByRole("link", { name: /English/i })).not.toHaveAttribute("aria-current");
	});

	it("re-prefixes the current page's path with the target locale, preserving the rest of the path", () => {
		mockPathname.value = "/en/posts/hello";
		render(<LocaleSwitcher currentLocale="en" />);
		openMenu();

		expect(screen.getByRole("link", { name: /Deutsch/i })).toHaveAttribute("href", "/de/posts/hello");
	});

	it("falls back to the target locale's root when the current page is the locale's home page", () => {
		mockPathname.value = "/en";
		render(<LocaleSwitcher currentLocale="en" />);
		openMenu();

		expect(screen.getByRole("link", { name: /Deutsch/i })).toHaveAttribute("href", "/de");
	});

	it("sets the NEXT_LOCALE cookie and closes the menu when a locale is chosen", async () => {
		render(<LocaleSwitcher currentLocale="en" />);
		openMenu();

		fireEvent.click(screen.getByRole("link", { name: /Deutsch/i }));

		expect(document.cookie).toContain("NEXT_LOCALE=de");
		// AnimatePresence plays a fade-out before actually unmounting the menu.
		await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
	});

	it("closes the menu on Escape", async () => {
		render(<LocaleSwitcher currentLocale="en" />);
		openMenu();
		expect(screen.getByRole("listbox")).toBeInTheDocument();

		fireEvent.keyDown(document, { key: "Escape" });

		await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
	});

	it("closes the menu on an outside click", async () => {
		render(
			<div>
				<button type="button">outside</button>
				<LocaleSwitcher currentLocale="en" />
			</div>,
		);
		openMenu();
		expect(screen.getByRole("listbox")).toBeInTheDocument();

		fireEvent.mouseDown(screen.getByRole("button", { name: "outside" }));

		await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
	});
});
