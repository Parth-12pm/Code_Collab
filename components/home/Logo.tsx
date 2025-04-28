import { Code, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
}

export default function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <Code size={36} className="text-primary" />
        <Sparkles size={18} className="absolute -top-1 -right-2 text-yellow-400 animate-pulse" />
      </div>
    </div>
  )
}
