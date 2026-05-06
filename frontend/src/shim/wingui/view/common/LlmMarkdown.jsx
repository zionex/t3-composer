import React from 'react';
import { Box } from '@mui/material';
import sanitizeHtml from 'sanitize-html';

/**
 * 부모 wingui 의 LlmMarkdown 의 단독 환경용 shim.
 * 단순 markdown 일부만 렌더 (코드블럭/제목/리스트). react-markdown 무의존.
 */
const escapeHtml = (s) => String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function renderMarkdown(text) {
    if (!text) return '';
    let html = escapeHtml(text);
    // ```code``` blocks
    html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre style="background:#1e293b;color:#e2e8f0;padding:12px;border-radius:6px;overflow:auto;font-family:Consolas,monospace;font-size:12px;"><code>${code}</code></pre>`);
    // **bold**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // headings
    html = html.replace(/^### (.+)$/gm, '<h3 style="margin:8px 0 4px;">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 style="margin:10px 0 6px;">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 style="margin:12px 0 8px;">$1</h1>');
    // bullets
    html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
    // newlines → <br>
    html = html.replace(/\n/g, '<br>');
    return html;
}

export default function LlmMarkdown({ content, sx }) {
    const html = sanitizeHtml(renderMarkdown(content), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['pre', 'code', 'h1', 'h2', 'h3', 'br', 'strong', 'em', 'li', 'ul', 'ol']),
        allowedAttributes: { '*': ['style', 'class'] },
    });
    return <Box sx={{ fontSize: 13, lineHeight: 1.6, ...sx }} dangerouslySetInnerHTML={{ __html: html }} />;
}
