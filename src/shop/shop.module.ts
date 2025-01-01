import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { S3Module } from "nestjs-s3";

import {
	CategoriesTree,
	CategoriesTreeSchema,
} from "@/shop-shared-server/schema/categoriesTree.schema";
import { Category, CategorySchema } from "@/shop-shared-server/schema/category.schema";
import {
	ItemAttribute,
	ItemAttributeSchema,
} from "@/shop-shared-server/schema/itemAttribute.schema";
import { Order, OrderSchema } from "@/shop-shared-server/schema/order.schema";
import { Product, ProductSchema } from "@/shop-shared-server/schema/product.schema";
import { CategoryService } from "@/shop-shared-server/service/category/category.service";
import { OrderService } from "@/shop-shared-server/service/order/order.service";
import { ProductService } from "@/shop-shared-server/service/product/product.service";
import { MainConfigModule } from "@/src/config/main.config.module";
import MainConfigService from "@/src/config/main.config.service";

import { CategoryController } from "./category/category.controller";
import { ImageUploaderService } from "./imageUploader.service";
import { OrderController } from "./order/order.controller";
import { ProductController } from "./product/product.controller";
import SeedController from "./seed/seed.controller";
import SeedService from "./seed/seed.service";

@Module({
	imports: [
		MainConfigModule,
		MongooseModule.forFeature([
			{ name: Product.name, schema: ProductSchema },
			{ name: ItemAttribute.name, schema: ItemAttributeSchema },
			{ name: CategoriesTree.name, schema: CategoriesTreeSchema },
			{ name: Category.name, schema: CategorySchema },
			{ name: Order.name, schema: OrderSchema },
		]),
		S3Module.forRootAsync({
			inject: [MainConfigService],
			imports: [MainConfigModule],
			useFactory: async (configService: MainConfigService) => ({
				config: {
					credentials: {
						accessKeyId: configService.S3_ACCESS_KEY_ID,
						secretAccessKey: configService.S3_SECRET_ACCESS_KEY,
					},
					region: configService.S3_REGION,
				},
			}),
		}),
	],
	providers: [ProductService, CategoryService, OrderService, ImageUploaderService, SeedService],
	controllers: [ProductController, CategoryController, OrderController, SeedController],
})
export class ShopModule {}
