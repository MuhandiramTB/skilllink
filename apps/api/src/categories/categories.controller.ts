import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  /** GET /api/v1/categories — trilingual category tree incl. Solar sub-categories. */
  @Get()
  tree() {
    return this.categories.tree();
  }
}

/** Public, active districts for registration dropdowns. */
@Controller('districts')
export class PublicDistrictsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('public')
  active() {
    return this.prisma.districts.findMany({
      where: { is_active: true },
      select: { id: true, name_en: true, name_si: true, name_ta: true },
      orderBy: { name_en: 'asc' },
    });
  }
}
