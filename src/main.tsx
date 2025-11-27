import { createRoot } from 'react-dom/client'
import './index.css'
import Router from './Router.tsx'
// import App from './App.tsx'
// import NewApp from './NewApp.tsx'


createRoot(document.getElementById('root')!).render(
    <Router />
)
