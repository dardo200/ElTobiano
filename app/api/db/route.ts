import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET() {
  try {
    const res = await executeQuery("SELECT NOW()")
    return NextResponse.json({ success: true, timestamp: res.rows[0].now })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
