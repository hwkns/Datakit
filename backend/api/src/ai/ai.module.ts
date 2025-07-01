import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { CreditsModule } from '../credits/credits.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [CreditsModule, ConfigModule],
  controllers: [AIController],
})
export class AIModule {}