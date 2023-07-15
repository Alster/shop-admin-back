import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { Config } from "./config/config";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			enableDebugMessages: true,
		}),
	);
	if (Config.env === "local") {
		app.enableCors();
	}
	await app.listen(Config.get().port);
}
bootstrap();
