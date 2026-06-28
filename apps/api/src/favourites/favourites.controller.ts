import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { FavouritesService } from './favourites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/guards/jwt-auth.guard';

/** Customer favourites (spec 14). All routes require auth; the customer is the current user. */
@Controller('favourites')
@UseGuards(JwtAuthGuard)
export class FavouritesController {
  constructor(private readonly favourites: FavouritesService) {}

  @Get()
  list(@CurrentUser() u: RequestUser) {
    return this.favourites.list(u.userId);
  }

  @Get('ids')
  ids(@CurrentUser() u: RequestUser) {
    return this.favourites.ids(u.userId);
  }

  @Post(':providerId')
  toggle(@CurrentUser() u: RequestUser, @Param('providerId') providerId: string) {
    return this.favourites.toggle(u.userId, providerId);
  }

  @Delete(':providerId')
  remove(@CurrentUser() u: RequestUser, @Param('providerId') providerId: string) {
    return this.favourites.remove(u.userId, providerId);
  }
}
