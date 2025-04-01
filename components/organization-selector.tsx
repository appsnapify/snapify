"use client"

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useOrganization } from '@/app/contexts/organization-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function OrganizationSelector() {
  const router = useRouter()
  const { organizations, selectedOrganization, setSelectedOrganization } = useOrganization()

  if (!organizations || organizations.length === 0) {
    return null
  }

  return (
    <Select
      value={selectedOrganization?.id}
      onValueChange={(value) => {
        const org = organizations.find((org) => org.id === value)
        if (org) {
          setSelectedOrganization(org)
        }
      }}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Selecione uma organização">
          {selectedOrganization?.name || 'Selecione uma organização'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {organizations.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 