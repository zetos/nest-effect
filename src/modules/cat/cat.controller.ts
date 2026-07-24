import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { Effect } from 'effect';
import { ParseError } from 'effect/ParseResult';
import { CatDto } from './cat.dto';
import { CatService } from './cat.service';
import type { Cat } from './cat.type';

@Controller('cats')
export class CatController {
  constructor(private readonly catService: CatService) {}

  @Get()
  getCats(): Effect.Effect<Cat[]> {
    return this.catService.getCats();
  }

  @Post()
  createCat(@Body() catDto: CatDto): Effect.Effect<string, ParseError> {
    return this.catService.createCat(catDto.name);
  }

  @Get(':id')
  getCat(@Param('id') id: string): Effect.Effect<Cat, NotFoundException> {
    return this.catService.getCat(id);
  }
}
