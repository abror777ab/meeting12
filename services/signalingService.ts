import { ChatMessage, MeetingReaction, Participant } from '@/types/meeting';

export type SignalPayload =
  | { type: 'join'; participant: Participant }
  | { type: 'leave'; participantId: string }
  | { type: 'state-update'; participantId: string; updates: Partial<Participant> }
  | { type: 'chat-message'; message: ChatMessage }
  | { type: 'reaction'; reaction: MeetingReaction }
  | { type: 'whiteboard-draw'; line: DrawLine }
  | { type: 'whiteboard-clear' }
  | { type: 'request-state'; requesterId: string }
  | { type: 'send-state'; targetId: string; participants: Participant[] }
  | { type: 'offer'; senderId: string; targetId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; senderId: string; targetId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; senderId: string; targetId: string; candidate: RTCIceCandidateInit };

export interface DrawLine {
  prevX: number;
  prevY: number;
  currX: number;
  currY: number;
  color: string;
  size: number;
  isEraser: boolean;
}

export class SignalingChannel {
  private channel: BroadcastChannel | null = null;
  private ws: WebSocket | null = null;
  private onMessageCallback?: (payload: SignalPayload) => void;
  private roomId: string;
  private isConnected = false;

  private pendingMessages: SignalPayload[] = [];

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private isDestroyed = false;

  constructor(roomId: string, onMessage: (payload: SignalPayload) => void) {
    this.roomId = roomId.trim().toLowerCase();
    this.onMessageCallback = onMessage;

    // 1. Cross-tab BroadcastChannel for instant local testing
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(`meetpulse_room_${this.roomId}`);
      this.channel.onmessage = (event) => {
        if (event.data && this.onMessageCallback) {
          this.onMessageCallback(event.data);
        }
      };
    }

    // 2. Connect to Spring Boot WebSocket Server
    this.initWebSocket();
  }

  private initWebSocket() {
    if (typeof window === 'undefined' || this.isDestroyed) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const backendHost = process.env.NEXT_PUBLIC_BACKEND_HOST || '213.199.51.43.sslip.io';
    const wsUrl = `${wsProtocol}//${backendHost}/ws-raw`;

    try {
      if (this.ws) {
        try {
          this.ws.close();
        } catch {}
      }

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('[MeetPulse] Connected to Spring Boot WebSocket backend successfully.');

        // Start ping interval every 25 seconds to keep connection alive
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
              this.ws.send(JSON.stringify({ type: 'ping', roomId: this.roomId }));
            } catch {}
          }
        }, 25000);

        // Flush all pending messages queued while WebSocket was connecting
        while (this.pendingMessages.length > 0) {
          const msg = this.pendingMessages.shift();
          if (msg) {
            this.sendWsPayload(msg);
          }
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === 'pong') return;
          if (data && this.onMessageCallback) {
            this.onMessageCallback(data);
          }
        } catch {
          // Ignored non-json packet
        }
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (this.pingInterval) clearInterval(this.pingInterval);
        if (!this.isDestroyed) {
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.initWebSocket(), 3000);
        }
      };
    } catch {
      if (!this.isDestroyed) {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.initWebSocket(), 3000);
      }
    }
  }

  private sendWsPayload(payload: SignalPayload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(
          JSON.stringify({
            type: payload.type,
            roomId: this.roomId,
            payload,
            timestamp: Date.now(),
          })
        );
      } catch (err) {
        console.warn('WebSocket send failed:', err);
      }
    }
  }

  broadcast(payload: SignalPayload): void {
    // 1. Send via local BroadcastChannel
    try {
      this.channel?.postMessage(payload);
    } catch (err) {
      console.warn('BroadcastChannel postMessage failed:', err);
    }

    // 2. Send via Spring Boot backend WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendWsPayload(payload);
    } else {
      // Queue message if WebSocket is still connecting
      this.pendingMessages.push(payload);
    }
  }

  close(): void {
    this.isDestroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
