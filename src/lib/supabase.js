import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseEnabled = Boolean(url && key)

const client = supabaseEnabled ? createClient(url, key) : null

export async function savePlaybook(intake, playbook) {
  if (!client) return null
  const { data, error } = await client
    .from('playbooks')
    .insert({ intake, playbook })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function loadPlaybook(id) {
  if (!client) return null
  const { data, error } = await client
    .from('playbooks')
    .select('intake, playbook')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}
