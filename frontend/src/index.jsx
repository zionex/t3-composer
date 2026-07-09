import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './i18n';
import App from './App';
import theme from './theme';
import { registerCssVariables } from './style';

// Figma atomicColors → :root CSS custom properties (--color-aqua-60, --color-opacity-72, …)
// 한 번만 호출. 화면 CSS/sx 에서 var(--color-aqua-60) 로 참조 가능 (semantic 경유 권장).
registerCssVariables();

// Set API base before any module reads it
const apiBase = process.env.COMPOSER_API_BASE || '';
if (typeof window !== 'undefined') {
    window.__COMPOSER_API_BASE__ = apiBase;
}

const insightApiBase = process.env.INSIGHT_API_BASE || 'http://localhost:9160';
if (typeof window !== 'undefined') {
    window.__INSIGHT_API_BASE__ = insightApiBase;
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </ThemeProvider>
);
