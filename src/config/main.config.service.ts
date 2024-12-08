import { Injectable } from "@nestjs/common";
import { IsPort, IsString, IsUrl } from "class-validator";

import { validateAndApplyConfig } from "@/shop-shared-server/helpers/validateAndApplyConfig";

class MainConfig {
	@IsPort()
	PORT: string;

	@IsUrl({
		protocols: ["mongodb"],
		host_whitelist: ["localhost", "127.0.0.1"],
	})
	MONGO_URL: string;

	@IsString()
	MONOBANK_API_KEY: string;

	//region S3
	@IsUrl()
	S3_ENDPOINT: string;

	@IsString()
	S3_ACCESS_KEY_ID: string;

	@IsString()
	S3_SECRET_ACCESS_KEY: string;

	@IsString()
	S3_BUCKET: string;

	@IsString()
	S3_REGION: string;
	//endregion
}

@Injectable()
export default class MainConfigService extends MainConfig {
	constructor() {
		super();
		validateAndApplyConfig(MainConfig, this);
	}
}
