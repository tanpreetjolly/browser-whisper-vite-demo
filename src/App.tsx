import { lazy, Suspense } from 'react'

const WhisperTest = lazy(() =>
  import('./WhisperTest').then(m => ({ default: m.WhisperTest }))
)

function App() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--text)' }}>Loading…</div>}>
      <WhisperTest />
    </Suspense>
  )
}

export default App
