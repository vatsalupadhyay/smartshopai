// Type definitions for Deno runtime in Supabase Edge Functions
declare namespace Deno {
  namespace env {
    function get(name: string): string | undefined;
  }
  function serve(handler: (req: Request) => Promise<Response> | Response): void;
}
