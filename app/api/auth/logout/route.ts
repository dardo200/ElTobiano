import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Eliminar la cookie de sesión
    const cookieStore = cookies();
    (await cookieStore).delete("user_id");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en logout:", error);

    // Manejo de errores específicos
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}