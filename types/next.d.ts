import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

declare module 'next/headers' {
  export function cookies(): ReadonlyRequestCookies & {
    set(name: string, value: string, options?: any): void
    delete(name: string): void
    get(name: string): { value: string } | undefined
  }
} 