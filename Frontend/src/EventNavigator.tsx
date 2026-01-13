import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function EventNavigator() {
  const navigate = useNavigate()

  useEffect(() => {
    function handler() {
      try {
        navigate('/auth', { replace: true })
      } catch (e) {
        try { window.history.pushState(null, '', '/auth'); window.dispatchEvent(new PopStateEvent('popstate')); } catch(err){}
        console.warn('EventNavigator navigate error', e)
      }
    }

    window.addEventListener('navigateToAuth', handler)
    return () => window.removeEventListener('navigateToAuth', handler)
  }, [navigate])

  return null
}