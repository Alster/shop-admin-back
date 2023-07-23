import {
	Body,
	Controller,
	FileTypeValidator,
	Get,
	Logger,
	MaxFileSizeValidator,
	Param,
	ParseFilePipe,
	Post,
	Query,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express } from "express";
import { ObjectId } from "mongodb";

import { LanguageEnum } from "../../../shop-shared/constants/localization";
import { AttributeDto } from "../../../shop-shared/dto/product/attribute.dto";
import { ProductAdminDto } from "../../../shop-shared/dto/product/product.dto";
import { ProductListAdminResponseDto } from "../../../shop-shared/dto/product/productList.admin.response.dto";
import { CreateProductRequestDto } from "../../../shop-shared-server/dto/createProduct.request.dto";
import { UpdateProductRequestDto } from "../../../shop-shared-server/dto/updateProduct.request.dto";
import randomString from "../../../shop-shared-server/helpers/randomString";
import { mapAttributeDocumentToAttributeDto } from "../../../shop-shared-server/mapper/product/map.attributeDocument.to.attributeDto";
import { mapProductDocumentToProductAdminDto } from "../../../shop-shared-server/mapper/product/map.productDocument.to.productAdminDto";
import { ProductService } from "../../../shop-shared-server/service/product/product.service";
import { ImageUploaderService } from "../imageUploader.service";

@Controller("product")
export class ProductController {
	constructor(
		private readonly productService: ProductService,
		private readonly imageUploaderService: ImageUploaderService,
	) {}

	private logger: Logger = new Logger(ProductController.name);

	@Post("create")
	async postCreate(
		@Body() createProductRequestDto: CreateProductRequestDto,
	): Promise<ProductAdminDto> {
		this.logger.log(JSON.stringify(createProductRequestDto, undefined, 2));
		const result = await this.productService.createProduct(createProductRequestDto);

		return mapProductDocumentToProductAdminDto(result);
	}

	@Post("update/:id")
	async postUpdate(
		@Body() updateData: UpdateProductRequestDto,
		@Param("id") id: string,
	): Promise<ProductAdminDto> {
		console.log(updateData);
		const result = await this.productService.updateProduct(id, updateData);
		if (!result) {
			throw new Error(`Product not found with id ${id}`);
		}
		return mapProductDocumentToProductAdminDto(result);
	}

	@Post("clone/:id")
	async postClone(@Param("id") id: string): Promise<ProductAdminDto> {
		const result = await this.productService.cloneProduct(id);
		return mapProductDocumentToProductAdminDto(result);
	}

	@Get("get/:id")
	async getProduct(@Param("id") id: string): Promise<ProductAdminDto> {
		const result = await this.productService.getProduct(id);
		if (!result) {
			throw new Error(`Product not found with id ${id}`);
		}
		return mapProductDocumentToProductAdminDto(result);
	}

	@Post("delete/:id")
	async deleteProduct(@Param("id") id: string): Promise<void> {
		await this.productService.deleteProduct(id);
	}

	@Get("list")
	async list(
		@Query("attrs") attributes: { key: string; values: string[] }[],
		@Query("categories") categories: string[],
		@Query("sortField") sortField: string,
		@Query("sortOrder") sortOrder: number,
		@Query("skip") skip: number,
		@Query("limit") limit: number,
		@Query("search") search: string,
	): Promise<ProductListAdminResponseDto> {
		console.log("Attrs:", attributes);
		const query: any = {};
		if (attributes) {
			for (const { key, values } of attributes) {
				query[`attrs.${key}`] = { $in: values };
			}
		}
		if (categories) {
			query.categoriesAll = {
				$in: categories.filter((v) => ObjectId.isValid(v)).map((id) => new ObjectId(id)),
			};
		}
		if (search) {
			query.$text = {
				$search: search,
			};
		}

		const sort: any = {};
		if (sortField) {
			if (sortField === "title") {
				sort[`${sortField}.${LanguageEnum.UA}`] = sortOrder;
			} else {
				sort[sortField] = sortOrder;
			}
		}

		const result = await this.productService.find(query, sort, skip, limit, LanguageEnum.UA);

		return {
			products: result.products.map((product) =>
				mapProductDocumentToProductAdminDto(product),
			),
			total: result.total,
			filters: result.filters,
			categories: result.categories,
		};
	}

	@Get("attribute/list")
	async getAttributes(): Promise<AttributeDto[]> {
		const result = await this.productService.getAttributes();
		return result.map((attribute) =>
			mapAttributeDocumentToAttributeDto(attribute, LanguageEnum.UA),
		);
	}

	@Post("uploadImage")
	@UseInterceptors(FileInterceptor("image"))
	async uploadFile(
		@UploadedFile(
			new ParseFilePipe({
				fileIsRequired: true,
				validators: [
					new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
					new FileTypeValidator({ fileType: "image/jpeg" }),
				],
			}),
		)
		file: Express.Multer.File,
	): Promise<string> {
		// console.log(JSON.stringify(file, undefined, 2));
		return this.imageUploaderService.uploadProductImage(file.buffer);
	}
}
