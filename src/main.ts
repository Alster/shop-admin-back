// eslint-disable-next-line @typescript-eslint/no-var-requires,unicorn/prefer-module
require("dotenv").config();

import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { setupGracefulShutdown } from "nestjs-graceful-shutdown";

import getCommonValidationPipe from "@/shop-shared-server/helpers/getCommonValidationPipe";
import MainConfigService from "@/src/config/main.config.service";

import { AppModule } from "./app.module";

const logger = new Logger("Main");

async function bootstrap(): Promise<void> {
	const isLocal = !process.env["NODE_ENV"] || process.env["NODE_ENV"] === "local";

	const app = await NestFactory.create(AppModule);

	// Setup graceful shutdown
	setupGracefulShutdown({ app });

	// Use validation pipe for all routes
	app.useGlobalPipes(getCommonValidationPipe(isLocal));

	// Setup config service
	const configService = app.get(MainConfigService);

	// Setup CORS for local development
	// if (isLocal) {
	app.enableCors();
	// }

	await app.listen(configService.PORT, "0.0.0.0");
	logger.log(`Application is running on: ${await app.getUrl()}`);
}

// eslint-disable-next-line unicorn/prefer-top-level-await
void bootstrap();
