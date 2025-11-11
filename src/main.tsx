import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
import NewApp from './NewApp.tsx'

createRoot(document.getElementById('root')!).render(
    <NewApp />
)
