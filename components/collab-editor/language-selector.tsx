"use client"

import { useState, useEffect } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type Language = {
  id: string
  name: string
  type: "web" | "non-web"
  extension: string
}

export const languages: Language[] = [
  // Web languages
  { id: "html", name: "HTML/CSS/JS", type: "web", extension: "html" },
  { id: "react", name: "React", type: "web", extension: "jsx" },
  { id: "vue", name: "Vue", type: "web", extension: "vue" },
  { id: "svelte", name: "Svelte", type: "web", extension: "svelte" },

  // Non-web languages
  { id: "python", name: "Python", type: "non-web", extension: "py" },
  { id: "javascript", name: "JavaScript (Node.js)", type: "non-web", extension: "js" },
  { id: "typescript", name: "TypeScript (Node.js)", type: "non-web", extension: "ts" },
  { id: "java", name: "Java", type: "non-web", extension: "java" },
  { id: "c", name: "C", type: "non-web", extension: "c" },
  { id: "cpp", name: "C++", type: "non-web", extension: "cpp" },
  { id: "csharp", name: "C#", type: "non-web", extension: "cs" },
  { id: "go", name: "Go", type: "non-web", extension: "go" },
  { id: "ruby", name: "Ruby", type: "non-web", extension: "rb" },
  { id: "rust", name: "Rust", type: "non-web", extension: "rs" },
  { id: "php", name: "PHP", type: "non-web", extension: "php" },
]

interface LanguageSelectorProps {
  onLanguageChange: (language: Language) => void
  currentLanguage?: Language
}

export function LanguageSelector({ onLanguageChange, currentLanguage }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<Language | undefined>(currentLanguage)

  useEffect(() => {
    if (currentLanguage) {
      setValue(currentLanguage)
    } else {
      // Default to JavaScript if no language is selected
      const defaultLanguage = languages.find((lang) => lang.id === "javascript")
      setValue(defaultLanguage)
      if (defaultLanguage) onLanguageChange(defaultLanguage)
    }
  }, [currentLanguage, onLanguageChange])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[180px] justify-between">
          {value ? value.name : "Select language..."}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-0">
        <Command>
          <CommandInput placeholder="Search language..." />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {languages.map((language) => (
                <CommandItem
                  key={language.id}
                  value={language.id}
                  onSelect={() => {
                    setValue(language)
                    onLanguageChange(language)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value?.id === language.id ? "opacity-100" : "opacity-0")} />
                  {language.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

