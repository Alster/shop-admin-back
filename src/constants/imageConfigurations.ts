import KindEnum from "./kind.enum";

export interface IImageConfiguration {
	width: number;
	height: number;
	postfix: string;
}

export const ImageConfigurations: { [key in KindEnum]: IImageConfiguration[] } = {
	[KindEnum.ProductImages]: [
		{
			width: 1024,
			height: 1024,
			postfix: "big",
		},
		{
			width: 256,
			height: 256,
			postfix: "medium",
		},
		{
			width: 10,
			height: 10,
			postfix: "small",
		},
	],
};
