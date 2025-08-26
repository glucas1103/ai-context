import { createClient } from '@/lib/supabase/server'
import { NextResponse, NextRequest } from 'next/server'
import { createErrorResponse, handleApiError } from '@/utils/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, url } = body

    if (!name || !url) {
      return createErrorResponse('Nom et URL requis', 'missing_fields', 400)
    }

    const supabase = await createClient()
    
    // Vérifier l'authentification de l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return createErrorResponse('Non authentifié', 'auth_required', 401)
    }

    // Vérifier si un workspace existe déjà pour cette URL et cet utilisateur
    const { data: existingWorkspace, error: findError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', user.id)
      .eq('url', url)
      .single()

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw findError
    }

    if (existingWorkspace) {
      // Workspace existe déjà, le retourner
      return NextResponse.json({
        success: true,
        data: existingWorkspace,
        message: 'Workspace existant récupéré'
      })
    }

    // Créer un nouveau workspace
    const { data: newWorkspace, error: createError } = await supabase
      .from('workspaces')
      .insert({
        owner_id: user.id,
        name,
        url
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    return NextResponse.json({
      success: true,
      data: newWorkspace,
      message: 'Workspace créé avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la création du workspace:', error)
    return handleApiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Vérifier l'authentification de l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return createErrorResponse('Non authentifié', 'auth_required', 401)
    }

    // Récupérer tous les workspaces de l'utilisateur
    const { data: workspaces, error: fetchError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      throw fetchError
    }

    return NextResponse.json({
      success: true,
      data: workspaces
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des workspaces:', error)
    return handleApiError(error)
  }
}
