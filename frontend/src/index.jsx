import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Set API base before any module reads it
const apiBase = process.env.COMPOSER_API_BASE || '';
if (typeof window !== 'undefined') {
    window.__COMPOSER_API_BASE__ = apiBase;
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <BrowserRouter>
        <App />
    </BrowserRouter>
);
