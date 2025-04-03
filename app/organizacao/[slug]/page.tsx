// Server Component para resolver o problema de tipagem do Next.js 15
import OrganizationClient from './OrganizationClient'

interface PageProps {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function OrganizationPage(props: PageProps) {
  return <OrganizationClient slug={props.params.slug} />
} 