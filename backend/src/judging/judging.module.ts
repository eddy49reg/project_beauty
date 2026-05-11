import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JudgingController } from './judging.controller';
import { JudgingService } from './judging.service';

@Module({
  imports: [AuthModule],
  controllers: [JudgingController],
  providers: [JudgingService],
})
export class JudgingModule {}
