import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Rutas públicas que no necesitan autenticación
  const publicRoutes = ["/auth"];
  const pathname = request.nextUrl.pathname;

  // Si está en una ruta pública, déjalo pasar
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Para rutas protegidas, simplemente continúa
  // La sesión se valida en el cliente con Supabase
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
