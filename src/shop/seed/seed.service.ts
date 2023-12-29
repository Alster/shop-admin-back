import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { KEYWORD } from "color-convert/conversions";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";

import { AttributesEnum } from "../../../shop-shared/constants/attributesEnum";
import { LanguageEnum } from "../../../shop-shared/constants/localization";
import { ProductItemDto } from "../../../shop-shared/dto/product/product.dto";
import generateSampleText from "../../../shop-shared/utils/generateSampleText";
import { UpdateProductRequestDto } from "../../../shop-shared-server/dto/updateProduct.request.dto";
import { CategoryNode } from "../../../shop-shared-server/schema/categoriesTree.schema";
import {
	ItemAttribute,
	ItemAttributeDocument,
} from "../../../shop-shared-server/schema/itemAttribute.schema";
import { ProductDocument } from "../../../shop-shared-server/schema/product.schema";
import { CategoryService } from "../../../shop-shared-server/service/category/category.service";
import { ProductService } from "../../../shop-shared-server/service/product/product.service";
import categoriesTree from "../../seed/categoriesTree.example.json";
import { generateImage } from "../../seed/colorImages/generateColorImages";
import attributeColor from "../../seed/itemAttribute.color.example.json";
import attributeCondition from "../../seed/itemAttribute.condition.example.json";
import attributeFabricComposition from "../../seed/itemAttribute.fabricComposition.example.json";
import attributeSize from "../../seed/itemAttribute.size.example.json";
import attributeSizeShoes from "../../seed/itemAttribute.sizeShoes.example.json";
import attributeStyle from "../../seed/itemAttribute.style.example.json";
import { ImageUploaderService } from "../imageUploader.service";

const addObjectId = <
	const T extends object,
	const TInput extends T & { _id?: string },
	const TOutput extends T & { _id: ObjectId },
>(
	attribute: TInput,
): TOutput => {
	const { _id, ...rest } = attribute;
	return {
		...rest,
		_id: _id ? new ObjectId(_id) : new ObjectId(),
	} as TOutput;
};

@Injectable()
export default class SeedService {
	private logger: Logger = new Logger(SeedService.name);

	constructor(
		@InjectModel(ItemAttribute.name)
		private readonly itemAttributeModel: Model<ItemAttributeDocument>,
		private readonly categoryService: CategoryService,
		private readonly productService: ProductService,
		private readonly imageUploaderService: ImageUploaderService,
	) {}

	async seedCategories(): Promise<void> {
		this.logger.log("seedCategories");

		const processCategory = (category: (typeof categoriesTree)[0]): CategoryNode => {
			const { _id, ...rest } = category;
			return {
				...rest,
				_id: new ObjectId(_id),
				children:
					category.children && category.children.length > 0
						? category.children.map((children) => processCategory(children))
						: [],
			};
		};

		await this.categoryService.saveCategoriesTree(
			categoriesTree.map((category) => processCategory(category)),
		);
	}

	async seedAttributes(): Promise<void> {
		this.logger.log("seedAttributes");

		await this.itemAttributeModel.deleteMany({});
		await this.itemAttributeModel.create(addObjectId(attributeColor));
		await this.itemAttributeModel.create(addObjectId(attributeCondition));
		await this.itemAttributeModel.create(addObjectId(attributeFabricComposition));
		await this.itemAttributeModel.create(addObjectId(attributeSize));
		await this.itemAttributeModel.create(addObjectId(attributeSizeShoes));
		await this.itemAttributeModel.create(addObjectId(attributeStyle));
	}

	async seedProducts(): Promise<void> {
		this.logger.log("seedProducts");
		await this.productService.removeAllProducts();

		const productsPerCategory = [2, 3] as const;
		const itemsPerProduct = [1, 5] as const;
		const colorsPerItem = [1, 3] as const;
		const priceRange = [100, 10_000] as const;

		const getValueInRange = <const T extends readonly [number, number]>([a, b]: T): number => {
			return Math.round(a + (b - a) * Math.random());
		};

		const attributeValueSets = {
			[AttributesEnum.COLOR]: attributeColor.values.map((value) => value.key),
			condition: attributeCondition.values.map((value) => value.key),
			fabricComposition: attributeFabricComposition.values.map((value) => value.key),
			[AttributesEnum.SIZE]: attributeSize.values.map((value) => value.key),
			[AttributesEnum.SIZE_SHOES]: attributeSizeShoes.values.map((value) => value.key),
			style: attributeStyle.values.map((value) => value.key),
		} as const;

		const getValuesFromSet = <const ValuesRange extends readonly [number, number]>(
			[a, b]: ValuesRange,
			set: string[],
		): string[] => {
			const count = Math.round(a + (b - a) * Math.random());
			return Array.from({ length: count }).map(
				() => set[Math.floor(Math.random() * set.length)]!,
			);
		};

		const getOneValueFromSet = (set: string[]): string[] => {
			return [set[Math.floor(Math.random() * set.length)]!];
		};

		const generateAttributeValues = <
			const AttributeName extends string,
			const ValuesRange extends readonly [number, number],
		>(
			attributeName: AttributeName,
			valuesSet: string[],
			valuesRange?: ValuesRange,
		): Record<AttributeName, string[]> =>
			({
				[attributeName]: valuesRange
					? getValuesFromSet(valuesRange, valuesSet)
					: getOneValueFromSet(valuesSet),
			}) as Record<AttributeName, string[]>;

		const characteristics = ["condition", "fabricComposition", "style"] as const;
		const baseAttributes = [] as const;

		const categoryToAttributesMap = new Map<string, string[]>([["shoes", ["sizeShoes"]]]);

		const getCategoriesLastChildren = (categories: CategoryNode[]): CategoryNode[] => {
			return categories.flatMap((category) => {
				if (category.children.length === 0) {
					return [category];
				}
				return getCategoriesLastChildren(category.children);
			});
		};

		const lastCategories = getCategoriesLastChildren(
			categoriesTree.map((category) => addObjectId(category)),
		);
		// this.logger.log(`lastCategories: ${lastCategories.length}`);
		// this.logger.log(`lastCategories: ${lastCategories.map((category) => category.title.en)}`);

		const createProductInCategory = async (category: CategoryNode): Promise<void> => {
			const name = category.title.en;
			const price = getValueInRange(priceRange);
			const itemsCount = getValueInRange(itemsPerProduct);
			const items = Array.from({ length: itemsCount }).map((): ProductItemDto => {
				return {
					sku: new ObjectId().toString(),
					attributes: {
						...generateAttributeValues(
							AttributesEnum.COLOR,
							attributeValueSets[AttributesEnum.COLOR],
							colorsPerItem,
						),
						...baseAttributes.reduce(
							(accumulator, attributeName) => ({
								...accumulator,
								...generateAttributeValues(
									attributeName,
									attributeValueSets[attributeName],
								),
							}),
							{},
						),
						...(category.publicId === "shoes"
							? generateAttributeValues("sizeShoes", attributeValueSets["sizeShoes"])
							: generateAttributeValues("size", attributeValueSets["size"])),
					},
				};
			});

			const createdProduct = await this.productService.createProduct({
				name,
				price,
				items,
			});

			const makeUpdateData = async (
				product: ProductDocument,
			): Promise<UpdateProductRequestDto> => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
				const { _id, categories, ...updateData } = { ...product };

				const description = generateSampleText(3);

				const imagesByColorEntries = await Promise.all(
					items.map(async (item) => {
						const colorsFromAttribute = item.attributes[
							AttributesEnum.COLOR
						] as string[];
						const bannedColors = new Set([
							"transparent",
							"multicolor",
							"silver",
							"gold",
						]);
						const defaultColor = "white" as const;
						const keywords = colorsFromAttribute.map((color) =>
							bannedColors.has(color) ? defaultColor : color,
						) as KEYWORD[];

						const imageBuffer = await generateImage(keywords);
						const mainColor = colorsFromAttribute[0] as string;

						const imageId = await this.imageUploaderService.uploadProductImage(
							product._id.toString(),
							imageBuffer,
						);

						return [mainColor, [imageId]];
					}),
				);

				const imagesByColor = Object.fromEntries(imagesByColorEntries);

				return {
					...updateData,
					items,
					imagesByColor,
					categories: [category._id.toString()],
					characteristics: characteristics.reduce(
						(accumulator, attributeName) => ({
							...accumulator,
							...generateAttributeValues(
								attributeName,
								attributeValueSets[attributeName],
							),
						}),
						{},
					),
					title: category.title,
					description: {
						[LanguageEnum.ua]: description,
						[LanguageEnum.en]: description,
						[LanguageEnum.ru]: description,
					},
					active: true,
				};
			};

			// await generateImage()

			await this.productService.updateProduct(
				createdProduct._id.toString(),
				await makeUpdateData(createdProduct),
			);
		};

		await Promise.all(
			lastCategories.flatMap((category) =>
				Array.from({ length: getValueInRange(productsPerCategory) }).map(async () =>
					createProductInCategory(category),
				),
			),
		);
	}
}
