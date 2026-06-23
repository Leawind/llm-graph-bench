import { OpenAI } from "openai";
import type { LLMConfig } from "./types.ts";

export class LLMClient {
  private client: OpenAI;
  private model: string;

  constructor(config: LLMConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey || "not-needed",
      baseURL: config.baseUrl,
    });
    this.model = config.model;
  }

  async chatCompletion(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content ?? "";
  }
}
