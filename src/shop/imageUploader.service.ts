import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectS3, S3 } from "nestjs-s3";
import sharp from "sharp";

import getProductImageFilename from "../../shop-shared/utils/getProductImageFilename";
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

	async onModuleInit(): Promise<void> {
		// console.log("ImageUploaderService.onModuleInit()");
		// const imageBuffer = fs.readFileSync(
		// 	"./671092-beautiful-sunset-wallpapers-2560x1600-for-windows-7.jpg",
		// );
		//
		// await this.uploadImage(imageBuffer, "test.jpg");
	}

	async uploadProductImage(productId: string, referenceImageBuffer: Buffer): Promise<string> {
		const kind = KindEnum.ProductImages;
		const imageId = randomString(FILENAME_SIZE);
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
						// quality: 100,
						quality: 80,
						// chromaSubsampling: "4:4:4",
						force: true,
					})
					.toBuffer();

				const filename = getProductImageFilename(productId, imageId, config.postfix);
				await this.push(filename, proceededImage);
			}),
		);

		return imageId;
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
