import { Module } from '@nestjs/common';
import { CrowController } from './crow.controller';
import { CrowService } from './crow.service';

@Module({
  controllers: [CrowController],
  providers: [CrowService],
})
export class CrowModule {}
