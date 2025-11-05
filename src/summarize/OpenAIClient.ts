import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

export class OpenAIClient {
  private client: OpenAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OpenAI API key not provided');
    }

    this.client = new OpenAI({
      apiKey: key,
    });
  }

  async generateSummary(
    projectName: string,
    description: string,
    language?: string
  ): Promise<string> {
    try {
      const prompt = `Summarize this GitHub project in 2-3 sentences:
Project: ${projectName}
Description: ${description}
${language ? `Language: ${language}` : ''}

Provide a clear, concise summary focusing on what the project does and its key features.`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a technical writer who creates concise summaries of GitHub projects.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }

  async analyzeProject(
    projectName: string,
    description: string,
    language?: string,
    stars?: number
  ): Promise<string> {
    try {
      const prompt = `Analyze this GitHub project and provide insights:
Project: ${projectName}
Description: ${description}
${language ? `Language: ${language}` : ''}
${stars ? `Stars: ${stars}` : ''}

Provide an analysis including:
1. Primary use case
2. Target audience
3. Key technical highlights
4. Why it might be trending`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a software engineer analyzing trending GitHub projects.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error analyzing project:', error);
      throw error;
    }
  }
}
