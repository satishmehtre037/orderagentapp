import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import { MARKDOWN_PAGES, NOT_FOUND_MARKDOWN } from "@/lib/markdown/pagesMarkdown";

export async function middleware(request: NextRequest) {
  const acceptHeader = request.headers.get("accept") || "";
  const pathname = request.nextUrl.pathname;

  const isMarkdownRequested =
    acceptHeader.includes("text/markdown") ||
    acceptHeader.includes("text/x-markdown");

  // If Markdown negotiation is requested on public page routes (not API or static assets)
  if (isMarkdownRequested && !pathname.startsWith("/api/")) {
    const cleanPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
    const mappedPath = cleanPath === "/docs" ? "/api-docs" : cleanPath;

    if (MARKDOWN_PAGES[mappedPath]) {
      return new NextResponse(MARKDOWN_PAGES[mappedPath], {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Vary": "Accept, Accept-Encoding",
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      });
    }

    // Return agent-friendly 404 markdown for unknown paths
    return new NextResponse(NOT_FOUND_MARKDOWN, {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Vary": "Accept, Accept-Encoding",
        "Cache-Control": "no-cache",
      },
    });
  }

  // API Versioning: Rewrite /api/v1/* to /api/*
  if (pathname.startsWith("/api/v1/")) {
    const unversionedPath = pathname.replace(/^\/api\/v1\//, "/api/");
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = unversionedPath;
    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set("X-API-Version", "2026-09-01");
    response.headers.set("Sunset", "Wed, 01 Sep 2027 00:00:00 GMT");
    response.headers.set("Deprecation", "@1756684800");
    response.headers.set("Link", '<https://orderagentapp.webcorestudio.dev/deprecation>; rel="deprecation"');
    response.headers.set("RateLimit-Limit", "120");
    response.headers.set("RateLimit-Remaining", "119");
    response.headers.set("RateLimit-Reset", "60");
    response.headers.set("RateLimit-Policy", "120;w=60");
    response.headers.set("Vary", "Accept, Accept-Encoding");
    return response;
  }

  // Normal request flow: execute supabase middleware and guarantee standard headers
  const response = createClient(request);
  response.headers.set("Vary", "Accept, Accept-Encoding");

  if (pathname.startsWith("/api/")) {
    response.headers.set("X-API-Version", "2026-09-01");
    response.headers.set("Sunset", "Wed, 01 Sep 2027 00:00:00 GMT");
    response.headers.set("Deprecation", "@1756684800");
    response.headers.set("Link", '<https://orderagentapp.webcorestudio.dev/deprecation>; rel="deprecation"');
    response.headers.set("RateLimit-Limit", "120");
    response.headers.set("RateLimit-Remaining", "119");
    response.headers.set("RateLimit-Reset", "60");
    response.headers.set("RateLimit-Policy", "120;w=60");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot|css|js|map)$).*)",
  ],
};
