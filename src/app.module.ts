import { Logger, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { GracefulShutdownModule } from "nestjs-graceful-shutdown";

import { validateAndThrow } from "@/shop-shared-server/helpers/validateAndThrow";
import { MainConfigModule } from "@/src/config/main.config.module";
import MainConfigService from "@/src/config/main.config.service";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ShopModule } from "./shop/shop.module";

const logger: Logger = new Logger("AdminModule");

@Module({
	imports: [
		GracefulShutdownModule.forRoot({
			cleanup: async () => {
				logger.log("Graceful shutdown...");
				await mongoose.disconnect();
				logger.log("Graceful shutdown completed");
			},
			gracefulShutdownTimeout: 30 * 1000,
		}),
		MainConfigModule,
		MongooseModule.forRootAsync({
			inject: [MainConfigService],
			imports: [MainConfigModule],
			useFactory: async (configService: MainConfigService) => ({
				uri: configService.MONGO_URL,
				autoIndex: true,
			}),
		}),
		ShopModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {
	constructor() {
		mongoose.plugin((schema) => {
			schema.post("save", validateAndThrow);
		});
	}
}
