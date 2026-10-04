const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function generateVoice(text: string, signal?: AbortSignal): Promise<Blob> {
  const response = await fetch(`${apiUrl}/api/voice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!response.ok) {
    throw new Error("Couldn't generate audio. Try again.");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("audio/mpeg")) {
    throw new Error("Couldn't generate playable audio. Try again.");
  }

  return response.blob();
}
