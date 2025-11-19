/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX GLOBAL XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/* Represents an array structure for rich content ACF blocks.
 The inner 'content: any' is deliberately simplified here. */
export type IProps = [
	{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: any;
	}
];