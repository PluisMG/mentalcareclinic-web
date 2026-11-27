import type { APIRoute } from "astro";
import { seIndexa, site } from "../config/site";

export const GET: APIRoute = () => {
  const body = !seIndexa()
    ? "User-agent: *\nDisallow: /\n"
    : `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
