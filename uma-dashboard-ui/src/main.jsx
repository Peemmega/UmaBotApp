import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { setupDiscordDeepLink } from "./services/discordAuth";

setupDiscordDeepLink();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)