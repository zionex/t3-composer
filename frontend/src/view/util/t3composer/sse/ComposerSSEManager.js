/**
 * ComposerSSEManager — insight-llm SSE 싱글톤 연결 관리자.
 * t3-composer Spring Boot :8090 /insight/** 프록시를 경유.
 * JWT 없음 — user_id=composer-dev 고정.
 */
let _instance = null;

export class ComposerSSEManager {
  constructor() {
    if (_instance) return _instance;
    _instance = this;
    this.eventSource = null;
    this.connectionId = null;
    this.connectionState = 'disconnected'; // disconnected | connecting | connected | error
    this.messageHandlers = new Map();      // clientId -> {onMessage, onDone, onError}
    this.requestToClient = new Map();      // requestId -> clientId
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  static getInstance() {
    if (!_instance) new ComposerSSEManager();
    return _instance;
  }

  registerClient(clientId, handlers) {
    this.messageHandlers.set(clientId, handlers);
  }

  unregisterClient(clientId) {
    this.messageHandlers.delete(clientId);
    for (const [rid, cid] of this.requestToClient) {
      if (cid === clientId) this.requestToClient.delete(rid);
    }
  }

  registerRequest(requestId, clientId) {
    this.requestToClient.set(requestId, clientId);
  }

  connect() {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      return Promise.resolve();
    }
    this.connectionState = 'connecting';
    this.connectionId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      let settled = false;
      const settle = (fn, val) => { if (!settled) { settled = true; fn(val); } };

      const url = new URL('/insight/sse/connect', window.location.origin);
      url.searchParams.set('connection_id', this.connectionId);
      url.searchParams.set('user_id', 'composer-dev');
      url.searchParams.set('lang_cd', 'ko');

      this.eventSource = new EventSource(url.toString());

      const timeout = setTimeout(() => {
        this._handleError();
        settle(reject, new Error('SSE connect timeout (10s)'));
      }, 10_000);

      this.eventSource.addEventListener('open', () => {
        // 'open' 은 TCP/HTTP 연결만 보장 (backend 가 ':\n\n' 을 upstream 호출 전에 흘려보내
        //  upstream 이 죽어있어도 발화함). 따라서 여기서는 카운터를 리셋하지 않고,
        //  진짜 upstream 핸드셰이크인 'connect' 이벤트에서만 리셋한다.
        clearTimeout(timeout);
        this.connectionState = 'connected';
        settle(resolve);
      });

      this.eventSource.addEventListener('connect', (e) => {
        try {
          const msg = JSON.parse(e.data);
          this.connectionId = msg.connection_id || this.connectionId;
        } catch (err) { console.warn('[SSEManager] connect event parse error', err); }
        clearTimeout(timeout);
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;   // ← 진짜 upstream 핸드셰이크 성공 — 여기서만 리셋
        settle(resolve);
      });

      this.eventSource.addEventListener('message', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          // backend 가 upstream 실패 시 보내는 센티넬 — 재연결 즉시 중단하고 모든 클라이언트에 통보.
          if (parsed && parsed.error === 'upstream error') {
            this._handleUpstreamDown();
            return;
          }
          this._route(parsed);
        } catch (err) { console.warn('[SSEManager] message parse error', e.data, err); }
      });

      this.eventSource.addEventListener('error', () => {
        clearTimeout(timeout);
        this._handleError();
        settle(reject, new Error('SSE connection error'));
      });
    });
  }

  _route(msg) {
    if (!msg?.request_id) return;
    const clientId = this.requestToClient.get(msg.request_id);
    const h = clientId ? this.messageHandlers.get(clientId) : null;
    if (!h) return;

    if (msg.type === 'done') {
      h.onDone?.(msg.body);
      this.requestToClient.delete(msg.request_id);
    } else if (msg.type === 'error') {
      h.onError?.(msg.body);
      this.requestToClient.delete(msg.request_id);
    } else {
      h.onMessage?.(msg.body, msg);
    }
  }

  _handleError() {
    this.connectionState = 'error';
    this.eventSource?.close();
    this.eventSource = null;
    this.reconnectAttempts++;
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      const delay = Math.min(1000 * 2 ** (this.reconnectAttempts - 1), 30_000);
      setTimeout(() => {
        if (this.connectionState !== 'connected') {
          this.connectionState = 'disconnected';
          this.connect().catch(() => {});
        }
      }, delay);
    } else {
      // 최대 재시도 도달 — 등록된 모든 클라이언트에 알림.
      this._notifyAllError('Insight 서버에 연결할 수 없습니다. 서버 상태를 확인하세요.');
    }
  }

  /**
   * backend 가 보낸 'upstream error' 센티넬 수신 시 호출.
   * upstream(insight-llm) 이 죽어있을 때 backend 가 즉시 응답으로 보내는 신호 — 재연결 무의미.
   */
  _handleUpstreamDown() {
    this.connectionState = 'error';
    this.eventSource?.close();
    this.eventSource = null;
    // 카운터를 max 로 강제 → 추후 _handleError 도 재시도 안 함.
    this.reconnectAttempts = this.maxReconnectAttempts + 1;
    this._notifyAllError('Insight 서버가 응답하지 않습니다 (upstream down).');
  }

  _notifyAllError(message) {
    for (const h of this.messageHandlers.values()) {
      try { h.onError?.(message); } catch (_) {}
    }
  }

  async invokeService(requestData) {
    if (this.connectionState !== 'connected') await this.connect();
    const formData = new FormData();
    formData.append('req_data', JSON.stringify({
      connection_id: this.connectionId,
      ...requestData,
    }));
    formData.append('user_id', 'composer-dev');
    formData.append('lang_cd', 'ko');

    const resp = await fetch('/insight/sse/invoke-service', {
      method: 'POST',
      body: formData,
    });
    if (!resp.ok) throw new Error(`invoke-service ${resp.status}`);
    return resp.json();
  }

  isConnected() {
    return this.connectionState === 'connected'
      && this.eventSource?.readyState === EventSource.OPEN;
  }
}
