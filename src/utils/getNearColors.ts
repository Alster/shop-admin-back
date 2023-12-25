// @ts-expect-error - no typings for this package
import { diff } from "color-diff";
// @ts-expect-error - no typings for this package
import { fromString } from "css-color-converter";

import * as colorAttributes from "../../shop-shared-server/seed/itemAttribute.color.example.json";

const colorsList = colorAttributes.values
	.map((value) => value.key)
	.filter((value) => !["multicolor", "transparent"].includes(value));

type TRGBObject<Color extends string> = Readonly<{ R: number; G: number; B: number; name: Color }>;

type TRGBObjectWithDIff<Color extends string> = TRGBObject<Color> & { diff: number };

const colorStringToRgbObject = <const Color extends string>(color: Color) => {
	const knownColor = fromString(color);
	if (!knownColor) {
		throw new Error(`Unknown color ${color}`);
	}
	const [R, G, B] = knownColor.toRgbaArray();
	return { R, G, B, name: color } as const satisfies TRGBObject<typeof color>;
};

const colorsRgbaList = colorsList.map((color) => colorStringToRgbObject(color));

const SimilarityThreshold = 30;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function getNearestColorsDiffs<const Color extends string>(
	sourceColor: Color,
	similarityThreshold: number,
) {
	const sourceColorRgba = colorStringToRgbObject(sourceColor);

	return colorsRgbaList
		.map((color) => ({
			...color,
			diff: diff(sourceColorRgba, color),
		}))
		.filter((color) => color.diff < similarityThreshold) as TRGBObjectWithDIff<Color>[];
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function sortAndMap<const Color extends string, const TObject extends TRGBObjectWithDIff<Color>>(
	tObjects: TObject[],
) {
	return tObjects.sort((a, b) => a.diff - b.diff).map((color) => color.name);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function getNearestColors<const Color extends string>(sourceColors: Color[]) {
	const nearestColorsDiffs = sourceColors.map((color) =>
		getNearestColorsDiffs(color, SimilarityThreshold),
	);
	const allDiffs = nearestColorsDiffs.flat();
	return sortAndMap(allDiffs);
}

(() => {
	const colors = getNearestColors(["yellow", "red"]);

	console.log(colors);
})();
