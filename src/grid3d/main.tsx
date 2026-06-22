import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Studio } from './Studio'
import '../index.css'

/** Standalone entry for the 3D stacked-process generator — its own page
 *  (grid3d.html), separate from the keynote/grid app and the print generator.
 *  Mounts the studio; the same scene + doc render deterministically in Remotion
 *  (composition "GridStack3D"). */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Studio />
  </StrictMode>,
)
