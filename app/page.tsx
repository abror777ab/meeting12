'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MeetingProvider, useMeeting } from '../src/context/MeetingContext';
import { LobbyView } from '../src/components/lobby/LobbyView';
import { MeetingRoom } from '../src/components/meeting/MeetingRoom';

function MeetingAppContent() {
  const { isJoined } = useMeeting();
  const searchParams = useSearchParams();
  const initialRoom = searchParams.get('room') || undefined;

  if (isJoined) {
    return <MeetingRoom />;
  }

  return <LobbyView initialRoomId={initialRoom} />;
}

export default function HomePage() {
  return (
    <MeetingProvider>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#090b10] flex items-center justify-center text-white">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <MeetingAppContent />
      </Suspense>
    </MeetingProvider>
  );
}
