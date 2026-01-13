import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../src/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Prende l'utente corrente (al mount)
    supabase.auth.getUser()
      .then(({ data }: { data: { user: User | null } }) => {
        if (!mounted) return
        setUser(data?.user ?? null)
        setLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setUser(null)
        setLoading(false)
      })

    // onAuthStateChange ritorna { data: { subscription } }
    const { data } = supabase.auth.onAuthStateChange((_event: unknown, session: Session | null) => {
      if (!mounted) return
      setUser(session?.user ?? null)
    })

    // Prendiamo la subscription (tipiamo minimamente) per poter fare cleanup
    const subscription = (data as { subscription?: { unsubscribe?: () => void } } | undefined)?.subscription

    return () => {
      mounted = false
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe()
      }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (err) {
      // opzionale: log di debug locale
    }
  }, [])

  return { user, loading, signOut }
}