export interface SocialMedia {
  facebook?: string
  instagram?: string
  twitter?: string
  linkedin?: string
  website?: string
}

export interface Organization {
  id: string
  name: string
  address: string
  socialMedia: SocialMedia
  banner?: string
  location: string
  email: string
  contacts: string[]
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface OrganizationFormData {
  name: string
  address: string
  socialMedia: SocialMedia
  banner?: string
  location: string
  email: string
  contacts: string[]
} 