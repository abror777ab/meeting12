'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Participant, ChatMessage, MeetingReaction, ViewMode } from '@/types/meeting';
import { SignalingChannel, SignalPayload, DrawLine } from '@/services/signalingService';
import { WebRtcMeshManager } from '@/services/webrtcMeshService';
import { ApiService } from '@/services/apiService';
import { soundService } from '@/services/soundService';
import { recordingService } from '@/services/recordingService';
const fireConfetti = (opts: { particleCount?: number; spread?: number; origin?: { y: number } }) => {
  if (typeof window !== 'undefined') {
    import('canvas-confetti')
      .then((mod) => {
        const confettiFn = mod.default || mod;
        confettiFn(opts);
      })
      .catch(() => {});
  }
};


const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
];

export function getRandomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

interface UseMeetingOptions {
  roomId: string;
  roomName?: string;
  userName: string;
  localStream: MediaStream | null;
  localScreenStream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  audioLevel: number;
  isSpeaking: boolean;
  onLeaveMeeting: () => void;
}

export function useMeeting({
  roomId,
  userName,
  localStream,
  localScreenStream,
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  audioLevel,
  isSpeaking,
  onLeaveMeeting,
}: UseMeetingOptions) {
  const [localParticipantId] = useState(() => 'usr_' + Math.random().toString(36).substring(2, 9));
  const [avatarColor] = useState(() => getRandomColor());
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<MeetingReaction[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [meetingDurationSeconds, setMeetingDurationSeconds] = useState(0);
  const [whiteboardLines, setWhiteboardLines] = useState<DrawLine[]>([]);

  const signalingRef = useRef<SignalingChannel | null>(null);
  const webrtcMeshRef = useRef<WebRtcMeshManager | null>(null);
  const localParticipantRef = useRef<Participant | null>(null);
  const isChatOpenRef = useRef(isChatOpen);
  isChatOpenRef.current = isChatOpen;

  // Local Participant object
  const localParticipant: Participant = {
    id: localParticipantId,
    name: userName || 'You',
    avatarColor,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isHandRaised,
    isHost: true,
    isLocal: true,
    audioLevel,
    isSpeaking,
    stream: localStream,
    screenStream: localScreenStream,
    joinedAt: Date.now(),
  };
  localParticipantRef.current = localParticipant;

  // Sync streams with WebRTC mesh
  useEffect(() => {
    if (webrtcMeshRef.current) {
      webrtcMeshRef.current.setLocalStreams(localStream, localScreenStream);
    }
  }, [localStream, localScreenStream]);

  // Timer for meeting duration
  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingDurationSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle incoming signaling messages
  const handleSignalMessage = useCallback((payload: SignalPayload) => {
    // Forward WebRTC SDP and ICE messages to WebRTC Mesh Manager
    if (webrtcMeshRef.current) {
      webrtcMeshRef.current.handleSignalingPayload(payload);
    }

    switch (payload.type) {
      case 'join': {
        if (payload.participant.id === localParticipantRef.current?.id) return;
        soundService.playJoinSound();
        setParticipants((prev) => {
          if (prev.some((p) => p.id === payload.participant.id)) {
            return prev.map((p) => (p.id === payload.participant.id ? { ...p, ...payload.participant } : p));
          }
          return [...prev, payload.participant];
        });

        // Call the newly joined participant via WebRTC Mesh
        if (webrtcMeshRef.current) {
          webrtcMeshRef.current.callPeer(payload.participant.id);
        }

        // Send state back to new participant
        if (localParticipantRef.current) {
          signalingRef.current?.broadcast({
            type: 'state-update',
            participantId: localParticipantRef.current.id,
            updates: localParticipantRef.current,
          });
        }
        break;
      }
      case 'leave': {
        soundService.playLeaveSound();
        setParticipants((prev) => prev.filter((p) => p.id !== payload.participantId));
        break;
      }
      case 'state-update': {
        if (payload.participantId === localParticipantRef.current?.id) return;
        setParticipants((prev) => {
          const exists = prev.some((p) => p.id === payload.participantId);
          if (!exists) {
            return [
              ...prev,
              {
                id: payload.participantId,
                name: 'Participant',
                avatarColor: getRandomColor(),
                isAudioEnabled: true,
                isVideoEnabled: true,
                isScreenSharing: false,
                isHandRaised: false,
                isHost: false,
                isLocal: false,
                joinedAt: Date.now(),
                ...payload.updates,
              },
            ];
          }
          return prev.map((p) => {
            if (p.id === payload.participantId) {
              return {
                ...p,
                ...payload.updates,
                stream: p.stream, // preserve active camera/mic stream
                screenStream: p.screenStream, // preserve active screen share stream
              };
            }
            return p;
          });
        });
        break;
      }
      case 'chat-message': {
        if (payload.message.senderId !== localParticipantRef.current?.id) {
          soundService.playMessageSound();
          if (!isChatOpenRef.current) {
            setUnreadChatCount((count) => count + 1);
          }
        }
        setMessages((prev) => [...prev, payload.message]);
        break;
      }
      case 'reaction': {
        if (payload.reaction.emoji === '🎉') {
          fireConfetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        }
        setReactions((prev) => [...prev.slice(-15), payload.reaction]);
        break;
      }
      case 'request-state': {
        if (payload.requesterId === localParticipantRef.current?.id) return;
        if (localParticipantRef.current) {
          signalingRef.current?.broadcast({
            type: 'state-update',
            participantId: localParticipantRef.current.id,
            updates: localParticipantRef.current,
          });
        }
        if (webrtcMeshRef.current) {
          webrtcMeshRef.current.callPeer(payload.requesterId);
        }
        break;
      }
      case 'whiteboard-draw': {
        setWhiteboardLines((prev) => [...prev, payload.line]);
        break;
      }
      case 'whiteboard-clear': {
        setWhiteboardLines([]);
        break;
      }
    }
  }, []);

  // Initialize Backend REST Registration + Signaling Channel + WebRTC Mesh
  useEffect(() => {
    const cleanRoomId = roomId.trim().toLowerCase();

    // 1. Register room with Spring Boot backend REST API
    ApiService.createOrGetRoom(cleanRoomId, cleanRoomId, userName);

    // 2. Initialize Signaling Channel (WebSocket + BroadcastChannel)
    const channel = new SignalingChannel(cleanRoomId, handleSignalMessage);
    signalingRef.current = channel;

    // 3. Initialize WebRTC Mesh Manager for live audio/video transmission
    const meshManager = new WebRtcMeshManager(
      localParticipantId,
      cleanRoomId,
      channel,
      (peerId, remoteStream) => {
        // When remote audio/video stream arrives from peer
        setParticipants((prev) => {
          const exists = prev.some((p) => p.id === peerId);
          const videoTracks = remoteStream.getVideoTracks();
          const audioTracks = remoteStream.getAudioTracks();

          let cameraStream: MediaStream | undefined = remoteStream;
          let screenStream: MediaStream | undefined = undefined;

          if (videoTracks.length > 1) {
            cameraStream = new MediaStream([videoTracks[0], ...audioTracks]);
            screenStream = new MediaStream([videoTracks[1]]);
          } else if (videoTracks.length === 1) {
            cameraStream = new MediaStream([videoTracks[0], ...audioTracks]);
          } else if (audioTracks.length > 0) {
            cameraStream = new MediaStream([...audioTracks]);
          }

          if (!exists) {
            return [
              ...prev,
              {
                id: peerId,
                name: 'Participant',
                avatarColor: getRandomColor(),
                isAudioEnabled: audioTracks.length > 0,
                isVideoEnabled: videoTracks.length > 0,
                isScreenSharing: false,
                isHandRaised: false,
                isHost: false,
                isLocal: false,
                stream: cameraStream,
                screenStream: screenStream,
                joinedAt: Date.now(),
              },
            ];
          }
          return prev.map((p) => {
            if (p.id === peerId) {
              return {
                ...p,
                stream: cameraStream,
                screenStream: p.isScreenSharing ? (screenStream || p.screenStream || cameraStream) : p.screenStream,
              };
            }
            return p;
          });
        });
      },
      (peerId) => {
        // When peer disconnects
        setParticipants((prev) => prev.filter((p) => p.id !== peerId));
      }
    );
    webrtcMeshRef.current = meshManager;

    // 4. REST Sync: Fetch active participants already in the room from backend
    ApiService.getRoomParticipants(roomId).then((existingParts) => {
      if (existingParts && existingParts.length > 0) {
        existingParts.forEach((bp) => {
          if (bp.id && bp.id !== localParticipantId) {
            setParticipants((prev) => {
              if (prev.some((p) => p.id === bp.id)) return prev;
              return [
                ...prev,
                {
                  id: bp.id,
                  name: bp.name || 'Participant',
                  avatarColor: bp.avatarColor || getRandomColor(),
                  isAudioEnabled: bp.audioEnabled,
                  isVideoEnabled: bp.videoEnabled,
                  isScreenSharing: bp.screenSharing,
                  isHandRaised: bp.handRaised,
                  isHost: bp.host,
                  isLocal: false,
                  joinedAt: bp.joinedAt || Date.now(),
                },
              ];
            });
            meshManager.callPeer(bp.id);
          }
        });
      }
    }).catch(() => {});

    // Broadcast self join & request room state from existing members
    channel.broadcast({
      type: 'join',
      participant: localParticipant,
    });
    channel.broadcast({
      type: 'request-state',
      requesterId: localParticipantId,
    });


    // Add welcome system message
    setMessages([
      {
        id: 'sys_1',
        senderId: 'system',
        senderName: 'System',
        senderColor: 'bg-slate-700',
        text: `Xush kelibsiz! Siz "${roomId}" xonasidasiz. Spring Boot WebSocket & WebRTC serveriga muvaffaqiyatli ulandingiz.`,
        timestamp: Date.now(),
        isSystem: true,
      },
    ]);

    return () => {
      channel.broadcast({
        type: 'leave',
        participantId: localParticipantId,
      });
      channel.close();
      meshManager.closeAll();
    };
  }, [roomId, handleSignalMessage, localParticipantId, userName]);

  // Sync local participant state across backend channel
  useEffect(() => {
    signalingRef.current?.broadcast({
      type: 'state-update',
      participantId: localParticipantId,
      updates: {
        name: userName,
        isAudioEnabled,
        isVideoEnabled,
        isScreenSharing,
        isHandRaised,
        audioLevel,
        isSpeaking,
      },
    });
  }, [userName, isAudioEnabled, isVideoEnabled, isScreenSharing, isHandRaised, audioLevel, isSpeaking, localParticipantId]);

  // Toggle Hand Raise
  const toggleHandRaise = useCallback(() => {
    setIsHandRaised((prev) => {
      const next = !prev;
      if (next) {
        soundService.playHandRaiseSound();
      }
      return next;
    });
  }, []);

  // Send Chat Message
  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const newMsg: ChatMessage = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        senderId: localParticipantId,
        senderName: userName || 'You',
        senderColor: avatarColor,
        text: text.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, newMsg]);
      signalingRef.current?.broadcast({
        type: 'chat-message',
        message: newMsg,
      });
    },
    [localParticipantId, userName, avatarColor]
  );

  // Send Floating Emoji Reaction
  const sendReaction = useCallback(
    (emoji: string) => {
      const reaction: MeetingReaction = {
        id: 'react_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        emoji,
        senderName: userName || 'You',
        senderColor: avatarColor,
        x: Math.floor(Math.random() * 60) + 20,
        y: Math.floor(Math.random() * 30) + 60,
        timestamp: Date.now(),
      };

      if (emoji === '🎉') {
        fireConfetti({ particleCount: 60, spread: 70, origin: { y: 0.8 } });
      }

      setReactions((prev) => [...prev.slice(-15), reaction]);
      signalingRef.current?.broadcast({
        type: 'reaction',
        reaction,
      });

      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 3000);
    },
    [userName, avatarColor]
  );

  // Send Whiteboard draw line
  const sendWhiteboardLine = useCallback((line: DrawLine) => {
    setWhiteboardLines((prev) => [...prev, line]);
    signalingRef.current?.broadcast({
      type: 'whiteboard-draw',
      line,
    });
  }, []);

  // Clear Whiteboard
  const clearWhiteboard = useCallback(() => {
    setWhiteboardLines([]);
    signalingRef.current?.broadcast({
      type: 'whiteboard-clear',
    });
  }, []);

  // Recording Meeting
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recordingService.stopRecording();
      setIsRecording(false);
    } else {
      const activeStream = localScreenStream || localStream;
      if (!activeStream) {
        alert('Yozib olish uchun avval kamera yoki screen share yoqilgan bo‘lishi kerak.');
        return;
      }
      const started = recordingService.startRecording(activeStream, () => {
        setIsRecording(false);
      });
      if (started) {
        setIsRecording(true);
      }
    }
  }, [isRecording, localScreenStream, localStream]);

  // Add demo participants for instant UI/UX testing
  const addDemoParticipants = useCallback(() => {
    const demoUsers: Participant[] = [
      {
        id: 'demo_jasur',
        name: 'Jasur Bek (Tech Lead)',
        avatarColor: 'from-cyan-500 to-blue-600',
        isAudioEnabled: true,
        isVideoEnabled: true,
        isScreenSharing: false,
        isHandRaised: false,
        isHost: false,
        isLocal: false,
        isSpeaking: true,
        audioLevel: 65,
        joinedAt: Date.now() - 120000,
      },
      {
        id: 'demo_malika',
        name: 'Malika Karimova (UI/UX Designer)',
        avatarColor: 'from-purple-500 to-pink-600',
        isAudioEnabled: true,
        isVideoEnabled: false,
        isScreenSharing: false,
        isHandRaised: true,
        isHost: false,
        isLocal: false,
        isSpeaking: false,
        audioLevel: 0,
        joinedAt: Date.now() - 60000,
      },
      {
        id: 'demo_bobur',
        name: 'Bobur Saidov (Backend Engineer)',
        avatarColor: 'from-emerald-500 to-teal-600',
        isAudioEnabled: false,
        isVideoEnabled: true,
        isScreenSharing: false,
        isHandRaised: false,
        isHost: false,
        isLocal: false,
        isSpeaking: false,
        audioLevel: 0,
        joinedAt: Date.now() - 30000,
      },
    ];

    soundService.playJoinSound();
    setParticipants((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const newDemos = demoUsers.filter((d) => !existingIds.has(d.id));
      return [...prev, ...newDemos];
    });

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: 'demo_msg_1',
          senderId: 'demo_jasur',
          senderName: 'Jasur Bek (Tech Lead)',
          senderColor: 'from-cyan-500 to-blue-600',
          text: 'Salom hammaga! Spring Boot backend orqali WebRTC signallari ajoyib ishlamoqda.',
          timestamp: Date.now(),
        },
      ]);
      soundService.playMessageSound();
    }, 1000);
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => {
      const next = !prev;
      if (next) setUnreadChatCount(0);
      return next;
    });
  }, []);

  const allParticipants = [localParticipant, ...participants];
  const anyScreenSharing = allParticipants.some((p) => p.isScreenSharing);
  const activeViewMode: ViewMode = isWhiteboardOpen
    ? 'whiteboard'
    : anyScreenSharing
    ? 'presentation'
    : pinnedParticipantId
    ? 'spotlight'
    : viewMode;

  return {
    localParticipant,
    participants,
    allParticipants,
    messages,
    reactions,
    viewMode: activeViewMode,
    setViewMode,
    pinnedParticipantId,
    setPinnedParticipantId,
    isHandRaised,
    toggleHandRaise,
    isRecording,
    toggleRecording,
    unreadChatCount,
    isChatOpen,
    toggleChat,
    isParticipantsOpen,
    setIsParticipantsOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isInviteOpen,
    setIsInviteOpen,
    isWhiteboardOpen,
    setIsWhiteboardOpen,
    whiteboardLines,
    sendWhiteboardLine,
    clearWhiteboard,
    meetingDurationSeconds,
    sendMessage,
    sendReaction,
    addDemoParticipants,
    onLeaveMeeting,
  };
}
