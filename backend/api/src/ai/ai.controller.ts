import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  ForbiddenException,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreditsService } from '../credits/credits.service';
import { ConfigService } from '@nestjs/config';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(
    private creditsService: CreditsService,
    private configService: ConfigService,
  ) {}

  @Post('chat/completions')
  async chatCompletions(
    @Request() req,
    @Body() body: any,
    @Headers('x-ai-provider') provider: string,
  ) {
    const { model, messages } = body;

    // Estimate tokens (rough estimation)
    const estimatedInputTokens = JSON.stringify(messages).length / 4;
    const estimatedOutputTokens = 1000; // Assume max 1k tokens output
    const estimatedCredits = this.creditsService.calculateCredits(
      model,
      estimatedInputTokens,
      estimatedOutputTokens,
    );

    // Check if user has enough credits
    const hasCredits = await this.creditsService.checkCredits(
      req.user.id,
      estimatedCredits,
    );

    if (!hasCredits) {
      throw new ForbiddenException('Insufficient credits');
    }

    try {
      // Make the actual API call based on provider
      let response;
      let actualInputTokens = estimatedInputTokens;
      let actualOutputTokens = 0;

      switch (provider) {
        case 'openai':
          response = await this.callOpenAI(body);
          actualInputTokens = response.usage?.prompt_tokens || estimatedInputTokens;
          actualOutputTokens = response.usage?.completion_tokens || 0;
          break;
        case 'anthropic':
          response = await this.callAnthropic(body);
          actualInputTokens = response.usage?.input_tokens || estimatedInputTokens;
          actualOutputTokens = response.usage?.output_tokens || 0;
          break;
        case 'groq':
          response = await this.callGroq(body);
          actualInputTokens = response.usage?.prompt_tokens || estimatedInputTokens;
          actualOutputTokens = response.usage?.completion_tokens || 0;
          break;
        default:
          throw new BadRequestException('Invalid AI provider');
      }

      // Record actual usage
      await this.creditsService.recordUsage(
        req.user.id,
        model,
        provider,
        actualInputTokens,
        actualOutputTokens,
        messages[messages.length - 1]?.content,
        response.choices?.[0]?.message?.content || response.content?.[0]?.text,
      );

      return response;
    } catch (error) {
      console.error('AI API Error:', error);
      throw new BadRequestException('AI API request failed');
    }
  }

  private async callOpenAI(body: any) {
    const apiKey = this.configService.get('OPENAI_API_KEY');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async callAnthropic(body: any) {
    const apiKey = this.configService.get('ANTHROPIC_API_KEY');
    
    // Convert OpenAI format to Anthropic format
    const anthropicBody = {
      model: body.model,
      messages: body.messages,
      max_tokens: body.max_tokens || 4096,
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicBody),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Convert Anthropic response to OpenAI format
    return {
      choices: [{
        message: {
          role: 'assistant',
          content: data.content[0].text,
        },
      }],
      usage: {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
      },
    };
  }

  private async callGroq(body: any) {
    const apiKey = this.configService.get('GROQ_API_KEY');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    return response.json();
  }
}