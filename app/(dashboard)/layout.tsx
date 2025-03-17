import type React from "react"
import { Navbar } from "@/components/navbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full">
      <Navbar />
      <main className="p-8 pt-6 h-full">{children}</main>
    </div>
  )
}

