"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { useState, useEffect, useRef } from "react";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXX Interface for mouse position state XXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IUseMousePosition = {
	x: number | null;
	y: number | null;
};

/* -----------------------------------------------------------------------------
XXX Hook to track mouse position with requestAnimationFrame for performance XXXX
----------------------------------------------------------------------------- */

const useMousePosition = () => {
	const [mousePosition, setMousePosition] = useState<IUseMousePosition>({
		x: null,
		y: null,
	});
	const requestRef = useRef<number | null>(null);

	const updateMousePosition = (event: MouseEvent) => {
		setMousePosition({x: event.clientX, y: event.clientY});
		requestRef.current = null;
	};

	const handleMouseMove = (event: MouseEvent) => {
		if (!requestRef.current) {
			requestRef.current = requestAnimationFrame(() =>
				updateMousePosition(event)
			);
		}
	};

	useEffect(() => {
		window.addEventListener("mousemove", handleMouseMove);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			if (requestRef.current) {
				cancelAnimationFrame(requestRef.current);
			}
		};
	});

	return mousePosition;
};

useMousePosition.displayName = 'useMousePosition';

export default useMousePosition;
