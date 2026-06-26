import { Module } from '@nestjs/common';
import { CategoriesController, PublicDistrictsController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [CategoriesController, PublicDistrictsController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
