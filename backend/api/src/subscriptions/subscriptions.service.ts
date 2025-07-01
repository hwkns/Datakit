import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from './entities/subscription.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
  ) {}

  async createFreeSubscription(userId: string): Promise<Subscription> {
    const subscription = this.subscriptionsRepository.create({
      userId,
      planType: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      creditsRemaining: 100,
      monthlyCredits: 100,
      creditsResetAt: this.getNextResetDate(),
    });

    return this.subscriptionsRepository.save(subscription);
  }

  async findByUserId(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async updatePlan(
    userId: string,
    planType: SubscriptionPlan,
    stripeSubscriptionId?: string,
    stripePriceId?: string,
  ): Promise<Subscription> {
    const subscription = await this.findByUserId(userId);

    subscription.planType = planType;
    subscription.stripeSubscriptionId = stripeSubscriptionId;
    subscription.stripePriceId = stripePriceId;

    // Update monthly credits based on plan
    switch (planType) {
      case SubscriptionPlan.FREE:
        subscription.monthlyCredits = 100;
        break;
      case SubscriptionPlan.PRO:
        subscription.monthlyCredits = 10000;
        break;
      case SubscriptionPlan.ENTERPRISE:
        subscription.monthlyCredits = -1; // Unlimited
        break;
    }

    return this.subscriptionsRepository.save(subscription);
  }

  async useCredits(userId: string, amount: number): Promise<boolean> {
    const subscription = await this.findByUserId(userId);

    // Enterprise has unlimited credits
    if (subscription.planType === SubscriptionPlan.ENTERPRISE) {
      return true;
    }

    if (subscription.creditsRemaining < amount) {
      return false;
    }

    subscription.creditsRemaining -= amount;
    await this.subscriptionsRepository.save(subscription);
    return true;
  }

  async getCreditsRemaining(userId: string): Promise<number> {
    const subscription = await this.findByUserId(userId);

    // Enterprise has unlimited credits
    if (subscription.planType === SubscriptionPlan.ENTERPRISE) {
      return -1;
    }

    return subscription.creditsRemaining;
  }

  private getNextResetDate(): Date {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth;
  }

  // Reset credits monthly
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetMonthlyCredits() {
    const now = new Date();
    const subscriptions = await this.subscriptionsRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
      },
    });

    for (const subscription of subscriptions) {
      if (subscription.creditsResetAt && subscription.creditsResetAt <= now) {
        subscription.creditsRemaining = subscription.monthlyCredits;
        subscription.creditsResetAt = this.getNextResetDate();
        await this.subscriptionsRepository.save(subscription);
      }
    }
  }
}
