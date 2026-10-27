import type { APIRoute } from "astro";
import { canonical, rutasPublicas } from "../config/site";

export const GET: APIRoute = () => {
  const urls = rutasPublicas
    .map(
      (path) => `  <url>
    <loc>${canonical(path)}</loc>
    <lastmod>2026-10-27</lastmod>
  </url>`,
    )
    .join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
