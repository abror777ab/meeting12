/**
 * ApiService provides strongly typed HTTP REST client communication
 * with the Spring Boot backend.
 * Follows Single Responsibility Principle (SRP).
 */

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://213.199.51.43.sslip.io';


export interface BackendRoomResponse {
  id: string;
  roomCode: string;
  title: string;
  hostName: string;
  activeParticipantsCount: number;
  participants: BackendParticipantResponse[];
  createdAt: number;
}

export interface BackendParticipantResponse {
  id: string;
  name: string;
  avatarColor: string;
  avatarUrl?: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  handRaised: boolean;
  host: boolean;
  joinedAt: number;
}

export interface IceServerConfig {
  urls: string[];
  username?: string;
  credential?: string;
}

export class ApiService {
  /**
   * Check backend health status
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Create or fetch a room via Spring Boot REST API
   */
  static async createOrGetRoom(roomCode: string, title?: string, hostName?: string): Promise<BackendRoomResponse | null> {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          title: title || roomCode,
          hostName: hostName || 'Guest',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create room: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.warn('[ApiService] Backend API unavailable, falling back to local mode:', err);
      return null;
    }
  }

  /**
   * Get active participants in a room
   */
  static async getRoomParticipants(roomCode: string): Promise<BackendParticipantResponse[]> {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/rooms/${roomCode}/participants`);
      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  }

  /**
   * Fetch WebRTC STUN/TURN ICE servers configuration from backend
   */
  static async getIceServers(): Promise<RTCIceServer[]> {
    const fallbackStuns: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ];

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/config/ice-servers`);
      if (!response.ok) return fallbackStuns;
      const data: IceServerConfig[] = await response.json();
      return data.map((item) => ({
        urls: item.urls,
        username: item.username,
        credential: item.credential,
      }));
    } catch {
      return fallbackStuns;
    }
  }
}
