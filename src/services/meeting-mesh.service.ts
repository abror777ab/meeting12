import { Participant, ChatMessage, FloatingReaction } from '../types/meeting';

export type MeshEvent =
  | { type: 'USER_JOINED'; payload: Participant }
  | { type: 'USER_LEFT'; payload: { userId: string } }
  | { type: 'USER_STATE_CHANGED'; payload: Partial<Participant> & { id: string } }
  | { type: 'CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'REACTION'; payload: FloatingReaction }
  | { type: 'PING'; payload: { fromUserId: string } }
  | { type: 'PONG'; payload: { fromUser: Participant } };

export class MeetingMeshService {
  private channel: BroadcastChannel | null = null;
  private roomId: string;
  private userId: string;
  private onEventCallback?: (event: MeshEvent) => void;

  constructor(roomId: string, userId: string) {
    this.roomId = roomId;
    this.userId = userId;
    this.initChannel();
  }

  private initChannel(): void {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return;

    try {
      this.channel = new BroadcastChannel(`meeting_room_${this.roomId}`);
      this.channel.onmessage = (event: MessageEvent<MeshEvent>) => {
        if (this.onEventCallback) {
          this.onEventCallback(event.data);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel ochishda xatolik:', e);
    }
  }

  public onEvent(callback: (event: MeshEvent) => void): void {
    this.onEventCallback = callback;
  }

  public broadcast(event: MeshEvent): void {
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (err) {
        console.warn('Broadcast xabari yuborilmadi:', err);
      }
    }
  }

  public broadcastJoin(user: Participant): void {
    this.broadcast({ type: 'USER_JOINED', payload: user });
  }

  public broadcastLeave(): void {
    this.broadcast({ type: 'USER_LEFT', payload: { userId: this.userId } });
  }

  public broadcastStateChange(changes: Partial<Participant> & { id: string }): void {
    this.broadcast({ type: 'USER_STATE_CHANGED', payload: changes });
  }

  public broadcastChatMessage(message: ChatMessage): void {
    this.broadcast({ type: 'CHAT_MESSAGE', payload: message });
  }

  public broadcastReaction(reaction: FloatingReaction): void {
    this.broadcast({ type: 'REACTION', payload: reaction });
  }

  public pingRoom(): void {
    this.broadcast({ type: 'PING', payload: { fromUserId: this.userId } });
  }

  public pongUser(user: Participant): void {
    this.broadcast({ type: 'PONG', payload: { fromUser: user } });
  }

  public destroy(): void {
    this.broadcastLeave();
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}
