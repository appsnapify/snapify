// Aqui será o Server Component para lidar com o roteamento dinâmico
import OrganizationClient from './OrganizationClient'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function OrganizationPage(props: PageProps) {
  const resolvedParams = await props.params
  
  // Passa o ID para o componente cliente
  return <OrganizationClient id={resolvedParams.id} />
} 