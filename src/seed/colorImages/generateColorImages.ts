import * as convert from "color-convert";
import { HSL, KEYWORD } from "color-convert/conversions";
import sharp from "sharp";

const width = 1024;
const height = 1024;

export const generateImage = async (colors: KEYWORD[]) => {
	const convertedColors = colors.map((color) => convert.keyword.hsl(color));

	return sharp(bufferColorful(convertedColors))
		.resize(width, height)
		.toFormat("jpeg")
		.jpeg({
			quality: 80,
		})
		.toBuffer();
};

function bufferColorful(colors: HSL[]) {
	type GradientColorsMap = {
		radialGradient1: [HSL, HSL];
		radialGradient2: [HSL, HSL];
	};

	const getGradientColors = (colors: HSL[]): GradientColorsMap => {
		switch (colors.length) {
			case 1: {
				return {
					radialGradient1: [colors[0]!, colors[0]!],
					radialGradient2: [colors[0]!, colors[0]!],
				};
			}
			case 2: {
				return {
					radialGradient1: [colors[0]!, colors[1]!],
					radialGradient2: [colors[1]!, colors[0]!],
				};
			}
			case 3: {
				return {
					radialGradient1: [colors[0]!, colors[1]!],
					radialGradient2: [colors[2]!, colors[1]!],
				};
			}
			case 4: {
				return {
					radialGradient1: [colors[0]!, colors[1]!],
					radialGradient2: [colors[2]!, colors[3]!],
				};
			}
			// eslint-disable-next-line sonarjs/no-duplicated-branches
			case 5: {
				return {
					radialGradient1: [colors[0]!, colors[1]!],
					radialGradient2: [colors[2]!, colors[3]!],
				};
			}
			default: {
				throw new Error(`Too many colors: ${colors.length}`);
			}
		}
	};

	const gradientColors = getGradientColors(colors);

	const swgWidth = 1024;
	const swgHeight = 1024;
	const radius = 2000;
	const centerX1 = swgWidth + 400;
	const centerY1 = swgHeight;
	const centerX2 = 300;
	const centerY2 = swgHeight + 400;

	const svg = `<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${swgWidth}" height="${swgHeight}">
	<radialGradient id="radialGradient1" cx="${centerX1}" cy="${centerY1}" r="${radius}" gradientUnits="userSpaceOnUse">
		<stop offset="0.1" style="stop-color:${hslToString(gradientColors.radialGradient1[0])}" />
		<stop offset="0.6" style="stop-color:${hslToString(gradientColors.radialGradient1[1])};" />
	</radialGradient>
	<radialGradient id="radialGradient2" cx="${centerX2}" cy="${centerY2}" r="${radius}" gradientUnits="userSpaceOnUse">
		<stop offset="0.1" style="stop-color:${hslToString(gradientColors.radialGradient2[0])}" />
		<stop offset="0.6" style="stop-color:${hslToString(
			gradientColors.radialGradient2[1],
		)};stop-opacity:0" />
	</radialGradient>
	<rect width="100%" height="100%" fill="url(#radialGradient1)" />
	<rect width="100%" height="100%" fill="url(#radialGradient2)" />
</svg>`;

	// fs.writeFileSync(`./image.${colors.join(".")}.svg`, svg, { encoding: "utf8" });

	return Buffer.from(svg);
}

function randomNumber(number: number) {
	return Math.random() * number;
}

function hslToString(hsl: HSL) {
	return `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;
}

// (async () => {
// 	const colors = ["red", "purple", "yellow", "green"] as const satisfies KEYWORD[];
// 	const imageBuffer = await generateImage(colors);
// 	fs.writeFileSync(`./image.${colors.join(".")}.jpeg`, imageBuffer, { encoding: "binary" });
// })();
