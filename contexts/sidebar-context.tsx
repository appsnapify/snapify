"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface SidebarContextType {
  isVisible: boolean
  hideSidebar: () => void
  showSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(true)

  const hideSidebar = () => setIsVisible(false)
  const showSidebar = () => setIsVisible(true)

  return (
    <SidebarContext.Provider value={{ isVisible, hideSidebar, showSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
} 