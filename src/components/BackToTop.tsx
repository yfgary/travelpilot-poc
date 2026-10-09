import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export function BackToTop() {
  const location = useLocation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const scroller = document.getElementById('main-content')
    if (!scroller) return
    const update = () => setVisible(scroller.scrollTop > 320)
    scroller.addEventListener('scroll', update, { passive: true })
    update()
    return () => scroller.removeEventListener('scroll', update)
  }, [])

  useEffect(() => {
    // The main element is the app scroll container, not window.
    const scroller = document.getElementById('main-content')
    if (scroller) scroller.scrollTop = 0
    setVisible(false)
  }, [location.pathname])

  if (!visible) return null
  return <button className="back-to-top" type="button" aria-label="返回頁頂" title="返回頁頂"
    onClick={() => {
      const scroller = document.getElementById('main-content')
      if (!scroller) return
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      scroller.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
    }}>
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 14 7-7 7 7M12 7v11" />
    </svg>
  </button>
}
