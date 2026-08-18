import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BACKEND_BASE_URL } from './api.service';
import { Participant, ChatMessage, FloatingReaction } from '../types/meeting';

export type SocketEvent =
  | { type: 'USER_JOINED'; payload: Participant }
  | { type: 'USER_LEFT'; payload: { userId: string; userName?: string } }
  | { type: 'USER_STATE_CHANGED'; payload: Partial<Participant> & { id: string } }
  | { type: 'CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'REACTION'; payload: FloatingReaction }
  | { type: 'SIGNAL'; payload: { senderId: string; targetUserId: string; data: unknown } }
  | { type: 'PONG'; payload: { fromUser: Participant; allParticipants?: Participant[] } };

export class MeetingSocketService {
  private client: Client | null = null;
  private roomSubscription: StompSubscription | null = null;
  private userSubscription: StompSubscription | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private onEventCallback?: (event: SocketEvent) => void;
  private isConnected = false;

  private roomId: string;
  private user: Participant;

  constructor(roomId: string, user: Participant) {
    this.roomId = roomId;
    this.user = user;
    this.initBroadcastFallback();
    this.connectStomp();
  }

  private initBroadcastFallback(): void {
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      try {
        this.broadcastChannel = new BroadcastChannel(`meeting_room_${this.roomId}`);
        this.broadcastChannel.onmessage = (event) => {
          if (!this.isConnected && this.onEventCallback) {
            this.onEventCallback(event.data);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel ochishda ogohlantirish:', e);
      }
    }
  }

  private connectStomp(): void {
    if (typeof window === 'undefined') return;

    try {
      const socketUrl = `${BACKEND_BASE_URL}/ws-stomp`;

      this.client = new Client({
        webSocketFactory: () => new SockJS(socketUrl),
        reconnectDelay: 3000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => {
          this.isConnected = true;

          // 1. Xonadagi barcha umumiy voqealarga obuna bo'lish
          this.roomSubscription =
            this.client?.subscribe(
              `/topic/room/${this.roomId}`,
              (message: IMessage) => {
                this.handleIncomingStompMessage(message);
              }
            ) || null;

          // 2. Menga kelgan shaxsiy WebRTC signallarga obuna bo'lish
          this.userSubscription =
            this.client?.subscribe(
              `/topic/room/${this.roomId}/user/${this.user.id}`,
              (message: IMessage) => {
                this.handleIncomingStompMessage(message);
              }
            ) || null;

          // 3. Serverga kirganimizni bildirish
          this.sendJoin(this.user);
        },
        onStompError: (frame) => {
          console.warn('STOMP xatosi:', frame.headers['message']);
          this.isConnected = false;
        },
        onWebSocketClose: () => {
          this.isConnected = false;
        },
      });

      this.client.activate();
    } catch (err) {
      console.warn('STOMP ulanishida xatolik, fallback rejimida davom etilmoqda:', err);
    }
  }

  private handleIncomingStompMessage(message: IMessage): void {
    try {
      const data = JSON.parse(message.body);
      if (!this.onEventCallback) return;

      switch (data.type) {
        case 'USER_JOINED':
          this.onEventCallback({
            type: 'USER_JOINED',
            payload: data.payload,
          });
          break;

        case 'USER_LEFT':
          this.onEventCallback({
            type: 'USER_LEFT',
            payload: { userId: data.senderId, userName: data.payload },
          });
          break;

        case 'STATE_CHANGE':
          this.onEventCallback({
            type: 'USER_STATE_CHANGED',
            payload: data.payload,
          });
          break;

        case 'SIGNAL':
        case 'OFFER':
        case 'ANSWER':
        case 'ICE_CANDIDATE':
          this.onEventCallback({
            type: 'SIGNAL',
            payload: {
              senderId: data.senderId,
              targetUserId: data.targetUserId,
              data: data.payload,
            },
          });
          break;

        case 'CHAT_MESSAGE':
          this.onEventCallback({
            type: 'CHAT_MESSAGE',
            payload: data.payload,
          });
          break;

        case 'REACTION':
          this.onEventCallback({
            type: 'REACTION',
            payload: data.payload,
          });
          break;

        case 'PONG':
          if (Array.isArray(data.payload)) {
            data.payload.forEach((p: Participant) => {
              if (p.id !== this.user.id && this.onEventCallback) {
                this.onEventCallback({
                  type: 'USER_JOINED',
                  payload: p,
                });
              }
            });
          }
          break;
      }
    } catch (e) {
      console.error('STOMP xabarini parse qilishda xatolik:', e);
    }
  }

  public onEvent(callback: (event: SocketEvent) => void): void {
    this.onEventCallback = callback;
  }

  public sendJoin(user: Participant): void {
    if (this.isConnected && this.client?.connected) {
      this.client.publish({
        destination: '/app/meeting.join',
        body: JSON.stringify({
          type: 'JOIN',
          roomId: this.roomId,
          senderId: user.id,
          payload: user,
          timestamp: Date.now(),
        }),
      });
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: 'USER_JOINED', payload: user });
      } catch {}
    }
  }

  public sendSignal(targetUserId: string, signalData: Record<string, unknown>): void {
    if (this.isConnected && this.client?.connected) {
      this.client.publish({
        destination: '/app/meeting.signal',
        body: JSON.stringify({
          type: signalData.type || 'SIGNAL',
          roomId: this.roomId,
          senderId: this.user.id,
          targetUserId: targetUserId,
          payload: signalData,
          timestamp: Date.now(),
        }),
      });
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'SIGNAL',
          payload: {
            senderId: this.user.id,
            targetUserId: targetUserId,
            data: signalData,
          },
        });
      } catch {}
    }
  }

  public sendStateChange(changes: Partial<Participant> & { id: string }): void {
    if (this.isConnected && this.client?.connected) {
      this.client.publish({
        destination: '/app/meeting.state',
        body: JSON.stringify({
          type: 'STATE_CHANGE',
          roomId: this.roomId,
          senderId: changes.id,
          payload: changes,
          timestamp: Date.now(),
        }),
      });
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'USER_STATE_CHANGED',
          payload: changes,
        });
      } catch {}
    }
  }

  public sendChatMessage(message: ChatMessage): void {
    if (this.isConnected && this.client?.connected) {
      this.client.publish({
        destination: '/app/meeting.chat',
        body: JSON.stringify({
          type: 'CHAT_MESSAGE',
          roomId: this.roomId,
          senderId: message.senderId,
          payload: message,
          timestamp: message.timestamp,
        }),
      });
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'CHAT_MESSAGE',
          payload: message,
        });
      } catch {}
    }
  }

  public sendReaction(reaction: FloatingReaction): void {
    if (this.isConnected && this.client?.connected) {
      this.client.publish({
        destination: '/app/meeting.reaction',
        body: JSON.stringify({
          type: 'REACTION',
          roomId: this.roomId,
          senderId: this.user.id,
          payload: reaction,
          timestamp: reaction.timestamp,
        }),
      });
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'REACTION',
          payload: reaction,
        });
      } catch {}
    }
  }

  public destroy(): void {
    try {
      if (this.roomSubscription) this.roomSubscription.unsubscribe();
      if (this.userSubscription) this.userSubscription.unsubscribe();
      if (this.client) {
        this.client.deactivate();
        this.client = null;
      }
      if (this.broadcastChannel) {
        this.broadcastChannel.close();
        this.broadcastChannel = null;
      }
    } catch {}
    this.isConnected = false;
  }
}
