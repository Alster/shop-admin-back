import * as Buffer from "node:buffer";
import * as fs from "node:fs";

import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectS3, S3 } from "nestjs-s3";

import { Config } from "../config/config";

@Injectable()
export class ImageUploaderService implements OnModuleInit {
	private readonly bucketName: string;
	constructor(@InjectS3() private readonly s3: S3) {
		this.bucketName = Config.get().s3.bucket;
	}

	async onModuleInit() {
		console.log("ImageUploaderService.onModuleInit()");
		const imageBuffer = fs.readFileSync(
			"./671092-beautiful-sunset-wallpapers-2560x1600-for-windows-7.jpg",
		);

		await this.uploadImage(imageBuffer, "test.jpg");
	}

	async uploadImage(image: Buffer, key: string): Promise<void> {
		console.log("ImageUploaderService.uploadImage()");
		await this.s3.deleteObject({
			Bucket: this.bucketName,
			Key: key,
		});
		await this.s3.putObject({
			Bucket: this.bucketName,
			Key: key,
			Body: image,
			ContentType: "image/jpeg",
			// ACL: "public-read",
		});
	}
}
