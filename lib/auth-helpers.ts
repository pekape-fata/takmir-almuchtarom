// Helper bersama (aman dipakai di client & server):
// mengubah username menjadi email internal untuk Supabase Auth
export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@takmir.local`
}
