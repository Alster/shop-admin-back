import * as fs from "node:fs";
import * as path from "node:path";

import { Logger } from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { ClassConstructor } from "class-transformer/types/interfaces";
import { validateSync } from "class-validator";

import { EnvironmentVariables } from "./environment-variables";

export class AppConfig<T extends object> {
	protected static readonly logger: Logger = new Logger(AppConfig.name);
	public readonly env: string;
	protected readonly v: T;

	constructor(cls: ClassConstructor<T>) {
		const [config, environment] = this.loadConfig(cls);
		this.v = config;
		this.env = environment;
	}

	public get(): T {
		return this.v;
	}

	public isTest(): boolean {
		return process.env["NODE_ENV"] == "test";
	}

	public isProd(): boolean {
		return process.env["NODE_ENV"] == "production";
	}

	private loadConfig(cls: ClassConstructor<T>): [T, string] {
		const environment = process.env["NODE_ENV"] || "local";
		const configDirectory = process.cwd();

		const defaultFilePath = path.join(configDirectory, `config/default.json`);
		const defaultConfig = fs.existsSync(defaultFilePath)
			? JSON.parse(fs.readFileSync(defaultFilePath).toString())
			: {};

		const environmentFilePath = path.join(configDirectory, `config/${environment}.json`);
		AppConfig.logger.log(`Loading environment from ${environmentFilePath}`);
		const environmentConfig = JSON.parse(fs.readFileSync(environmentFilePath).toString());

		const combinedConfig = { ...defaultConfig, ...environmentConfig };

		if (this.isTest()) {
			const testPort = (4000 + Math.ceil(Math.random() * 999)).toString();
			AppConfig.logger.log("-=*TEST*=-");
			combinedConfig["port"] = testPort;
		}
		const classConfig = plainToClass(cls, combinedConfig, {
			enableImplicitConversion: true,
		});

		// if (!this.isProd()) {
		AppConfig.logger.log(JSON.stringify(classConfig, undefined, 2));
		// }

		const errors = validateSync(classConfig);
		if (errors.length > 0) {
			throw new Error(errors.toString());
		}
		return [classConfig, environment];
	}
}

const Config = new AppConfig(EnvironmentVariables);
export { Config };
