import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/guards/jwt-auth.guard';
import { AdminCategoriesService } from './admin-categories.service';
import { AdminDistrictsService } from './admin-districts.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateDistrictDto, UpdateDistrictDto } from './dto/district.dto';

/** All routes require role=admin (AdminGuard). Spec 06-admin-master-data. */
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly categories: AdminCategoriesService,
    private readonly districts: AdminDistrictsService,
  ) {}

  // ---- Categories ----
  @Get('categories')
  listCategories() {
    return this.categories.list();
  }

  @Post('categories')
  createCategory(@CurrentUser() user: RequestUser, @Body() dto: CreateCategoryDto) {
    return this.categories.create(user.userId, dto);
  }

  @Patch('categories/:id')
  updateCategory(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categories.update(user.userId, id, dto);
  }

  @Delete('categories/:id')
  deactivateCategory(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.categories.deactivate(user.userId, id);
  }

  /** Hard delete (permanent) — guarded against sub-services / bookings in use. */
  @Delete('categories/:id/hard')
  deleteCategory(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.categories.remove(user.userId, id);
  }

  // ---- Districts ----
  @Get('districts')
  listDistricts() {
    return this.districts.list();
  }

  @Post('districts')
  createDistrict(@CurrentUser() user: RequestUser, @Body() dto: CreateDistrictDto) {
    return this.districts.create(user.userId, dto);
  }

  /** PATCH handles both rename (name_*) and activate/deactivate (is_active). */
  @Patch('districts/:id')
  updateDistrict(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateDistrictDto,
  ) {
    if (dto.name_en !== undefined || dto.name_si !== undefined || dto.name_ta !== undefined) {
      return this.districts.update(user.userId, id, dto);
    }
    return this.districts.setActive(user.userId, id, dto.is_active ?? false);
  }

  /** Hard delete (permanent) — guarded against users/providers/bookings in use. */
  @Delete('districts/:id')
  deleteDistrict(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.districts.remove(user.userId, id);
  }
}
