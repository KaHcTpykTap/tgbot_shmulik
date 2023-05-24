import { Configuration, OpenAIApi } from "openai";
import config from "config";
import { createReadStream } from "fs";

class OpenAI {
  roles = {
    ASSISTANT: "assistant",
    USER: "user",
    SYSTEM: "system",
  };
  constructor(apiKey) {
    const configuration = new Configuration({
      apiKey,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async chat(messages) {
    try {
      const response = await this.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages,
      });

      return response.data.choices[0].message;
    } catch (error) {
      console.log("Error while gpt chat", error.message);
    }
  }
  async createImage(text) {
    try {
      const response = await this.openai.createImage({
        prompt: text,
        n: 1,
        size: "1024x1024",
      });
      return response.data.data[0].url;
    } catch (error) {
      console.log("Error while gpt chat", error.message);
    }
  }

  async transcription(filepath) {
    try {
      const response = await this.openai.createTranscription(
        createReadStream(filepath),
        "whisper-1"
      );
      return response.data.text;
    } catch (e) {
      console.log("Error while transcription", e.message);
      return "ERROR TRANSCRIPTION";
    }
  }
}

export const openai = new OpenAI(config.get("OPENAI_KEY"));
