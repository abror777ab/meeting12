export interface MediaDeviceInfoState {
  audioInputDevices: MediaDeviceInfo[];
  videoInputDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
  selectedAudioInputId: string;
  selectedVideoInputId: string;
  selectedAudioOutputId: string;
}

export type VideoResolution = '720p' | '1080p' | '480p';

export interface AudioProcessingConfig {
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  micGain: number; // 0 to 2 (1 = 100% standard)
  isTestingMic: boolean; // Mic Loopback
}

export interface VideoProcessingConfig {
  resolution: VideoResolution;
  isMirrored: boolean;
  isBlurredBackground: boolean;
}

export interface UserTrackState {
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  audioLevel: number;
}

export interface Participant {
  id: string;
  name: string;
  avatarColor: string;
  isLocal: boolean;
  isHost: boolean;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  audioLevel: number;
  isMirrored?: boolean;
  isBlurred?: boolean;
  stream?: MediaStream | null;
  screenStream?: MediaStream | null;
  joinedAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatarColor: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface FloatingReaction {
  id: string;
  senderName: string;
  emoji: string;
  timestamp: number;
  xPosition: number; // percentage 10% - 90%
}

export type MeetingViewMode = 'grid' | 'spotlight' | 'sidebar';

export interface MeetingRoomState {
  roomId: string;
  roomTitle: string;
  isJoined: boolean;
  currentUser: Participant | null;
  participants: Participant[];
  pinnedParticipantId: string | null;
  activeSpeakerId: string | null;
  viewMode: MeetingViewMode;
  messages: ChatMessage[];
  reactions: FloatingReaction[];
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  isSettingsOpen: boolean;
  isInviteOpen: boolean;
  isRecording: boolean;
  recordingDuration: number;
}
