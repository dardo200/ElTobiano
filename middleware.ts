import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicPath = path === "/login"
  const isApiPath = path.startsWith("/api/")

  // Obtener cookies
  const userId = request.cookies.get("user_id")?.value
  const userRole = request.cookies.get("user_role")?.value

  // Si es una ruta pública o API, permitir acceso
  if (isPublicPath || isApiPath) {
    return NextResponse.next()
  }

  // Si no hay usuario y no es una ruta pública, redirigir a login
  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Restricciones basadas en rol
  if (userRole === "despacho") {
    // Rutas permitidas para el rol "despacho"
    const allowedPaths = ["/ventas", "/ventas/nueva", "/ventas/pendientes", "/perfil"]

    // Verificar si la ruta actual comienza con alguna de las rutas permitidas
    const isAllowed = allowedPaths.some((allowedPath) => path === allowedPath || path.startsWith(`${allowedPath}/`))

    // Si no es una ruta permitida, redirigir a ventas
    if (!isAllowed) {
      return NextResponse.redirect(new URL("/ventas", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}

