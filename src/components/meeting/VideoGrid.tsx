'use client';

import React, { useMemo } from 'react';
import { Participant, MeetingViewMode } from '../../types/meeting';
import { VideoTile } from './VideoTile';

interface VideoGridProps {
  participants: Participant[];
  pinnedParticipantId: string | null;
  activeSpeakerId: string | null;
  viewMode: MeetingViewMode;
  onTogglePin: (id: string) => void;
}

export function VideoGrid({
  participants,
  pinnedParticipantId,
  viewMode,
  onTogglePin,
}: VideoGridProps) {
  // Check if someone is sharing screen
  const screenSharer = useMemo(
    () => participants.find((p) => p.isScreenSharing),
    [participants]
  );

  const pinnedParticipant = useMemo(() => {
    if (pinnedParticipantId) {
      return participants.find((p) => p.id === pinnedParticipantId) || null;
    }
    return screenSharer || null;
  }, [pinnedParticipantId, participants, screenSharer]);

  // Spotlight layout if pinned or screen sharing
  const isSpotlightMode = viewMode === 'spotlight' || Boolean(pinnedParticipant);

  // Dynamic grid column sizing based on participant count
  const gridClass = useMemo(() => {
    const count = participants.length;
    if (count <= 1) return 'grid-cols-1 max-w-5xl h-full';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-6xl h-full';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-6xl h-full';
    if (count <= 6) return 'grid-cols-2 lg:grid-cols-3 max-w-7xl h-full';
    if (count <= 9) return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-3 max-w-7xl h-full';
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl h-full';
  }, [participants.length]);

  if (isSpotlightMode && pinnedParticipant) {
    const sideParticipants = participants.filter((p) => p.id !== pinnedParticipant.id);

    return (
      <div className="w-full h-full flex flex-col lg:flex-row gap-2 sm:gap-4 p-2 sm:p-4 overflow-hidden">
        {/* Main Spotlight Large Video */}
        <div className="flex-1 min-h-[50vh] lg:min-h-0 h-full">
          <VideoTile
            participant={pinnedParticipant}
            isPinned={Boolean(pinnedParticipantId)}
            isSpotlight={true}
            onTogglePin={onTogglePin}
          />
        </div>

        {/* Side Thumbnails */}
        {sideParticipants.length > 0 && (
          <div className="flex lg:flex-col gap-2 sm:gap-3 overflow-x-auto lg:overflow-y-auto w-full lg:w-72 shrink-0 py-1 max-h-[30vh] lg:max-h-full">
            {sideParticipants.map((participant) => (
              <div
                key={participant.id}
                className="w-40 sm:w-48 lg:w-full h-28 sm:h-36 lg:h-44 shrink-0"
              >
                <VideoTile
                  participant={participant}
                  isPinned={false}
                  onTogglePin={onTogglePin}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div
        className={`w-full grid gap-2 sm:gap-4 items-center justify-center auto-rows-fr ${gridClass}`}
      >
        {participants.map((participant) => (
          <div key={participant.id} className="w-full h-full min-h-[160px] sm:min-h-[220px]">
            <VideoTile
              participant={participant}
              isPinned={participant.id === pinnedParticipantId}
              onTogglePin={onTogglePin}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
