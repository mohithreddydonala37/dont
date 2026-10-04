export class OllamaError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "OllamaError";
  }
}

export class OllamaTimeoutError extends OllamaError {
  constructor() {
    super("Ollama did not respond before the request timed out.");
    this.name = "OllamaTimeoutError";
  }
}

export type OllamaGenerateRequest = {
  model: string;
  prompt: string;
  system: string;
  format: Record<string, unknown>;
};

type OllamaGenerateResponse = { response?: unknown };

export class OllamaClient {
  constructor(
    private readonly baseUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
    private readonly timeoutMs = 30_000,
  ) {}

  async generate(request: OllamaGenerateRequest): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(new URL("/api/generate", this.baseUrl), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...request, stream: false, options: { temperature: 0 } }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new OllamaError("Ollama rejected the model request.", response.status);
      }

      const body = await response.json() as OllamaGenerateResponse;
      if (typeof body.response !== "string") {
        throw new OllamaError("Ollama returned an unexpected response.");
      }

      return body.response;
    } catch (error) {
      if (error instanceof OllamaError) throw error;
      if (error instanceof Error && error.name === "AbortError") throw new OllamaTimeoutError();
      throw new OllamaError("Unable to reach Ollama.");
    } finally {
      clearTimeout(timeout);
    }
  }
}
