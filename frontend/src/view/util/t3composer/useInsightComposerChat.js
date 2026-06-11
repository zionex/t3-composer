import { useRef, useState, useCallback, useEffect } from 'react';
import { ComposerSSEManager } from './sse/ComposerSSEManager';

export function useInsightComposerChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const clientId = useRef(crypto.randomUUID());
  const mounted = useRef(true);

  useEffect(() => {
    const mgr = ComposerSSEManager.getInstance();

    mgr.registerClient(clientId.current, {
      onMessage: (body, msg) => {
        const parsed = typeof body === 'string' ? tryParse(body) : body;
        const eventType = parsed?.content?.event_type || 'stream_answer';
        const chunk = parsed?.content?.content ?? parsed?.content ?? '';
        if (mounted.current) setMessages(prev => appendChunk(prev, eventType, chunk));
      },
      onDone: () => { if (mounted.current) setIsLoading(false); },
      onError: (err) => {
        if (mounted.current) {
          setIsLoading(false);
          setError(typeof err === 'string' ? err : JSON.stringify(err));
        }
      },
    });

    mgr.connect()
      .then(() => { if (mounted.current) setIsReady(true); })
      .catch((e) => { if (mounted.current) setError(e.message); });

    return () => {
      mounted.current = false;
      mgr.unregisterClient(clientId.current);
    };
  }, []);

  const sendMessage = useCallback(async (text, menuCd, targetCd) => {
    const mgr = ComposerSSEManager.getInstance();
    if (!isReady || isLoading) return;
    setIsLoading(true);
    setError(null);
    setMessages(prev => [
      ...prev,
      { role: 'user', content: text },
      { role: 'assistant', content: '' },
    ]);

    const requestId = crypto.randomUUID();
    mgr.registerRequest(requestId, clientId.current);

    try {
      await mgr.invokeService({
        request_id: requestId,
        service_name: 'TaskOrchestratorService',
        input_data: {
          human_message: text,
          chat_session_id: clientId.current,
          lang_cd: 'ko',
          ...(menuCd ? { menu_cd: menuCd } : {}),
          ...(targetCd ? { target_cd: targetCd } : {}),
        },
      });
    } catch (e) {
      if (mounted.current) {
        setIsLoading(false);
        setError(e.message);
      }
    }
  }, [isReady, isLoading]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, sendMessage, clearMessages, isLoading, isReady, error };
}

function tryParse(s) {
  try { return JSON.parse(s); } catch { return s; }
}

function appendChunk(prev, eventType, chunk) {
  if (!prev.length) return prev;
  const copy = [...prev];
  const last = { ...copy[copy.length - 1] };
  if (last.role !== 'assistant') return prev;
  if (eventType === 'stream_answer') {
    last.content = (last.content || '') + (chunk || '');
  } else if (eventType === 'final_answer' && chunk) {
    last.content = chunk;
  }
  copy[copy.length - 1] = last;
  return copy;
}
