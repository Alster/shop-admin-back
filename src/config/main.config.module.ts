import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import MainConfigService from './main.config.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            expandVariables: true,
            isGlobal: true,
            envFilePath: [process.env['NODE_ENV'] ? `.env.${process.env['NODE_ENV']}` : '.env'],
        }),
    ],
    controllers: [],
    providers: [MainConfigService],
    exports: [MainConfigService],
})
export class MainConfigModule {}
