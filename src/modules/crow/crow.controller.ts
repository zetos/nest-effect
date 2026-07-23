import { Controller, Get } from '@nestjs/common';
import { CrowService } from './crow.service';
import type { Crow, Sleep } from './crow.type';
import { Effect } from 'effect';

@Controller('crows')
export class CrowController {
  constructor(private readonly crowService: CrowService) {}

  @Get('fib')
  getFib(): Effect.Effect<Crow> {
    return this.crowService.getFib();
  }

  @Get('fibP')
  getFibP(): Effect.Effect<Crow> {
    return this.crowService.getFibP();
  }

  @Get('sleep')
  getSleep(): Effect.Effect<Sleep> {
    return this.crowService.getSleep();
  }

  @Get('sleep-effect')
  getSleepEffect(): Effect.Effect<Sleep> {
    return this.crowService.getSleepEffect();
  }
}
