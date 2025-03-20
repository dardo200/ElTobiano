import Image from "next/image"
import Link from "next/link"

type DeveloperLogoProps = {
  className?: string
  showText?: boolean
}

export function DeveloperLogo({ className = "", showText = true }: DeveloperLogoProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {showText && <p className="text-xs text-gray-500 mb-1">Desarrollado por</p>}
      <Link href="https://jdasistemas.com" target="_blank" rel="noopener noreferrer" className="flex items-center">
        <Image
          src="/logo-desarrollador.jpeg" // Ruta relativa a la carpeta `public`
          alt="JDA Sistemas"
          width={100}
          height={40}
          className="object-contain"
        />
      </Link>
    </div>
  )
}