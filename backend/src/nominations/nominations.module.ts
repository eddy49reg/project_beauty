import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChampionshipsModule } from '../championships/championships.module';
import { NominationsController } from './nominations.controller';
import { NominationsService } from './nominations.service';

@Module({
  imports: [AuthModule, ChampionshipsModule],
  controllers: [NominationsController],
  providers: [NominationsService],
})
export class NominationsModule {}
