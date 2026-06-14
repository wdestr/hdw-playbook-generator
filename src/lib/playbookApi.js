// Playbook persistence via Netlify Functions + Netlify Blobs (no external
// services needed). Shareable playbooks are saved server-side and reloaded
// from a ?id= link.
export const playbookSharingEnabled = true

export async function savePlaybook(intake, playbook) {
  const res = await fetch('/api/save-playbook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intake, playbook }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.id
}

export async function loadPlaybook(id) {
  const res = await fetch(`/api/get-playbook?id=${encodeURIComponent(id)}`)
  if (res.status === 404) return null
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}
