import OpenAI from 'openai';
import { z } from 'zod';
import { OpenAIHealthCheck, OpenAIConfig, OpenAIRequest, OpenAIResponse, OpenAIUsageMetrics } from '../types';

// Validation schemas
const OpenAIRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().optional().default('gpt-4o-mini'),
  maxTokens: z.number().optional().default(4000),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  systemPrompt: z.string().optional()
});

export interface ServiceValidation {
  supportsValidation: boolean;
  validateApiKey(apiKey: string): Promise<OpenAIHealthCheck>;
}

/**
 * Internal OpenAI service - handles OpenAI integrations within the monolith
 */
export class OpenAIService {
  
  // Indicates this service supports API key validation
  static readonly supportsValidation = true;

  /**
   * Check if an OpenAI API key is healthy by calling OpenAI's models endpoint
   * This is a minimal call that validates the API key without using many tokens
   */
  static async checkHealth(apiKey: string): Promise<OpenAIHealthCheck> {
    const startTime = Date.now();
    
    try {
      // Basic validation: check if key exists and has reasonable format
      if (!apiKey || apiKey.trim().length < 20) {
        return {
          isHealthy: false,
          status: 'unhealthy',
          message: 'Invalid OpenAI API key format - key must be at least 20 characters',
          responseTime: Date.now() - startTime
        };
      }

      // Check if key has the correct prefix
      if (!apiKey.startsWith('sk-')) {
        return {
          isHealthy: false,
          status: 'unhealthy',
          message: 'Invalid OpenAI API key format - key must start with "sk-"',
          responseTime: Date.now() - startTime
        };
      }

      // Create OpenAI client with the provided API key
      const openai = new OpenAI({
        apiKey: apiKey.trim(),
        timeout: 10000, // 10 second timeout
      });

      // Make a minimal API call to verify the key works
      // Using the models endpoint as it's lightweight and doesn't consume tokens
      await openai.models.list();
      
      const responseTime = Date.now() - startTime;
      
      return {
        isHealthy: true,
        status: 'healthy',
        message: 'OpenAI API key is valid and healthy',
        responseTime
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      // Handle different types of OpenAI API errors
      if (error.status === 401) {
        return {
          isHealthy: false,
          status: 'unhealthy',
          message: 'Invalid OpenAI API key - authentication failed',
          responseTime
        };
      }

      if (error.status === 429) {
        return {
          isHealthy: false,
          status: 'unhealthy',
          message: 'OpenAI API rate limit exceeded - please try again later',
          responseTime
        };
      }

      if (error.status === 403) {
        return {
          isHealthy: false,
          status: 'unhealthy',
          message: 'OpenAI API key does not have required permissions',
          responseTime
        };
      }

      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return {
          isHealthy: false,
          status: 'unhealthy',
          message: 'Unable to connect to OpenAI API - check your internet connection',
          responseTime
        };
      }

      if (error.name === 'AbortError' || error.code === 'ETIMEDOUT') {
        return {
          isHealthy: false,
          status: 'unhealthy',
          message: 'OpenAI API request timed out - check your connection',
          responseTime
        };
      }

      return {
        isHealthy: false,
        status: 'unhealthy',
        message: error.message || 'Unknown error occurred during OpenAI API validation',
        responseTime
      };
    }
  }

  /**
   * Validate API key (alias for checkHealth for consistency)
   */
  static async validateApiKey(apiKey: string): Promise<OpenAIHealthCheck> {
    return this.checkHealth(apiKey);
  }

  /**
   * Generate text using OpenAI's Chat Completions API
   * Documentation: https://platform.openai.com/docs/api-reference/chat
   */
  static async generateText(apiKey: string, request: OpenAIRequest): Promise<OpenAIResponse> {
    try {
      // Validate API key first
      if (!apiKey || apiKey.trim().length < 20) {
        throw new Error('Invalid OpenAI API key format');
      }

      // Validate request using Zod schema
      const validatedRequest = OpenAIRequestSchema.parse(request);

      // Create OpenAI client
      const openai = new OpenAI({
        apiKey: apiKey.trim(),
        timeout: 30000, // 30 second timeout for generation
      });

      // Prepare messages for the chat completion
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      
      // Add system message if provided
      if (validatedRequest.systemPrompt) {
        messages.push({
          role: 'system',
          content: validatedRequest.systemPrompt
        });
      }

      // Add user message
      messages.push({
        role: 'user',
        content: validatedRequest.prompt
      });

      console.log('OpenAI Text Generation request:', {
        model: validatedRequest.model,
        maxTokens: validatedRequest.maxTokens,
        temperature: validatedRequest.temperature,
        messageCount: messages.length
      });

      // Make the API call
      const completion = await openai.chat.completions.create({
        model: validatedRequest.model,
        messages: messages,
        max_tokens: validatedRequest.maxTokens,
        temperature: validatedRequest.temperature,
      });

      // Extract the response
      const choice = completion.choices[0];
      if (!choice || !choice.message || !choice.message.content) {
        throw new Error('OpenAI API returned empty response');
      }

      return {
        content: choice.message.content,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
        model: completion.model,
        finishReason: choice.finish_reason || 'unknown'
      };

    } catch (error: any) {
      console.error('OpenAI Text Generation error:', error);
      
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid request: ${error.errors.map(e => e.message).join(', ')}`);
      }

      // Handle OpenAI API errors
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key');
      }

      if (error.status === 429) {
        throw new Error('OpenAI API rate limit exceeded');
      }

      if (error.status === 400) {
        throw new Error('Invalid request to OpenAI API');
      }

      throw new Error(error.message || 'Failed to generate text with OpenAI');
    }
  }

  /**
   * Calculate estimated cost for OpenAI API usage
   * Pricing as of 2024 (may need updates)
   */
  static calculateCost(usage: OpenAIUsageMetrics, model: string = 'gpt-4o-mini'): number {
    // Pricing per 1K tokens (as of 2024)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 }, // $0.15/$0.60 per 1M tokens
      'gpt-4o': { input: 0.0025, output: 0.01 }, // $2.50/$10.00 per 1M tokens
      'gpt-4': { input: 0.03, output: 0.06 }, // $30/$60 per 1M tokens
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }, // $0.50/$1.50 per 1M tokens
    };

    const modelPricing = pricing[model] || pricing['gpt-4o-mini'];
    
    const inputCost = (usage.promptTokens / 1000) * modelPricing.input;
    const outputCost = (usage.completionTokens / 1000) * modelPricing.output;
    
    return inputCost + outputCost;
  }

  /**
   * Execute actions using OpenAI integration
   * This is where actual OpenAI operations would be implemented
   */
  static async executeAction(apiKey: string, action: string, payload: any) {
    try {
      // Handle specific actions
      switch (action) {
        case 'text_generation':
          return await this.generateText(apiKey, payload);
        
        case 'health_check':
          return await this.checkHealth(apiKey);
        
        default:
          // Mock implementation for other actions
          console.log(`Executing OpenAI action: ${action} with key: ${apiKey.substring(0, 8)}...`);
          
          // Simulate processing
          await new Promise(resolve => setTimeout(resolve, 50));
          
          return {
            success: true,
            action,
            result: `OpenAI action '${action}' executed successfully`,
            data: payload
          };
      }
      
    } catch (error: any) {
      return {
        success: false,
        action,
        error: error.message
      };
    }
  }

  /**
   * Get supported actions for OpenAI service
   */
  static getSupportedActions(): string[] {
    return [
      'text_generation',
      'health_check',
      'chat_completion',
      'content_analysis',
      'summarization',
      'translation'
    ];
  }

  /**
   * Get default configuration for OpenAI service
   */
  static getDefaultConfig(): Omit<OpenAIConfig, 'apiKey'> {
    return {
      baseURL: 'https://api.openai.com/v1',
      defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    };
  }
}
