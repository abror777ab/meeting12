export const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface BackendRoomResponse {
  roomCode: string;
  title: string;
  hostUserId?: string;
  active: boolean;
  participantCount: number;
  participants: Array<{
    id: string;
    sessionId?: string;
    name: string;
    avatarColor: string;
    isHost: boolean;
    isAudioMuted: boolean;
    isVideoMuted: boolean;
    isScreenSharing: boolean;
    isHandRaised: boolean;
    audioLevel: number;
    joinedAt: number;
  }>;
  createdAt?: string;
}

export interface BackendChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  avatarColor: string;
  text: string;
  timestamp: number;
  isSystem: boolean;
}

export class ApiService {
  /**
   * Backend serverining ishlab turganini tekshirish
   */
  public static async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/rooms/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Yangi xona yaratish (Spring Boot REST API: POST /api/rooms/create)
   */
  public static async createRoom(
    title?: string,
    hostName?: string,
    hostUserId?: string
  ): Promise<BackendRoomResponse | null> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, hostName, hostUserId }),
      });

      if (!res.ok) return null;
      const json: ApiResponse<BackendRoomResponse> = await res.json();
      return json.data;
    } catch (e) {
      console.warn('Backend REST API orqali xona yaratib bo‘lmadi, fallback rejim:', e);
      return null;
    }
  }

  /**
   * Xona holati va qatnashuvchilarini olish (GET /api/rooms/{code})
   */
  public static async getRoomStatus(
    roomCode: string
  ): Promise<BackendRoomResponse | null> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/rooms/${roomCode}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) return null;
      const json: ApiResponse<BackendRoomResponse> = await res.json();
      return json.data;
    } catch (e) {
      console.warn('Xona ma‘lumotlarini olishda xatolik:', e);
      return null;
    }
  }

  /**
   * Xonaning oldingi chat tarixini bazadan yuklash (GET /api/chat/{roomId}/messages)
   */
  public static async getChatHistory(
    roomId: string
  ): Promise<BackendChatMessage[]> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/chat/${roomId}/messages`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) return [];
      const json: ApiResponse<BackendChatMessage[]> = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  }
}
