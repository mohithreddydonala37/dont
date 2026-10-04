import { VoiceAudio } from "../../types/voice.js";

const elevenLabsBaseUrl = "https://api.elevenlabs.io/v1";
const defaultModelId = "eleven_multilingual_v2";
const requestTimeoutMs = 30_000;

export class VoiceConfigurationError extends Error {}
export class VoiceAuthenticationError extends Error {}
export class VoiceRateLimitError extends Error {}
export class VoiceUpstreamError extends Error {}
export class VoiceTimeoutError extends Error {}

export class ElevenLabsVoiceService {
  async generateSpeech(text: string): Promise<VoiceAudio> {
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim();

    if (!apiKey || !voiceId) {
      throw new VoiceConfigurationError("ElevenLabs API key and voice ID are required.");
    }

    const endpoint = new URL(`${elevenLabsBaseUrl}/text-to-speech/${encodeURIComponent(voiceId)}/stream`);
    endpoint.searchParams.set("output_format", "mp3_44100_128");

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: defaultModelId,
        }),
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new VoiceTimeoutError("ElevenLabs request timed out.");
      }
      throw new VoiceUpstreamError("ElevenLabs request failed.");
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new VoiceAuthenticationError("ElevenLabs authentication failed.");
      }
      if (response.status === 429) {
        throw new VoiceRateLimitError("ElevenLabs rate limit reached.");
      }
      throw new VoiceUpstreamError("ElevenLabs returned an unsuccessful response.");
    }

    const arrayBuffer = await response.arrayBuffer();
    const audio = Buffer.from(arrayBuffer);
    if (audio.length === 0) {
      throw new VoiceUpstreamError("ElevenLabs returned empty audio.");
    }

    return { audio, contentType: "audio/mpeg" };
  }
}
