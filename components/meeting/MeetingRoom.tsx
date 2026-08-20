'use client';

import React, { useEffect } from 'react';
import { RoomConfig } from '@/types/meeting';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useMeeting } from '@/hooks/useMeeting';
import { MeetingHeader } from './MeetingHeader';
import { VideoGrid } from './VideoGrid';
import { ScreenShareSpotlight } from './ScreenShareSpotlight';
import { MeetingControls } from './MeetingControls';
import { ChatDrawer } from './ChatDrawer';
import { ParticipantsDrawer } from './ParticipantsDrawer';
import { ReactionsOverlay } from './ReactionsOverlay';
import { WhiteboardModal } from './WhiteboardModal';
import { DeviceSettingsModal } from './DeviceSettingsModal';
import { InviteModal } from './InviteModal';

interface MeetingRoomProps {
  config: RoomConfig;
  onLeave: () => void;
}

export function MeetingRoom({ config, onLeave }: MeetingRoomProps) {
  // Local media stream hook
  const {
    stream: localStream,
    screenStream: localScreenStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    audioLevel,
    isSpeaking,
    devices,
    startMedia,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    stopScreenShare,
    switchAudioInput,
    switchVideoInput,
  } = useMediaStream({
    initialAudio: config.isAudioDefault,
    initialVideo: config.isVideoDefault,
  });

  // Start media immediately upon joining room
  useEffect(() => {
    startMedia();
  }, [startMedia]);

  // Meeting room orchestration hook
  const {
    localParticipant,
    allParticipants,
    messages,
    reactions,
    viewMode,
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
  } = useMeeting({
    roomId: config.roomId,
    userName: config.userName,
    localStream,
    localScreenStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    audioLevel,
    isSpeaking,
    onLeaveMeeting: onLeave,
  });

  const screenPresenter = allParticipants.find((p) => p.isScreenSharing);

  return (
    <div className="relative h-[100dvh] w-screen flex flex-col bg-[#090d16] text-slate-100 overflow-hidden select-none">
      {/* Top Meeting Header */}
      <MeetingHeader
        roomId={config.roomId}
        durationSeconds={meetingDurationSeconds}
        participantCount={allParticipants.length}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onOpenInvite={() => setIsInviteOpen(true)}
        onAddDemoParticipants={addDemoParticipants}
        isRecording={isRecording}
      />

      {/* Main Central Stage */}
      <main className="flex-1 relative flex overflow-hidden">
        {/* If someone is screen sharing, show presentation spotlight */}
        {screenPresenter ? (
          <ScreenShareSpotlight
            presenter={screenPresenter}
            participants={allParticipants}
            onStopScreenShare={screenPresenter.isLocal ? stopScreenShare : undefined}
          />
        ) : (
          <VideoGrid
            participants={allParticipants}
            pinnedId={pinnedParticipantId}
            onTogglePin={(id) => {
              setPinnedParticipantId((curr) => (curr === id ? null : id));
            }}
          />
        )}

        {/* Real-time In-Meeting Chat Drawer */}
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => toggleChat()}
          messages={messages}
          onSendMessage={sendMessage}
          currentUserId={localParticipant.id}
        />

        {/* Participants Drawer */}
        <ParticipantsDrawer
          isOpen={isParticipantsOpen}
          onClose={() => setIsParticipantsOpen(false)}
          participants={allParticipants}
          onOpenInvite={() => setIsInviteOpen(true)}
        />
      </main>

      {/* Floating Animated Reaction Overlays */}
      <ReactionsOverlay reactions={reactions} />

      {/* Bottom Floating Control Bar */}
      <MeetingControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        isHandRaised={isHandRaised}
        isRecording={isRecording}
        isChatOpen={isChatOpen}
        unreadChatCount={unreadChatCount}
        isParticipantsOpen={isParticipantsOpen}
        participantCount={allParticipants.length}
        isWhiteboardOpen={isWhiteboardOpen}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleHandRaise={toggleHandRaise}
        onToggleRecording={toggleRecording}
        onToggleChat={toggleChat}
        onToggleParticipants={() => setIsParticipantsOpen((prev) => !prev)}
        onToggleWhiteboard={() => setIsWhiteboardOpen((prev) => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSendReaction={sendReaction}
        onLeaveCall={onLeave}
      />

      {/* Interactive Whiteboard Modal */}
      <WhiteboardModal
        isOpen={isWhiteboardOpen}
        onClose={() => setIsWhiteboardOpen(false)}
        lines={whiteboardLines}
        onDrawLine={sendWhiteboardLine}
        onClear={clearWhiteboard}
      />

      {/* Audio / Video Device Settings Modal */}
      <DeviceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        devices={devices}
        onSwitchAudioInput={switchAudioInput}
        onSwitchVideoInput={switchVideoInput}
        audioLevel={audioLevel}
      />

      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        roomId={config.roomId}
      />
    </div>
  );
}
