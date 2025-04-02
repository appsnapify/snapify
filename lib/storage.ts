import { supabase } from '@/lib/supabase'

export async function uploadOrganizationImage(file: File, type: 'logo' | 'banner') {
  try {
    console.log(`Iniciando upload de ${type}:`, file.name, file.type, file.size)
    
    if (!file) {
      throw new Error('Arquivo não fornecido')
    }

    // Validar tipo de arquivo
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    console.log('Extensão do arquivo:', fileExt)
    
    if (!fileExt || !['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
      throw new Error('Tipo de arquivo não suportado. Use JPG, PNG ou GIF.')
    }

    // Gerar nome único para o arquivo
    const timestamp = new Date().getTime()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileName = `${timestamp}-${randomString}.${fileExt}`
    console.log('Nome de arquivo gerado:', fileName)

    // Usar um único bucket para simplificar
    const bucketId = 'organization_logos'
    console.log('Bucket selecionado:', bucketId)

    // Verificar se já existe conexão com o Supabase
    console.log('Status do Supabase:', 
      supabase ? 'Supabase inicializado' : 'Supabase não inicializado', 
      supabase.storage ? 'Storage disponível' : 'Storage não disponível'
    )

    // Convertendo File para ArrayBuffer para garantir compatibilidade
    const arrayBuffer = await file.arrayBuffer()
    const fileData = new Uint8Array(arrayBuffer)

    // Upload do arquivo
    console.log('Iniciando upload para o Supabase...')
    const { data, error: uploadError } = await supabase.storage
      .from(bucketId)
      .upload(`${type}/${fileName}`, fileData, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      console.error('Mensagem:', uploadError.message)
      console.error('Nome:', uploadError.name)
      console.error('Stack:', uploadError.stack)
      throw new Error(`Erro ao fazer upload: ${uploadError.message}`)
    }

    console.log('Upload concluído com sucesso:', data)

    // Gerar URL pública
    console.log('Obtendo URL pública...')
    const { data: { publicUrl }, error: urlError } = supabase.storage
      .from(bucketId)
      .getPublicUrl(`${type}/${fileName}`)

    if (urlError) {
      console.error('Erro ao gerar URL:', urlError)
      throw new Error(`Erro ao gerar URL pública: ${urlError.message}`)
    }

    console.log('URL pública gerada:', publicUrl)
    return publicUrl
  } catch (error) {
    console.error('Erro ao processar imagem:', error)
    throw error instanceof Error ? error : new Error('Erro desconhecido ao processar imagem')
  }
} 