# Malaysia AI Tour Guide v2

## What works
- Mobile-first React/Vite interface
- GPS location and nearest-stop calculation
- Batu Caves, Putrajaya and Melaka starter route
- Browser speech narration
- PWA manifest + service worker
- Ask the Guide frontend connected to `/api/ask`
- Node server suitable for a single-service deployment after build

## Local run
1. `npm install`
2. `npm run dev` for frontend development
3. `npm run build`
4. `npm start` to serve the built PWA and API

## AI configuration
The server expects two environment variables:
- `AI_ENDPOINT`
- `AI_API_KEY`

The exact request/response mapping depends on the AI provider you select. Never put the API key in `src/`.
