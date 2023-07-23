import * as Buffer from "node:buffer";
import * as fs from "node:fs";

import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectS3, S3 } from "nestjs-s3";

const sharp = require("sharp");

import randomString from "../../shop-shared-server/helpers/randomString";
import { Config } from "../config/config";
import { ImageConfigurations } from "../constants/imageConfigurations";
import KindEnum from "../constants/kind.enum";

const FILENAME_SIZE = 36;

@Injectable()
export class ImageUploaderService implements OnModuleInit {
	private readonly bucketName: string;
	constructor(@InjectS3() private readonly s3: S3) {
		this.bucketName = Config.get().s3.bucket;
	}

	async onModuleInit() {
		// console.log("ImageUploaderService.onModuleInit()");
		// const imageBuffer = fs.readFileSync(
		// 	"./671092-beautiful-sunset-wallpapers-2560x1600-for-windows-7.jpg",
		// );
		//
		// await this.uploadImage(imageBuffer, "test.jpg");
	}

	async uploadProductImage(referenceImageBuffer: Buffer): Promise<string> {
		const kind = KindEnum.ProductImages;
		const uid = randomString(FILENAME_SIZE);
		const imageConfigs = ImageConfigurations[kind];

		await Promise.all(
			imageConfigs.map(async (config) => {
				const pipeline = sharp(referenceImageBuffer);

				if (config.width && config.height) {
					pipeline.resize({ width: config.width, height: config.height });
				}

				const proceededImage = await pipeline
					.toFormat("jpeg")
					.jpeg({
						quality: 100,
						// quality: 80,
						// chromaSubsampling: "4:4:4",
						force: true,
					})
					.toBuffer();

				const filename = `${kind}/${uid}_${config.postfix}.jpeg`;
				await this.push(filename, proceededImage);
			}),
		);

		return uid;
	}

	private async push(key: string, buffer: Buffer): Promise<void> {
		await this.s3.putObject({
			Bucket: this.bucketName,
			Key: key,
			Body: buffer,
			ContentType: "image/jpeg",
			// ACL: "public-read",
		});
	}
}
