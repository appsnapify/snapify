// Aqui será o Server Component para lidar com o roteamento dinâmico
import OrganizationClient from './OrganizationClient'

interface PageProps {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function OrganizationPage(props: PageProps) {
  // Passa o ID para o componente cliente diretamente
  return <OrganizationClient id={props.params.id} />
} 