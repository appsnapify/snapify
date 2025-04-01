"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const countries = [
  { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹" },
  { code: "BR", name: "Brasil", dialCode: "+55", flag: "🇧🇷" },
  { code: "ES", name: "Espanha", dialCode: "+34", flag: "🇪🇸" },
  { code: "FR", name: "França", dialCode: "+33", flag: "🇫🇷" },
  { code: "DE", name: "Alemanha", dialCode: "+49", flag: "🇩🇪" },
  { code: "IT", name: "Itália", dialCode: "+39", flag: "🇮🇹" },
  { code: "UK", name: "Reino Unido", dialCode: "+44", flag: "🇬🇧" },
  { code: "US", name: "Estados Unidos", dialCode: "+1", flag: "🇺🇸" },
]

interface CountrySelectProps {
  value: string
  onChange: (value: string) => void
}

export function CountrySelect({ value = "PT", onChange }: CountrySelectProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[120px] justify-between"
        >
          {value
            ? countries.find((country) => country.code === value)?.flag
            : countries.find((country) => country.code === "PT")?.flag}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Procurar país..." />
          <CommandEmpty>Nenhum país encontrado.</CommandEmpty>
          <CommandGroup>
            {countries.map((country) => (
              <CommandItem
                key={country.code}
                value={country.code}
                onSelect={() => {
                  onChange(country.code)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === country.code ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="mr-2">{country.flag}</span>
                {country.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 