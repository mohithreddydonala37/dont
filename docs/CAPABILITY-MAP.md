# Capability Map: DON’T SEND THAT

| Module ID | Responsibility | Depends on |
| --- | --- | --- |
| foundation | Independently runnable Next.js and Express applications, health contract, environment boundaries, and app shell | — |
| message-analysis | Validate a submitted message and obtain structured communication analysis from Gemma 3 through Ollama | foundation |
| rewrites | Produce three goal-led rewrites and before/after AI-estimated communication-risk comparisons through Gemma 3 | message-analysis |
| voice | Send an approved rewrite to ElevenLabs from the backend and return playable audio | rewrites |
| local-history | Persist the user’s local draft and recent work in browser localStorage | foundation |

Build order: foundation → message-analysis → rewrites → voice, local-history

## Boundary notes

- Gemma 3 is the AI model. Ollama is only its local inference runtime.
- The frontend talks only to the Express backend. It never receives ElevenLabs credentials or calls ElevenLabs directly.
- The foundation module exposes only a health endpoint. The later API contracts belong to their provider modules.
