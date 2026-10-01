import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import FeedbackGlobal from './components/Feedback/FeedbackGlobal.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FeedbackGlobal />
    <App />
  </StrictMode>,
)
