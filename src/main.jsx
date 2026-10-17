import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './views/App'
import { bootEditor } from './editor/boot'
document.documentElement.lang = 'en'
createRoot(document.getElementById('root')).render(<App/>)
bootEditor()
