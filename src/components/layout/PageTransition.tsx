'use client'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

/* A short crossfade on route change, so moving between pages reads as a
 * state change rather than a hard cut. Opacity only (which reduced-motion
 * users still get: it isn't movement), and fast. The initial state must be
 * identical on server and client, so it can't branch on a media query. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
