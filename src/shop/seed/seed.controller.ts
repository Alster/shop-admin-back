/* eslint-disable @darraghor/nestjs-typed/api-method-should-specify-api-response */
import { Controller, Post } from "@nestjs/common";

import SeedService from "./seed.service";

@Controller("seed")
export default class SeedController {
	constructor(private readonly seedService: SeedService) {}

	@Post("categories")
	async seedCategories(): Promise<void> {
		return this.seedService.seedCategories();
	}

	@Post("attributes")
	async seedAttributes(): Promise<void> {
		return this.seedService.seedAttributes();
	}

	@Post("products")
	async seedProducts(): Promise<void> {
		return this.seedService.seedProducts();
	}
}
