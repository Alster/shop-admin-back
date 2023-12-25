import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
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
import categoriesTree from "../../../shop-shared-server/seed/categoriesTree.example.json";
import attributeColor from "../../../shop-shared-server/seed/itemAttribute.color.example.json";
import attributeCondition from "../../../shop-shared-server/seed/itemAttribute.condition.example.json";
import attributeFabricComposition from "../../../shop-shared-server/seed/itemAttribute.fabricComposition.example.json";
import attributeSize from "../../../shop-shared-server/seed/itemAttribute.size.example.json";
import attributeSizeShoes from "../../../shop-shared-server/seed/itemAttribute.sizeShoes.example.json";
import attributeStyle from "../../../shop-shared-server/seed/itemAttribute.style.example.json";
import { CategoryService } from "../../../shop-shared-server/service/category/category.service";
import { ProductService } from "../../../shop-shared-server/service/product/product.service";
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

		const productsPerCategory = [10, 20] as const;
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

		const baseAttributes = ["condition", "fabricComposition", "style"] as const;

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
						...(category.publicId === "shoes" &&
							generateAttributeValues("sizeShoes", attributeValueSets["sizeShoes"])),
					},
				};
			});

			const createdProduct = await this.productService.createProduct({
				name,
				price,
				items,
			});

			const makeUpdateData = (product: ProductDocument): UpdateProductRequestDto => {
				const { _id, categories, ...updateData } = { ...product };

				const description = generateSampleText(3);

				// const images

				return {
					...updateData,
					categories: [category._id.toString()],
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
				makeUpdateData(createdProduct),
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
