import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/guards/jwt-auth.guard';
import { CreateReviewDto, RespondReviewDto } from './dto/review.dto';

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post('bookings/:id/review')
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() u: RequestUser, @Param('id') id: string, @Body() dto: CreateReviewDto) {
    return this.reviews.create(u.userId, id, dto.rating, dto.comment);
  }

  @Post('reviews/:id/response')
  @UseGuards(JwtAuthGuard)
  respond(@CurrentUser() u: RequestUser, @Param('id') id: string, @Body() dto: RespondReviewDto) {
    return this.reviews.respond(u.userId, id, dto.response);
  }

  @Get('providers/:id/reviews')
  list(@Param('id') id: string) {
    return this.reviews.listForProvider(id);
  }
}
