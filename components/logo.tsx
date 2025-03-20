import Image from "next/image"

type LogoProps = {
  className?: string
  size?: "small" | "medium" | "large"
}

export function Logo({ className = "", size = "medium" }: LogoProps) {
  const sizes = {
    small: 40,
    medium: 60,
    large: 120,
  }

  const dimensions = sizes[size]

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/logo-empresa.jpeg" // Ruta relativa a la carpeta `public`
        alt="El Tobiano Talabartería"
        width={dimensions}
        height={dimensions}
        className="object-contain"
      />
    </div>
  )
}



