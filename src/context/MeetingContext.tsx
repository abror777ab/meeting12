'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
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
import { WebRTCManager } from '../services/webrtc.service';
import { ApiService } from '../services/api.service';
import { generateId } from '../utils/formatters';
import { AVATAR_COLORS } from '../utils/constants';

interface MeetingContextType {
  roomId: string;
  roomTitle: string;
  isJoined: boolean;
  viewMode: MeetingViewMode;
  pinnedParticipantId: string | null;
  activeSpeakerId: string | null;
  unreadCount: number;

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

  participants: Participant[];
  messages: ChatMessage[];
  reactions: FloatingReaction[];

  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  isSettingsOpen: boolean;
  isInviteOpen: boolean;

  isRecording: boolean;
  recordingDuration: number;

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

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const [remoteParticipants, setRemoteParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userColor, setUserColor] = useState<string>(AVATAR_COLORS[0]);
  const [joinTimestamp, setJoinTimestamp] = useState<number>(0);

  const socketServiceRef = useRef<MeetingSocketService | null>(null);
  const webrtcManagerRef = useRef<WebRTCManager | null>(null);

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

  // Sync local stream with WebRTC Manager
  useEffect(() => {
    if (webrtcManagerRef.current) {
      webrtcManagerRef.current.setLocalStream(localStream);
    }
  }, [localStream]);

  const activeSpeakerId = useMemo(() => {
    if (localAudioLevel > 25) {
      return currentUserId;
    }
    const loudestRemote = remoteParticipants.find((p) => p.audioLevel > 25);
    return loudestRemote ? loudestRemote.id : null;
  }, [localAudioLevel, currentUserId, remoteParticipants]);

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

  const participants = useMemo(() => {
    if (!currentUser) return remoteParticipants;
    return [currentUser, ...remoteParticipants];
  }, [currentUser, remoteParticipants]);

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

      // 2. WebRTC P2P Menejeri
      const webrtc = new WebRTCManager(
        uId,
        socket,
        (remoteUserId, stream) => {
          setRemoteParticipants((prev) =>
            prev.map((p) => (p.id === remoteUserId ? { ...p, stream } : p))
          );
        },
        (remoteUserId) => {
          setRemoteParticipants((prev) => prev.filter((p) => p.id !== remoteUserId));
        }
      );
      webrtcManagerRef.current = webrtc;
      webrtc.setLocalStream(localStream);

      socket.onEvent((event) => {
        switch (event.type) {
          case 'USER_JOINED': {
            if (event.payload.id === uId) return;

            setRemoteParticipants((prev) => {
              if (prev.some((p) => p.id === event.payload.id)) return prev;
              return [...prev, { ...event.payload, isLocal: false }];
            });

            // Biz xonada avvaldan bor bo'lganimiz uchun yangi kishiga OFFER yuboramiz
            webrtc.createPeerConnection(event.payload.id, true);

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

          case 'SIGNAL': {
            const isForMe =
              event.payload.targetUserId === uId ||
              !event.payload.targetUserId ||
              event.payload.targetUserId === '';

            if (isForMe && event.payload.senderId !== uId) {
              webrtc.handleSignal(event.payload.senderId, event.payload.data);
            }
            break;
          }

          case 'USER_LEFT': {
            webrtc.removePeer(event.payload.userId);
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
            if (Array.isArray(event.payload)) {
              event.payload.forEach((p: Participant) => {
                if (p.id !== uId) {
                  setRemoteParticipants((prev) => {
                    if (prev.some((x) => x.id === p.id)) return prev;
                    return [...prev, { ...p, isLocal: false }];
                  });
                  // Yangi kirgan odam sifatida xonadagilardan Offer kutamiz (isInitiator = false)
                  webrtc.createPeerConnection(p.id, false);
                }
              });
            }
            break;
          }
        }
      });

      // 3. Xonadagi mavjud ishtirokchilarni REST API orqali ham yuklash
      try {
        const roomInfo = await ApiService.getRoomStatus(targetRoomId);
        if (roomInfo && roomInfo.participants) {
          roomInfo.participants.forEach((p) => {
            if (p.id !== uId) {
              setRemoteParticipants((prev) => {
                if (prev.some((x) => x.id === p.id)) return prev;
                return [...prev, { ...p, isLocal: false }];
              });
              webrtc.createPeerConnection(p.id, false);
            }
          });
        }
      } catch (e) {
        console.warn('Xona ma‘lumotlarini yuklashda ogohlantirish:', e);
      }

      // 4. Chat tarixini yuklash
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
    [isAudioMuted, isVideoMuted, isChatOpen, localStream]
  );

  const leaveRoom = useCallback(() => {
    if (webrtcManagerRef.current) {
      webrtcManagerRef.current.destroy();
      webrtcManagerRef.current = null;
    }
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

  const toggleAudio = useCallback(() => {
    hookToggleAudio();
    if (socketServiceRef.current && currentUserId) {
      socketServiceRef.current.sendStateChange({
        id: currentUserId,
        isAudioMuted: !isAudioMuted,
      });
    }
  }, [hookToggleAudio, currentUserId, isAudioMuted]);

  const toggleVideo = useCallback(() => {
    hookToggleVideo();
    if (socketServiceRef.current && currentUserId) {
      socketServiceRef.current.sendStateChange({
        id: currentUserId,
        isVideoMuted: !isVideoMuted,
      });
    }
  }, [hookToggleVideo, currentUserId, isVideoMuted]);

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

  const sendReaction = useCallback(
    (emoji: string) => {
      if (!currentUserId || !userName) return;

      const reaction: FloatingReaction = {
        id: generateId('reaction'),
        senderName: userName,
        emoji,
        timestamp: Date.now(),
        xPosition: Math.floor(Math.random() * 70) + 15,
      };

      setReactions((prev) => [...prev, reaction]);
      socketServiceRef.current?.sendReaction(reaction);

      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 3200);
    },
    [currentUserId, userName]
  );

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

  const toggleRecordingAction = useCallback(() => {
    const streamToRecord = screenStream || localStream;
    hookToggleRecording(streamToRecord, roomTitle);
  }, [screenStream, localStream, hookToggleRecording, roomTitle]);

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

  const removeParticipant = useCallback((participantId: string) => {
    setRemoteParticipants((prev) => prev.filter((p) => p.id !== participantId));
  }, []);

  const muteAllParticipants = useCallback(() => {
    setRemoteParticipants((prev) =>
      prev.map((p) => ({ ...p, isAudioMuted: true }))
    );
  }, []);

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
