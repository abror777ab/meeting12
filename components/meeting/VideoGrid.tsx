'use client';

import React from 'react';
import { Participant } from '@/types/meeting';
import { ParticipantTile } from './ParticipantTile';

interface VideoGridProps {
  participants: Participant[];
  pinnedId: string | null;
  onTogglePin: (id: string) => void;
}

export function VideoGrid({ participants, pinnedId, onTogglePin }: VideoGridProps) {
  const count = participants.length;

  // Compute responsive layout styles based on participants count
  const getGridClasses = () => {
    if (pinnedId) {
      return 'grid-cols-1';
    }
    if (count === 1) {
      return 'grid-cols-1 max-w-4xl mx-auto';
    }
    if (count === 2) {
      return 'grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto';
    }
    if (count <= 4) {
      return 'grid-cols-2 max-w-6xl mx-auto';
    }
    if (count <= 6) {
      return 'grid-cols-2 lg:grid-cols-3';
    }
    if (count <= 9) {
      return 'grid-cols-2 sm:grid-cols-3';
    }
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  // If a participant is pinned, show spotlight layout
  if (pinnedId) {
    const pinnedParticipant = participants.find((p) => p.id === pinnedId) || participants[0];
    const otherParticipants = participants.filter((p) => p.id !== pinnedParticipant.id);

    return (
      <div className="flex-1 p-2 sm:p-4 flex flex-col lg:flex-row gap-2 sm:gap-4 overflow-hidden h-full">
        {/* Spotlight Main Tile */}
        <div className="flex-1 h-full min-h-[220px] sm:min-h-[300px]">
          <ParticipantTile
            participant={pinnedParticipant}
            isPinned={true}
            onTogglePin={onTogglePin}
            className="w-full h-full aspect-video lg:aspect-auto"
          />
        </div>

        {/* Other participants side filmstrip */}
        {otherParticipants.length > 0 && (
          <div className="flex lg:flex-col gap-2 sm:gap-3 overflow-x-auto lg:overflow-y-auto lg:w-72 shrink-0 py-1">
            {otherParticipants.map((participant) => (
              <div key={participant.id} className="w-40 sm:w-60 lg:w-full aspect-video shrink-0">
                <ParticipantTile
                  participant={participant}
                  isPinned={false}
                  onTogglePin={onTogglePin}
                  className="w-full h-full"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 p-2 sm:p-4 sm:p-6 overflow-y-auto flex items-center justify-center">
      <div className={`grid gap-2 sm:gap-4 w-full h-full max-h-[85dvh] ${getGridClasses()}`}>
        {participants.map((participant) => (
          <div key={participant.id} className="relative w-full h-full min-h-[140px] sm:min-h-[200px] flex items-center justify-center">
            <ParticipantTile
              participant={participant}
              isPinned={false}
              onTogglePin={onTogglePin}
              className="w-full h-full aspect-video"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
