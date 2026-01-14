import { useEffect, useState, useCallback } from 'react'
import { getSupabaseClient } from '../src/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let subscriptionRef: { unsubscribe?: () => void } | undefined

    try {
      const client = getSupabaseClient()

      // Prende l'utente corrente (al mount)
      client.auth.getUser()
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
      const { data } = client.auth.onAuthStateChange((_event: unknown, session: Session | null) => {
        if (!mounted) return
        setUser(session?.user ?? null)
      })

      subscriptionRef = (data as { subscription?: { unsubscribe?: () => void } } | undefined)?.subscription
    } catch (err) {
      // client non inizializzato: gestiamo come "no user"
      setUser(null)
      setLoading(false)
    }

    return () => {
      mounted = false
      if (subscriptionRef && typeof subscriptionRef.unsubscribe === 'function') {
        subscriptionRef.unsubscribe()
      }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      const client = getSupabaseClient()
      await client.auth.signOut()
      setUser(null)
    } catch (err) {
      // opzionale: log di debug locale
    }
  }, [])

  return { user, loading, signOut }
}