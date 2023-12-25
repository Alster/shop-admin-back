import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { S3Module } from "nestjs-s3";

import {
	CategoriesTree,
	CategoriesTreeSchema,
} from "../../shop-shared-server/schema/categoriesTree.schema";
import { Category, CategorySchema } from "../../shop-shared-server/schema/category.schema";
import {
	ItemAttribute,
	ItemAttributeSchema,
} from "../../shop-shared-server/schema/itemAttribute.schema";
import { Order, OrderSchema } from "../../shop-shared-server/schema/order.schema";
import { Product, ProductSchema } from "../../shop-shared-server/schema/product.schema";
import { CategoryService } from "../../shop-shared-server/service/category/category.service";
import { OrderService } from "../../shop-shared-server/service/order/order.service";
import { ProductService } from "../../shop-shared-server/service/product/product.service";
import { Config } from "../config/config";
import { CategoryController } from "./category/category.controller";
import { ImageUploaderService } from "./imageUploader.service";
import { OrderController } from "./order/order.controller";
import { ProductController } from "./product/product.controller";
import SeedController from "./seed/seed.controller";
import SeedService from "./seed/seed.service";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Product.name, schema: ProductSchema },
			{ name: ItemAttribute.name, schema: ItemAttributeSchema },
			{ name: CategoriesTree.name, schema: CategoriesTreeSchema },
			{ name: Category.name, schema: CategorySchema },
			{ name: Order.name, schema: OrderSchema },
		]),
		S3Module.forRoot({
			config: {
				credentials: {
					accessKeyId: Config.get().s3.accessKeyId,
					secretAccessKey: Config.get().s3.secretAccessKey,
				},
				region: Config.get().s3.region,
				// forcePathStyle: true,
			},
		}),
	],
	providers: [ProductService, CategoryService, OrderService, ImageUploaderService, SeedService],
	controllers: [ProductController, CategoryController, OrderController, SeedController],
})
export class ShopModule {}
