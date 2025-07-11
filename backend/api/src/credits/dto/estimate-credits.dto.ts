import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class EstimateCreditsDto {
  @IsString()
  modelId: string;

  @IsNumber()
  @Min(0)
  inputTokens: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  outputTokens?: number;
}