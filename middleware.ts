import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicPath = path === "/login"
  const isApiAuthPath = path.startsWith("/api/auth/")
  const isApiPath = path.startsWith("/api/")

  const token = request.cookies.get("user_id")?.value || ""

  // Redirigir a login si no hay token y no es una ruta pública o API de autenticación
  if (!token && !isPublicPath && !isApiAuthPath) {
    // Para las API, devolver un error 401 en lugar de redirigir
    if (isApiPath) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirigir al dashboard si hay token y está en login
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

