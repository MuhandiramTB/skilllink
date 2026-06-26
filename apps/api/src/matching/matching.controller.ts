import { Controller, Get, Query } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { MatchQueryDto } from './dto/match-query.dto';

@Controller('match')
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  /**
   * GET /api/v1/match?categoryKey=electrician&lat=7.2906&lng=80.6350
   * Returns ranked providers near a customer (spec: 04-matching-engine).
   */
  @Get()
  match(@Query() q: MatchQueryDto) {
    return this.matching.match({
      categoryKey: q.categoryKey,
      lat: q.lat,
      lng: q.lng,
      limit: q.limit,
    });
  }
}
