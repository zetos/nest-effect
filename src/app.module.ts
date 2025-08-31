import { Module } from '@nestjs/common';
import { CatModule } from './modules/cat/cat.module';

@Module({
  imports: [CatModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
