import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChampionshipsModule } from '../championships/championships.module';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';

@Module({
  imports: [AuthModule, ChampionshipsModule],
  controllers: [MembershipsController],
  providers: [MembershipsService],
})
export class MembershipsModule {}
