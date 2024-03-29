import { MongooseModuleOptions } from "@nestjs/mongoose/dist/interfaces/mongoose-options.interface";
import { IsPort, IsUrl } from "class-validator";

export class MongoConfig {
	@IsUrl()
	readonly url!: string;

	readonly options!: MongooseModuleOptions;
}

export class EnvironmentVariables {
	@IsPort()
	readonly port!: string;
	readonly mongo!: MongoConfig;

	readonly s3!: {
		readonly endpoint: string;
		readonly accessKeyId: string;
		readonly secretAccessKey: string;
		readonly bucket: string;
		readonly region: string;
	};
}
