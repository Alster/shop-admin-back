/* eslint-disable @darraghor/nestjs-typed/api-method-should-specify-api-response */
import { Body, Controller, Get, Logger, Post } from "@nestjs/common";

import { LanguageEnum } from "../../../shop-shared/constants/localization";
import { CategoriesNodeAdminDto } from "../../../shop-shared/dto/category/categoriesTree.dto";
import { CategoryDto } from "../../../shop-shared/dto/category/category.dto";
import {
	mapCategoriesNodeDTOToCategoryNode,
	mapCategoriesTreeDocumentToCategoriesTreeAdminDto,
} from "../../../shop-shared-server/mapper/category/map.categoriesTreeDocument.to.categoriesTreeAdminDto";
import { mapCategoryToCategoryDto } from "../../../shop-shared-server/mapper/category/map.category.to.categoryDto";
import { CategoryService } from "../../../shop-shared-server/service/category/category.service";

@Controller("category")
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	private logger: Logger = new Logger(CategoryController.name);

	@Get("tree")
	async getCategoriesTrees(): Promise<CategoriesNodeAdminDto[]> {
		const categoriesTree = await this.categoryService.getCategoriesTree();
		return mapCategoriesTreeDocumentToCategoriesTreeAdminDto(categoriesTree).root;
	}

	@Post("tree")
	async saveCategoriesTrees(@Body() categoriesNodes: CategoriesNodeAdminDto[]): Promise<void> {
		const nodes = categoriesNodes.map((node) => mapCategoriesNodeDTOToCategoryNode(node));
		await this.categoryService.saveCategoriesTree(nodes);
	}

	@Get("list")
	async getCategories(): Promise<CategoryDto[]> {
		const categories = await this.categoryService.getCategories();
		return categories.map((category) => mapCategoryToCategoryDto(category, LanguageEnum.ua));
	}
}
