import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CatService } from './cat.service';
import type { Cat } from './cat.type';

@Controller('cats')
export class CatController {
  constructor(private readonly catService: CatService) {}

  @Get()
  getCats(): Cat[] {
    return this.catService.getCats();
  }

  @Post()
  createCat(@Body() catDto: { name: string }): string {
    return this.catService.createCat(catDto.name);
  }

  @Get(':id')
  getCat(@Param('id') id: string): Cat {
    return this.catService.getCat(id);
  }
}
