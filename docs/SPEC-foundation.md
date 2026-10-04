# Spec: Foundation

## Objective

Create the first runnable slice of **DON’T SEND THAT**, an AI pause button for emotionally charged messages. This slice establishes a polished, accessible writing surface and a secure boundary between the Next.js frontend and Express backend. It deliberately does not analyze, rewrite, synthesize speech, or store user messages.

The user can open the application, understand its purpose, enter a draft, and see whether the backend is reachable. A draft is not submitted in this phase because `/api/analyze` is reserved for the later Gemma 3 integration.

## Scope

### Included

- `frontend/`, an independently runnable Next.js TypeScript application styled with Tailwind CSS.
- `backend/`, an independently runnable Express TypeScript API.
- `GET /api/health`, returning a small non-secret service status response.
- A responsive, keyboard-accessible frontend shell with a message textarea, character count, and non-submitting pause action.
- An unobtrusive backend-status indicator using the health endpoint.
- `.env.example` files that document environment variables without values or secrets.
- Architecture and demo documentation.

### Excluded

- `POST /api/analyze`, `POST /api/rewrite`, and `POST /api/voice` behavior.
- Gemma 3, Ollama, ElevenLabs, browser microphone access, audio playback, and localStorage persistence.
- Authentication, databases, RAG, vector stores, queues, microservices, and deployment infrastructure.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS.
- Backend: Node.js, Express, TypeScript.
- Test tooling: frontend component/unit tests and backend HTTP integration tests, selected during implementation.
- Future AI boundary: Frontend → Express → Ollama → Gemma 3.
- Future voice boundary: Frontend → Express → ElevenLabs.

## Commands

Commands become available after implementation:

```powershell
cd frontend; npm run dev
cd frontend; npm run lint
cd frontend; npm run build
cd frontend; npm test
cd backend; npm run dev
cd backend; npm run build
cd backend; npm test
```

## Project Structure

```text
dont-send-that/
├── frontend/                 # Next.js application
│   ├── app/                  # routes and global styles
│   ├── components/           # focused UI components
│   └── lib/                  # frontend-only helpers
├── backend/                  # Express API
│   └── src/                  # app factory and server entrypoint
└── docs/                     # architecture, demo, and specifications
```

## API Contract

### `GET /api/health`

Success response, HTTP `200`:

```json
{
  "status": "ok",
  "service": "dont-send-that-api"
}
```

The response must not reveal runtime versions, environment values, configured providers, credentials, stack traces, or internal network details.

## Code Style

- TypeScript `strict` mode is enabled in both applications.
- Components are small, named PascalCase functions. Variables and functions use camelCase.
- API routes validate all future untrusted request bodies at the backend boundary.
- UI uses semantic HTML, visible labels, native controls, focus-visible styles, and Tailwind’s spacing scale.

```tsx
export function DraftInput({ value, onChange }: DraftInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor="message-draft">
        What do you want to say?
      </label>
      <textarea
        id="message-draft"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
```

## Testing Strategy

- Backend: an integration test starts the Express app in memory and asserts the exact health response and status code.
- Frontend: a component test asserts the textarea label, character count, and safe disabled pause action without a draft.
- Build and lint run separately in each app after every completed slice.
- Manual verification covers desktop and mobile layouts, keyboard navigation, and backend-unavailable status.

## Boundaries

### Always

- Keep frontend and backend independently runnable.
- Keep secrets in backend environment variables only.
- Validate untrusted backend input before provider calls in later phases.
- Describe risk as an AI-estimated communication/escalation risk, never a scientific or clinical measurement.
- Preserve actual intent and legitimate boundaries in later rewrite logic.

### Ask first

- Adding production dependencies beyond the selected framework and test tooling.
- Changing the public API contract after it is implemented.
- Connecting a paid external service or adding persistent storage.

### Never

- Commit secrets or expose an ElevenLabs API key to the browser.
- Describe Ollama as the AI model.
- Add mock AI responses once Gemma 3 integration begins.
- Add authentication, a database, Redis, RAG, a vector database, multi-agent logic, microservices, or Kubernetes.
- Diagnose mental health, invent facts, assume recipient feelings, force positivity, or moralize in rewrites.

## Success Criteria

- The `frontend` and `backend` applications each install, lint, test, build, and run with their own commands.
- `GET /api/health` returns the specified HTTP 200 JSON response.
- The frontend shows a clear, accessible draft-writing shell and accurately reflects backend reachability.
- No secrets are present in committed frontend files or client-side environment variables.
- Documentation explains the intended architecture and how to demo this foundation.

## Open Questions

- None blocking the foundation. This specification treats Phase 1 as the project foundation; the requested AI, rewrite, voice, and storage capabilities remain explicitly deferred to later phases.
