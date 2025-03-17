import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const res = await query("SELECT NOW()")
    return NextResponse.json({ success: true, timestamp: res.rows[0].now })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
