import { Code, Sparkles } from "lucide-react";

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Lucide Icons */}
      <div className="relative">
        <Code size={36} className="text-blue-500 dark:text-blue-400" />
        <Sparkles
          size={18}
          className="absolute -top-1 -right-2 text-yellow-400 animate-pulse"
        />
      </div>

      {/* Custom SVG Logo */}
      <svg className="w-10 h-10 text-gray-900 dark:text-white" viewBox="0 0 50 50">
        {/* Your logo SVG path here */}
        <path d="M10 10h30v30h-30z" fill="currentColor" />
      </svg>
    </div>
  );
}
