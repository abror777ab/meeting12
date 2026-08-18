'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
  ReactNode,
} from 'react';
import {
  Participant,
  ChatMessage,
  FloatingReaction,
  MeetingViewMode,
  MediaDeviceInfoState,
  VideoResolution,
  AudioProcessingConfig,
  VideoProcessingConfig,
} from '../types/meeting';
import { useMediaDevices } from '../hooks/useMediaDevices';
import { useScreenShare } from '../hooks/useScreenShare';
import { useMeetingRecorder } from '../hooks/useMeetingRecorder';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer';
import { MeetingSocketService } from '../services/meeting-socket.service';
import { ApiService } from '../services/api.service';
import { generateId } from '../utils/formatters';
import { AVATAR_COLORS } from '../utils/constants';

interface MeetingContextType {
  // Room State
  roomId: string;
  roomTitle: string;
  isJoined: boolean;
  viewMode: MeetingViewMode;
  pinnedParticipantId: string | null;
  activeSpeakerId: string | null;
  unreadCount: number;

  // Current User
  currentUser: Participant | null;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  localAudioLevel: number;
  permissionError: string | null;
  deviceState: MediaDeviceInfoState;
  audioConfig: AudioProcessingConfig;
  videoConfig: VideoProcessingConfig;

  // Participants
  participants: Participant[];

  // Chat & Reactions
  messages: ChatMessage[];
  reactions: FloatingReaction[];

  // Panels & Modals
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  isSettingsOpen: boolean;
  isInviteOpen: boolean;

  // Recording
  isRecording: boolean;
  recordingDuration: number;

  // Actions
  joinRoom: (roomId: string, userName: string, avatarColor?: string) => Promise<void>;
  leaveRoom: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
  toggleHandRaise: () => void;
  toggleRecording: () => void;
  sendMessage: (text: string) => void;
  sendReaction: (emoji: string) => void;
  setPinnedParticipantId: (id: string | null) => void;
  setViewMode: (mode: MeetingViewMode) => void;
  setIsChatOpen: (open: boolean) => void;
  setIsParticipantsOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsInviteOpen: (open: boolean) => void;
  selectAudioInput: (deviceId: string) => Promise<void>;
  selectVideoInput: (deviceId: string) => Promise<void>;
  setResolution: (resolution: VideoResolution) => Promise<void>;
  toggleMirror: () => void;
  toggleVirtualBlur: () => void;
  setMicGain: (gain: number) => void;
  toggleMicLoopback: () => void;
  playSpeakerTestSound: () => void;
  initializeStream: (audioId?: string, videoId?: string) => Promise<void>;
  removeParticipant: (participantId: string) => void;
  muteAllParticipants: () => void;
}

const MeetingContext = createContext<MeetingContextType | null>(null);

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [roomId, setRoomId] = useState<string>('');
  const [roomTitle, setRoomTitle] = useState<string>('Uchrashuv');
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<MeetingViewMode>('grid');
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Sidebars
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Lists
  const [remoteParticipants, setRemoteParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  // User Profile
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userColor, setUserColor] = useState<string>(AVATAR_COLORS[0]);
  const [joinTimestamp, setJoinTimestamp] = useState<number>(0);

  // STOMP WebSocket Service
  const socketServiceRef = useRef<MeetingSocketService | null>(null);

  // Custom Hooks
  const {
    localStream,
    isAudioMuted,
    isVideoMuted,
    permissionError,
    deviceState,
    audioConfig,
    videoConfig,
    toggleAudio: hookToggleAudio,
    toggleVideo: hookToggleVideo,
    selectAudioInput,
    selectVideoInput,
    setResolution,
    toggleMirror,
    toggleVirtualBlur,
    setMicGain,
    toggleMicLoopback,
    playSpeakerTestSound,
    initializeStream,
  } = useMediaDevices();

  const {
    screenStream,
    isSharing: isScreenSharing,
    toggleScreenShare: hookToggleScreenShare,
    stopScreenShare,
  } = useScreenShare();

  const {
    isRecording,
    recordingDuration,
    toggleRecording: hookToggleRecording,
  } = useMeetingRecorder();

  const localAudioLevel = useAudioVisualizer(localStream, isAudioMuted);

  // Active Speaker computed directly
  const activeSpeakerId = useMemo(() => {
    if (localAudioLevel > 25) {
      return currentUserId;
    }
    const loudestRemote = remoteParticipants.find((p) => p.audioLevel > 25);
    return loudestRemote ? loudestRemote.id : null;
  }, [localAudioLevel, currentUserId, remoteParticipants]);

  // Local User Object
  const currentUser: Participant | null = useMemo(() => {
    if (!isJoined) return null;
    return {
      id: currentUserId,
      name: userName,
      avatarColor: userColor,
      isLocal: true,
      isHost: true,
      isAudioMuted,
      isVideoMuted,
      isScreenSharing,
      isHandRaised,
      audioLevel: localAudioLevel,
      isMirrored: videoConfig.isMirrored,
      isBlurred: videoConfig.isBlurredBackground,
      stream: localStream,
      screenStream,
      joinedAt: joinTimestamp,
    };
  }, [
    isJoined,
    currentUserId,
    userName,
    userColor,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    isHandRaised,
    localAudioLevel,
    videoConfig.isMirrored,
    videoConfig.isBlurredBackground,
    localStream,
    screenStream,
    joinTimestamp,
  ]);

  // All combined participants
  const participants = useMemo(() => {
    if (!currentUser) return remoteParticipants;
    return [currentUser, ...remoteParticipants];
  }, [currentUser, remoteParticipants]);

  // Initialize room with Spring Boot Backend & STOMP
  const joinRoom = useCallback(
    async (targetRoomId: string, name: string, avatarColor?: string) => {
      const uId = generateId('user');
      const now = Date.now();
      const chosenColor =
        avatarColor ||
        AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

      setCurrentUserId(uId);
      setUserName(name);
      setUserColor(chosenColor);
      setJoinTimestamp(now);
      setRoomId(targetRoomId);
      setRoomTitle(`Xona #${targetRoomId}`);
      setIsJoined(true);

      const newLocalUser: Participant = {
        id: uId,
        name,
        avatarColor: chosenColor,
        isLocal: true,
        isHost: true,
        isAudioMuted,
        isVideoMuted,
        isScreenSharing: false,
        isHandRaised: false,
        audioLevel: 0,
        joinedAt: now,
      };

      // 1. STOMP Socket ulanishini yaratish
      const socket = new MeetingSocketService(targetRoomId, newLocalUser);
      socketServiceRef.current = socket;

      socket.onEvent((event) => {
        switch (event.type) {
          case 'USER_JOINED': {
            if (event.payload.id === uId) return;
            setRemoteParticipants((prev) => {
              if (prev.some((p) => p.id === event.payload.id)) return prev;
              return [...prev, { ...event.payload, isLocal: false }];
            });

            setMessages((prev) => [
              ...prev,
              {
                id: generateId('sys_msg'),
                senderId: 'system',
                senderName: 'Tizim',
                avatarColor: 'from-gray-600 to-gray-800',
                text: `${event.payload.name} uchrashuvga qo'shildi`,
                timestamp: Date.now(),
                isSystem: true,
              },
            ]);
            break;
          }

          case 'USER_LEFT': {
            setRemoteParticipants((prev) => {
              const leavingUser = prev.find((p) => p.id === event.payload.userId);
              const displayName = leavingUser?.name || event.payload.userName || 'Foydalanuvchi';
              setMessages((m) => [
                ...m,
                {
                  id: generateId('sys_msg'),
                  senderId: 'system',
                  senderName: 'Tizim',
                  avatarColor: 'from-gray-600 to-gray-800',
                  text: `${displayName} uchrashuvni tark etdi`,
                  timestamp: Date.now(),
                  isSystem: true,
                },
              ]);
              return prev.filter((p) => p.id !== event.payload.userId);
            });
            break;
          }

          case 'USER_STATE_CHANGED': {
            setRemoteParticipants((prev) =>
              prev.map((p) =>
                p.id === event.payload.id ? { ...p, ...event.payload } : p
              )
            );
            break;
          }

          case 'CHAT_MESSAGE': {
            setMessages((prev) => {
              if (prev.some((m) => m.id === event.payload.id)) return prev;
              return [...prev, event.payload];
            });
            if (!isChatOpen) {
              setUnreadCount((c) => c + 1);
            }
            break;
          }

          case 'REACTION': {
            setReactions((prev) => [...prev, event.payload]);
            setTimeout(() => {
              setReactions((prev) =>
                prev.filter((r) => r.id !== event.payload.id)
              );
            }, 3000);
            break;
          }

          case 'PONG': {
            if (event.payload.fromUser && event.payload.fromUser.id !== uId) {
              setRemoteParticipants((prev) => {
                if (prev.some((p) => p.id === event.payload.fromUser.id)) return prev;
                return [...prev, { ...event.payload.fromUser, isLocal: false }];
              });
            }
            break;
          }
        }
      });

      // 2. Chat tarixini yuklash (REST API: GET /api/chat/{roomId}/messages)
      try {
        const history = await ApiService.getChatHistory(targetRoomId);
        if (history && history.length > 0) {
          setMessages(
            history.map((h) => ({
              id: String(h.id),
              senderId: h.senderId,
              senderName: h.senderName,
              avatarColor: h.avatarColor,
              text: h.text,
              timestamp: h.timestamp,
              isSystem: h.isSystem,
            }))
          );
        } else {
          setMessages([
            {
              id: generateId('msg'),
              senderId: 'system',
              senderName: 'Tizim',
              avatarColor: 'from-blue-600 to-indigo-700',
              text: `Xush kelibsiz! Uchrashuv kodi: ${targetRoomId}`,
              timestamp: Date.now(),
              isSystem: true,
            },
          ]);
        }
      } catch {
        setMessages([
          {
            id: generateId('msg'),
            senderId: 'system',
            senderName: 'Tizim',
            avatarColor: 'from-blue-600 to-indigo-700',
            text: `Xush kelibsiz! Uchrashuv kodi: ${targetRoomId}`,
            timestamp: Date.now(),
            isSystem: true,
          },
        ]);
      }
    },
    [isAudioMuted, isVideoMuted, isChatOpen]
  );

  const leaveRoom = useCallback(() => {
    if (socketServiceRef.current) {
      socketServiceRef.current.destroy();
      socketServiceRef.current = null;
    }
    stopScreenShare();
    setIsJoined(false);
    setRemoteParticipants([]);
    setMessages([]);
    setReactions([]);
  }, [stopScreenShare]);

  // Audio mute toggling with STOMP broadcast
  const toggleAudio = useCallback(() => {
    hookToggleAudio();
    if (socketServiceRef.current && currentUserId) {
      socketServiceRef.current.sendStateChange({
        id: currentUserId,
        isAudioMuted: !isAudioMuted,
      });
    }
  }, [hookToggleAudio, currentUserId, isAudioMuted]);

  // Video mute toggling with STOMP broadcast
  const toggleVideo = useCallback(() => {
    hookToggleVideo();
    if (socketServiceRef.current && currentUserId) {
      socketServiceRef.current.sendStateChange({
        id: currentUserId,
        isVideoMuted: !isVideoMuted,
      });
    }
  }, [hookToggleVideo, currentUserId, isVideoMuted]);

  // Screen sharing toggle with STOMP broadcast
  const toggleScreenShareAction = useCallback(async () => {
    const stream = await hookToggleScreenShare();
    const isNowSharing = Boolean(stream);
    if (socketServiceRef.current && currentUserId) {
      socketServiceRef.current.sendStateChange({
        id: currentUserId,
        isScreenSharing: isNowSharing,
      });
    }
  }, [hookToggleScreenShare, currentUserId]);

  // Send Floating Reaction (declared before toggleHandRaise)
  const sendReaction = useCallback(
    (emoji: string) => {
      if (!currentUserId || !userName) return;

      const reaction: FloatingReaction = {
        id: generateId('reaction'),
        senderName: userName,
        emoji,
        timestamp: Date.now(),
        xPosition: Math.floor(Math.random() * 70) + 15, // 15% to 85%
      };

      setReactions((prev) => [...prev, reaction]);
      socketServiceRef.current?.sendReaction(reaction);

      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 3200);
    },
    [currentUserId, userName]
  );

  // Hand raise toggle
  const toggleHandRaise = useCallback(() => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    if (socketServiceRef.current && currentUserId) {
      socketServiceRef.current.sendStateChange({
        id: currentUserId,
        isHandRaised: nextState,
      });
      if (nextState) {
        sendReaction('✋');
      }
    }
  }, [isHandRaised, currentUserId, sendReaction]);

  // Recording
  const toggleRecordingAction = useCallback(() => {
    const streamToRecord = screenStream || localStream;
    hookToggleRecording(streamToRecord, roomTitle);
  }, [screenStream, localStream, hookToggleRecording, roomTitle]);

  // Send Chat Message to Backend
  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !currentUser) return;

      const message: ChatMessage = {
        id: generateId('chat_msg'),
        senderId: currentUser.id,
        senderName: currentUser.name,
        avatarColor: currentUser.avatarColor,
        text: text.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, message]);
      socketServiceRef.current?.sendChatMessage(message);
    },
    [currentUser]
  );

  // Kick / remove participant
  const removeParticipant = useCallback((participantId: string) => {
    setRemoteParticipants((prev) => prev.filter((p) => p.id !== participantId));
  }, []);

  // Mute all participants
  const muteAllParticipants = useCallback(() => {
    setRemoteParticipants((prev) =>
      prev.map((p) => ({ ...p, isAudioMuted: true }))
    );
  }, []);

  // Reset unread count when opening chat
  const handleSetIsChatOpen = useCallback((open: boolean) => {
    setIsChatOpen(open);
    if (open) {
      setUnreadCount(0);
      setIsParticipantsOpen(false);
    }
  }, []);

  const handleSetIsParticipantsOpen = useCallback((open: boolean) => {
    setIsParticipantsOpen(open);
    if (open) {
      setIsChatOpen(false);
    }
  }, []);

  return (
    <MeetingContext.Provider
      value={{
        roomId,
        roomTitle,
        isJoined,
        viewMode,
        pinnedParticipantId,
        activeSpeakerId,
        unreadCount,
        currentUser,
        localStream,
        screenStream,
        isAudioMuted,
        isVideoMuted,
        isScreenSharing,
        isHandRaised,
        localAudioLevel,
        permissionError,
        deviceState,
        audioConfig,
        videoConfig,
        participants,
        messages,
        reactions,
        isChatOpen,
        isParticipantsOpen,
        isSettingsOpen,
        isInviteOpen,
        isRecording,
        recordingDuration,
        joinRoom,
        leaveRoom,
        toggleAudio,
        toggleVideo,
        toggleScreenShare: toggleScreenShareAction,
        toggleHandRaise,
        toggleRecording: toggleRecordingAction,
        sendMessage,
        sendReaction,
        setPinnedParticipantId,
        setViewMode,
        setIsChatOpen: handleSetIsChatOpen,
        setIsParticipantsOpen: handleSetIsParticipantsOpen,
        setIsSettingsOpen,
        setIsInviteOpen,
        selectAudioInput,
        selectVideoInput,
        setResolution,
        toggleMirror,
        toggleVirtualBlur,
        setMicGain,
        toggleMicLoopback,
        playSpeakerTestSound,
        initializeStream,
        removeParticipant,
        muteAllParticipants,
      }}
    >
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
}
