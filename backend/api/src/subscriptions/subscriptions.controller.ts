import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionPlan } from './entities/subscription.entity';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('my-subscription')
  async getMySubscription(@Request() req) {
    return this.subscriptionsService.findByUserId(req.user.id);
  }

  @Get('credits')
  async getCredits(@Request() req) {
    const credits = await this.subscriptionsService.getCreditsRemaining(req.user.id);
    return { credits };
  }

  @Post('use-credits')
  async useCredits(@Request() req, @Body() body: { amount: number }) {
    const success = await this.subscriptionsService.useCredits(
      req.user.id,
      body.amount,
    );
    return { success };
  }

  // This would typically be called by a webhook from Stripe
  @Patch('update-plan')
  async updatePlan(
    @Request() req,
    @Body() body: { 
      planType: SubscriptionPlan;
      stripeSubscriptionId?: string;
      stripePriceId?: string;
    },
  ) {
    return this.subscriptionsService.updatePlan(
      req.user.id,
      body.planType,
      body.stripeSubscriptionId,
      body.stripePriceId,
    );
  }
}