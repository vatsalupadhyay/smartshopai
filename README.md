
```powershell
git clone <YOUR_GIT_URL>
cd wise-buy-ai
npm install
npm run dev
```

## Technologies

- Vite
- TypeScript
- React
- Tailwind CSS
- shadcn-ui

## Environment / Scrape.do token

For scraping rendered pages the project uses Scrape.do. Do NOT commit your Scrape.do token to the repository. Instead, set it as an environment variable for your Supabase Edge Function:

1. In the Supabase dashboard go to Functions → Settings (or Environment) and add `SCRAPEDO_API_TOKEN` with your token value.
2. Remove any `SCRAPEDO_API_TOKEN` lines from local `.env` files. For local testing you can set the token in your shell (do not commit it):

```powershell
$env:SCRAPEDO_API_TOKEN = "your_token_here"
```

The function reads `Deno.env.get('SCRAPEDO_API_TOKEN')` at runtime and will prefer `scrape.do` when the token is present.

## Production hardening: cache & rate-limiting

The Edge Function includes a lightweight, in-memory cache and a per-IP rate limiter. These are designed to reduce renderer usage and surface quick responses for repeat requests. Configure them via environment variables in your Supabase Functions settings:

- `CACHE_TTL_SECONDS` (default: 300) — how long to keep cached scraped results (seconds).
- `RATE_LIMIT_WINDOW` (default: 3600) — sliding window length for rate limiting (seconds).
- `RATE_LIMIT_MAX` (default: 30) — maximum requests per IP inside the rate limit window.
- `MAX_FETCH_REVIEWS` (default: 200) — how many reviews to fetch from a page to allow server-side pagination.

Notes:
- The cache is in-memory and persists only for warm function instances; it is not a durable cache. For robust production caching, add an external cache like Redis and configure the function to use it.
- Rate-limiting is also in-memory and per-instance. For a distributed, hard-rate-limit behavior, front the function with an API gateway or use Supabase's built-in rate-limiting features.

