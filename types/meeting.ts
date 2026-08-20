export interface Participant {
  id: string;
  name: string;
  avatarColor: string;
  avatarUrl?: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isHost: boolean;
  isLocal: boolean;
  audioLevel?: number;
  isSpeaking?: boolean;
  stream?: MediaStream | null;
  screenStream?: MediaStream | null;
  joinedAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface MeetingReaction {
  id: string;
  emoji: string;
  senderName: string;
  senderColor: string;
  x: number;
  y: number;
  timestamp: number;
}

export interface MediaDeviceState {
  audioInputId: string;
  videoInputId: string;
  audioOutputId: string;
  availableAudioInputs: MediaDeviceInfo[];
  availableVideoInputs: MediaDeviceInfo[];
  availableAudioOutputs: MediaDeviceInfo[];
}

export type ViewMode = 'grid' | 'spotlight' | 'presentation' | 'whiteboard';

export interface RoomConfig {
  roomId: string;
  roomName: string;
  userName: string;
  isAudioDefault: boolean;
  isVideoDefault: boolean;
}
