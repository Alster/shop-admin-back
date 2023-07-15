import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import mongoose from "mongoose";

import { validateAndThrow } from "../shop-shared-server/helpers/validateAndThrow";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { Config } from "./config/config";
import { ShopModule } from "./shop/shop.module";

@Module({
	imports: [
		MongooseModule.forRoot(Config.get().mongo.url, Config.get().mongo.options),
		ShopModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {
	constructor() {
		mongoose.plugin((schema, options) => {
			schema.post("save", async (document) => {
				await validateAndThrow(document);
			});
		});
	}
}
