import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import TitleParagraph from "@/components/CMS/TitleParagraph/TitleParagraph";
import type * as ITitleParagraph from "@/components/CMS/TitleParagraph/types/titleParagraph";

const baseProps: Pick<ITitleParagraph.IProps, "__typename" | "fieldGroupName"> = {
	__typename: "TestFieldGroup",
	fieldGroupName: "DefaultTemplate_Flexiblecontent_FlexibleContent_TitleParagraph",
};

describe("TitleParagraph", () => {
	it("renders the title text when a title is provided", () => {
		render(<TitleParagraph {...baseProps} title="HeroVoltsy" paragraph="" displayParagraph={false} />);

		expect(screen.getByText("HeroVoltsy")).toBeInTheDocument();
	});

	it("hides the title heading when no title is provided", () => {
		const { container } = render(
			<TitleParagraph {...baseProps} title="" paragraph="" displayParagraph={false} />,
		);

		expect(container.querySelector("h2")).toHaveClass("hidden");
	});

	it("hides the paragraph when no paragraph content is provided", () => {
		render(
			<TitleParagraph {...baseProps} title="HeroVoltsy" paragraph="" displayParagraph={false} />,
		);

		// Paragraph.tsx falls back to dangerouslySetInnerHTML: { __html: '' } when
		// content is falsy, so the only reliable check is the "hidden" class itself.
		const paragraph = document.querySelector('[class~="hidden"]');
		expect(paragraph).toBeInTheDocument();
	});

	it("centers the paragraph on large screens when displayParagraph is true", () => {
		render(
			<TitleParagraph
				{...baseProps}
				title="HeroVoltsy"
				paragraph="Pokemon TCG analysis and RPG walkthroughs."
				displayParagraph={true}
			/>,
		);

		const paragraph = screen.getByText("Pokemon TCG analysis and RPG walkthroughs.");
		expect(paragraph).toHaveClass("lg:text-center");
		expect(paragraph).not.toHaveClass("lg:text-left");
	});

	it("left-aligns the paragraph on large screens when displayParagraph is false", () => {
		render(
			<TitleParagraph
				{...baseProps}
				title="HeroVoltsy"
				paragraph="Pokemon TCG analysis and RPG walkthroughs."
				displayParagraph={false}
			/>,
		);

		const paragraph = screen.getByText("Pokemon TCG analysis and RPG walkthroughs.");
		expect(paragraph).toHaveClass("lg:text-left");
		expect(paragraph).not.toHaveClass("lg:text-center");
	});
});
