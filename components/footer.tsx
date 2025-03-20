import { DeveloperLogo } from "@/components/developer-logo"

export function Footer() {
  return (
    <footer className="border-t py-4 mt-auto">
      <div className="container flex justify-between items-center">
        <p className="text-sm text-gray-500">© {new Date().getFullYear()} Todos los derechos reservados</p>
        <DeveloperLogo />
      </div>
    </footer>
  )
}

