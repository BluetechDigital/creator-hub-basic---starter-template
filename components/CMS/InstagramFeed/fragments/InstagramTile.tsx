'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo, useCallback, useRef, useState, type MouseEvent } from "react";
import type { IInstagramFeed } from "@/api/Instagram/GetAllInstagramFeedContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/InstagramFeed/styles/InstagramFeed.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Props / helpers XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IInstagramPost = IInstagramFeed[number];

export type IInstagramTileLabels = {
	previous: string;
	next: string;
	viewOnInstagram: string;
};

type ISlide = { key: string; url: string; isVideo: boolean };

/**
 * A carousel post exposes its images/videos under `children`; a single-media
 * post is its own one slide. For a video slide we show its poster
 * (`thumbnail_url`) rather than the raw `media_url` (an .mp4).
 */
const buildSlides = (post: IInstagramPost): ISlide[] => {
	const media = post.children?.data?.length
		? post.children.data
		: [{ id: post.id, media_type: post.media_type, media_url: post.media_url, thumbnail_url: post.thumbnail_url }];

	return media.map((m) => ({
		key: m.id,
		isVideo: m.media_type === "VIDEO",
		url: m.media_type === "VIDEO" ? m.thumbnail_url ?? m.media_url : m.media_url,
	}));
};

const formatCount = (value: number | undefined): string | null =>
	typeof value === "number" ? new Intl.NumberFormat().format(value) : null;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX InstagramTile Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * One grid tile. Single-media posts are a background-image square; carousel
 * posts are a scroll-snap strip (native swipe) with prev/next arrows and dot
 * indicators that fade in on hover. A full-bleed `<a>` over the top opens the
 * post on Instagram and, on hover (or always, on touch), darkens to show the
 * like/comment counts. Arrow/dot clicks `stopPropagation` so they don't also
 * open the link.
 */
const InstagramTile: FC<{ post: IInstagramPost; labels: IInstagramTileLabels }> = memo(({ post, labels }) => {

	const slides = buildSlides(post);
	const isCarousel = slides.length > 1;

	const trackRef = useRef<HTMLDivElement>(null);
	const [index, setIndex] = useState(0);

	const scrollToSlide = useCallback((target: number) => {
		const el = trackRef.current;
		if (!el) return;
		const clamped = Math.max(0, Math.min(target, slides.length - 1));
		const reduce =
			typeof window !== "undefined" &&
			window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
		el.scrollTo({ left: clamped * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
	}, [slides.length]);

	const onScroll = useCallback(() => {
		const el = trackRef.current;
		if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
	}, []);

	const stop = (fn: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		fn();
	};

	const likeLabel = formatCount(post.like_count);
	const commentLabel = formatCount(post.comments_count);
	const hasStats = likeLabel !== null || commentLabel !== null;

	return (
		<div className={styles.instagramFeedItem} data-carousel={isCarousel || undefined}>
			<div
				ref={trackRef}
				className={styles.instagramFeedTrack}
				onScroll={isCarousel ? onScroll : undefined}
			>
				{slides.map((slide) => (
					<div
						key={slide.key}
						className={styles.instagramFeedSlide}
						style={{ backgroundImage: slide.url ? `url("${slide.url}")` : undefined }}
					>
						{slide.isVideo && (
							<svg className={styles.instagramFeedPlay} viewBox="0 0 24 24" aria-hidden="true">
								<circle cx="12" cy="12" r="11" fill="rgba(0,0,0,0.45)" />
								<path d="M10 8.5v7l6-3.5-6-3.5Z" fill="#fff" />
							</svg>
						)}
					</div>
				))}
			</div>

			{isCarousel && (
				<>
					<button
						type="button"
						aria-label={labels.previous}
						disabled={index === 0}
						className={`${styles.instagramFeedArrow} ${styles.instagramFeedArrowPrev}`}
						onClick={stop(() => scrollToSlide(index - 1))}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
					</button>
					<button
						type="button"
						aria-label={labels.next}
						disabled={index === slides.length - 1}
						className={`${styles.instagramFeedArrow} ${styles.instagramFeedArrowNext}`}
						onClick={stop(() => scrollToSlide(index + 1))}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
					</button>

					<div className={styles.instagramFeedDots}>
						{slides.map((slide, i) => (
							<button
								key={slide.key}
								type="button"
								aria-label={`${i + 1} / ${slides.length}`}
								aria-current={i === index || undefined}
								data-active={i === index || undefined}
								className={styles.instagramFeedDot}
								onClick={stop(() => scrollToSlide(i))}
							/>
						))}
					</div>
				</>
			)}

			<a
				href={post.permalink || "#"}
				target="_blank"
				rel="noopener noreferrer"
				className={styles.instagramFeedOverlay}
				aria-label={`${labels.viewOnInstagram}: ${post.caption ?? ""}`.trim().slice(0, 140)}
			>
				{hasStats && (
					<span className={styles.instagramFeedStats}>
						{likeLabel !== null && (
							<span className={styles.instagramFeedStat}>
								<svg viewBox="0 0 24 24" aria-hidden="true">
									<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z" fill="currentColor" />
								</svg>
								{likeLabel}
							</span>
						)}
						{commentLabel !== null && (
							<span className={styles.instagramFeedStat}>
								<svg viewBox="0 0 24 24" aria-hidden="true">
									<path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
								{commentLabel}
							</span>
						)}
					</span>
				)}
			</a>
		</div>
	);
});

InstagramTile.displayName = "InstagramTile";

export default InstagramTile;
