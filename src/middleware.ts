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

  // Normal request flow: execute supabase middleware and guarantee Vary: Accept, Accept-Encoding
  const response = createClient(request);
  response.headers.set("Vary", "Accept, Accept-Encoding");
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
