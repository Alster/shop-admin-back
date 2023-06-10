import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ShopModule } from './shop/shop.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Config } from './config/config';
import mongoose from 'mongoose';
import { validateAndThrow } from '../shop-shared-server/helpers/validate-and-throw';

@Module({
  imports: [
    MongooseModule.forRoot(Config.get().mongo.url, Config.get().mongo.options),
    ShopModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
    mongoose.plugin((schema, options) => {
      schema.post('save', async (doc) => {
        await validateAndThrow(doc);
      });
    });
  }
}
