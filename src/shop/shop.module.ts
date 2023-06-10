import { Module } from '@nestjs/common';
import { ProductController } from './product/product.controller';
import {
  Product,
  ProductSchema,
} from '../../shop-shared-server/schema/product.schema';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ItemAttribute,
  ItemAttributeSchema,
} from '../../shop-shared-server/schema/item-attribute.schema';
import {
  CategoriesTree,
  CategoriesTreeSchema,
} from '../../shop-shared-server/schema/categories-tree.schema';
import { CategoryController } from './category/category.controller';
import {
  Category,
  CategorySchema,
} from '../../shop-shared-server/schema/category.schema';
import { ProductService } from '../../shop-shared-server/service/product/product.service';
import { CategoryService } from '../../shop-shared-server/service/category/category.service';
import { OrderService } from '../../shop-shared-server/service/order/order.service';
import { OrderController } from './order/order.controller';
import {
  Order,
  OrderSchema,
} from '../../shop-shared-server/schema/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ItemAttribute.name, schema: ItemAttributeSchema },
      { name: CategoriesTree.name, schema: CategoriesTreeSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  providers: [ProductService, CategoryService, OrderService],
  controllers: [ProductController, CategoryController, OrderController],
})
export class ShopModule {}
