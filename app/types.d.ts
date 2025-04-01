/**
 * Definição de tipos global para o Next.js 15
 * 
 * Este arquivo resolve problemas de tipagem com os parâmetros de rota
 * nas páginas Server Component do Next.js 15
 */

declare namespace NextJS {
  interface PageProps {
    params: Promise<Record<string, string>>
    searchParams: Promise<Record<string, string | string[] | undefined>>
  }
}

export {}; 