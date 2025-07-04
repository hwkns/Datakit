# AI Providers Implementation Guide

This document explains how each AI provider is implemented in DataKit, including their specific token usage tracking, streaming capabilities, and best practices followed.

## Overview

DataKit supports four AI providers:
- **OpenAI** (GPT models)
- **Anthropic** (Claude models) 
- **Groq** (Fast inference)
- **WebLLM** (Local models)

Each provider implements consistent interfaces while handling their specific API quirks and token counting methods.

## Provider Implementations

### 🤖 OpenAI Provider (`openai.ts`)

**Models Supported:** GPT-3.5, GPT-4, GPT-4 Turbo, etc.

#### Token Usage Implementation
```typescript
// Non-streaming: Direct usage from API response
usage: {
  promptTokens: data.usage.prompt_tokens || 0,
  completionTokens: data.usage.completion_tokens || 0,
  totalTokens: data.usage.total_tokens || (prompt + completion)
}

// Streaming: Requires special parameter
body: {
  stream: true,
  stream_options: { include_usage: true } // Essential for token usage!
}
```

#### Key Features
- **Streaming Setup**: Must include `stream_options: { include_usage: true }` to get token usage in streaming mode
- **Token Fields**: Uses standard `prompt_tokens` and `completion_tokens`
- **Usage Timing**: Token usage appears in final stream chunk when `[DONE]` is received
- **Cost Calculation**: Based on per-token pricing (varies by model)

#### Best Practices Followed
- Fallback calculation for `total_tokens` if not provided
- Robust error handling for CORS issues
- Proper cleanup of stream readers

---

### 🧠 Anthropic Provider (`anthropic.ts`)

**Models Supported:** Claude 3 Sonnet, Claude 3 Opus, Claude 3.5 Sonnet

#### Token Usage Implementation
```typescript
// Total Input Tokens = input_tokens + cache_creation_input_tokens + cache_read_input_tokens
const totalInputTokens = (usage.input_tokens || 0) + 
                        (usage.cache_creation_input_tokens || 0) + 
                        (usage.cache_read_input_tokens || 0);

usage: {
  promptTokens: totalInputTokens,
  completionTokens: usage.output_tokens || 0,
  totalTokens: totalInputTokens + output_tokens
}
```

#### Key Features
- **Caching Support**: Properly calculates total input tokens including cached tokens
- **Streaming Events**: 
  - `message_start`: Contains initial usage with input tokens
  - `message_delta`: Contains updated output tokens  
  - `content_block_delta`: Contains text content
  - `message_stop`: Signals completion
- **Message Format**: Separates system messages from conversation messages
- **Billing Accuracy**: Follows Anthropic's official billing documentation

#### Best Practices Followed
- Accurate token calculation per Anthropic's billing model
- Handles prompt caching for cost optimization
- Robust stream event parsing
- Proper conversion between OpenAI-style and Anthropic message formats

---

### ⚡ Groq Provider (`groq.ts`)

**Models Supported:** Llama, Mixtral, Gemma (fast inference)

#### Token Usage Implementation
```typescript
// OpenAI-compatible API
let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

// Updates throughout stream
if (parsed.usage) {
  totalUsage = {
    promptTokens: parsed.usage.prompt_tokens || 0,
    completionTokens: parsed.usage.completion_tokens || 0,
    totalTokens: parsed.usage.total_tokens || 0,
  };
}
```

#### Key Features
- **OpenAI Compatibility**: Uses same API structure as OpenAI
- **Fast Inference**: Optimized for speed with competitive pricing
- **Stream Buffering**: Proper handling of incomplete JSON chunks
- **Usage Accumulation**: Tracks tokens throughout the streaming process
- **Robust Parsing**: Handles malformed SSE data gracefully

#### Best Practices Followed
- Buffer management for streaming data
- Graceful handling of parse errors
- Consistent token reporting format
- Efficient cost calculation

---

### 💻 WebLLM Provider (`webllm.ts`)

**Models Supported:** Local models running in browser via WebAssembly

#### Token Usage Implementation
```typescript
// Local models - no actual token billing
usage: undefined // or estimated tokens for UI consistency
```

#### Key Features
- **Browser-based**: Runs entirely in the user's browser
- **No API Keys**: No external API calls required
- **WebGPU Support**: Hardware acceleration when available
- **Model Loading**: Downloads and caches models locally
- **Privacy**: All processing happens locally

#### Best Practices Followed
- WebGPU feature detection
- Progress tracking for model downloads
- Memory management for large models
- Fallback to CPU when WebGPU unavailable

---

## Token Usage Display

All providers feed into a unified token usage display system:

```typescript
// Unified interface in UI
{showCostEstimates && currentTokenUsage && (
  <div className="flex items-center gap-3 text-xs text-white/60">
    <div className="flex items-center gap-1">
      <span>Tokens:</span>
      <span className="text-white/80 font-mono">
        {totalTokens.toLocaleString()}
      </span>
      <span className="text-white/40">
        ({currentTokenUsage.input.toLocaleString()} + {currentTokenUsage.output.toLocaleString()})
      </span>
    </div>
    {cost > 0 && (
      <div className="flex items-center gap-1">
        <Coins className="h-3 w-3" />
        <span className="text-white/80 font-mono">
          ${cost.toFixed(4)}
        </span>
      </div>
    )}
  </div>
)}
```

## Cost Calculation

Each provider implements its own cost calculation based on current pricing:

- **OpenAI**: Model-specific pricing (GPT-4 > GPT-3.5)
- **Anthropic**: Tiered pricing based on model size and caching
- **Groq**: Competitive per-token pricing
- **WebLLM**: Free (local processing)

## Debugging

All providers include comprehensive logging with 📊 emojis for easy identification:

```typescript
console.log('📊 OpenAI usage data found:', parsed.usage);
console.log('📊 Anthropic usage in message_delta:', parsed.usage);
console.log('📊 Groq usage data found:', parsed.usage);
```

## Common Patterns

### Error Handling
All providers use `handleCORSError()` for consistent error handling and user-friendly messages.

### Stream Management
- Proper reader cleanup with `finally` blocks
- Graceful handling of network interruptions
- Consistent chunk format across providers

### Token Tracking
- Real-time updates during streaming
- Accurate final counts at completion
- Fallback calculations for missing data

## Configuration

Providers are configured through the `AIService` class:

```typescript
// Set API keys
aiService.setApiKey('openai', 'sk-...', 'gpt-4');
aiService.setApiKey('anthropic', 'sk-ant-...', 'claude-3-sonnet');
aiService.setApiKey('groq', 'gsk_...', 'llama-3');

// Local models
await aiService.loadLocalModel('Llama-3-8B-Instruct-q4f32_1-MLC');
```

## Best Practices Summary

1. **Always include usage tracking** in streaming requests where supported
2. **Handle partial token data** gracefully during streaming
3. **Follow provider-specific billing models** (especially Anthropic's caching)
4. **Implement robust error handling** for network issues
5. **Provide consistent user experience** across all providers
6. **Clean up resources** properly in streaming scenarios
7. **Log comprehensively** for debugging and monitoring

## Future Enhancements

- **Advanced caching strategies** for Anthropic
- **Model-specific optimizations** for each provider
- **Retry logic** for transient failures
- **Usage analytics** and cost tracking
- **Rate limiting** and quota management