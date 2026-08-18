export const AVATAR_COLORS = [
  'from-blue-600 to-indigo-700',
  'from-emerald-500 to-teal-700',
  'from-purple-600 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-700',
  'from-cyan-500 to-blue-600',
  'from-violet-600 to-purple-800',
  'from-fuchsia-500 to-pink-700',
];

export const REACTION_EMOJIS = ['👍', '❤️', '👏', '🎉', '😂', '🔥', '🚀', '✋'];

export const DEFAULT_ROOM_ID = 'dev-team-daily';

export const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

export const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30, max: 60 },
};
