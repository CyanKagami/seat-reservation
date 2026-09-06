import type { IconType } from '../types';

/**
 * A flat, single-color icon glyph, authored in its own local 0-100 viewBox.
 * `style: 'fill'` glyphs (restroom, stage) are solid silhouettes; `style:
 * 'stroke'` glyphs (door) are line drawings with `fill: none` — matching the
 * conventional "open door + swing arc" architectural symbol, which reads
 * better as an outline than a silhouette.
 *
 * The renderer is expected to scale+translate this local viewBox to fit
 * centered within an `IconElement`'s actual `points` boundary (see
 * `utils/geometry.ts` for the centroid/bounds math that drives that), rather
 * than the glyph itself carrying any absolute size.
 */
export interface IconGlyph {
	/** local coordinate space this glyph's `path` is authored in, always square */
	viewBoxSize: number;
	path: string;
	style: 'fill' | 'stroke';
	/** only meaningful when style === 'stroke'; in local viewBox units, scale-independent of the placed size */
	strokeWidth?: number;
}

export const ICON_GLYPHS: Record<IconType, IconGlyph> = {
	restroom: {
		viewBoxSize: 100,
		style: 'fill',
		// two person silhouettes (head circle + tapered body), side by side
		path: 'M21,20 A9,9 0 1,0 39,20 A9,9 0 1,0 21,20 Z M18,34 L42,34 L48,88 L12,88 Z M61,20 A9,9 0 1,0 79,20 A9,9 0 1,0 61,20 Z M58,34 L82,34 L88,88 L52,88 Z'
	},
	door: {
		viewBoxSize: 100,
		style: 'stroke',
		strokeWidth: 4,
		// wall/threshold line + door leaf (open, perpendicular to wall) + swing arc + knob
		path: 'M15,85 L85,85 M20,85 L20,20 M20,20 A65,65 0 0,1 85,85 M17.5,45 A2.5,2.5 0 1,0 22.5,45 A2.5,2.5 0 1,0 17.5,45 Z'
	},
	stage: {
		viewBoxSize: 100,
		style: 'fill',
		// standing person silhouette on a raised platform/riser
		path: 'M40,35 A10,10 0 1,0 60,35 A10,10 0 1,0 40,35 Z M38,48 L62,48 L70,75 L30,75 Z M15,75 L85,75 L85,90 L15,90 Z'
	}
};
