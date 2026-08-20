import { ApiService } from './apiService';
import { SignalingChannel, SignalPayload } from './signalingService';

export type TrackCallback = (peerId: string, stream: MediaStream) => void;
export type PeerDisconnectCallback = (peerId: string) => void;

export class WebRtcMeshManager {
  private localStream: MediaStream | null = null;
  private localScreenStream: MediaStream | null = null;
  private localParticipantId: string;
  private roomId: string;
  private signaling: SignalingChannel;
  private peerConnections = new Map<string, RTCPeerConnection>();
  private remoteStreams = new Map<string, MediaStream>();
  private onTrackCallback?: TrackCallback;
  private onPeerDisconnectCallback?: PeerDisconnectCallback;
  private iceServers: RTCIceServer[] = [];

  constructor(
    localParticipantId: string,
    roomId: string,
    signaling: SignalingChannel,
    onTrack?: TrackCallback,
    onPeerDisconnect?: PeerDisconnectCallback
  ) {
    this.localParticipantId = localParticipantId;
    this.roomId = roomId;
    this.signaling = signaling;
    this.onTrackCallback = onTrack;
    this.onPeerDisconnectCallback = onPeerDisconnect;

    this.initIceServers();
  }

  private async initIceServers() {
    this.iceServers = await ApiService.getIceServers();
  }

  setLocalStreams(stream: MediaStream | null, screenStream: MediaStream | null) {
    this.localStream = stream;
    this.localScreenStream = screenStream;

    // Update tracks in all active peer connections and renegotiate if needed
    this.peerConnections.forEach((pc, peerId) => {
      this.syncTracksWithPeer(pc);
      if (pc.signalingState === 'stable') {
        this.callPeer(peerId);
      }
    });
  }

  private getOrCreatePeerConnection(peerId: string): RTCPeerConnection {
    if (this.peerConnections.has(peerId)) {
      return this.peerConnections.get(peerId)!;
    }

    const pc = new RTCPeerConnection({
      iceServers: this.iceServers.length > 0 ? this.iceServers : [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    });

    // Handle negotiation needed when tracks are dynamically added
    pc.onnegotiationneeded = () => {
      if (pc.signalingState === 'stable') {
        this.callPeer(peerId);
      }
    };

    // Handle ICE candidates generated locally
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.broadcast({
          type: 'ice-candidate',
          senderId: this.localParticipantId,
          targetId: peerId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Handle remote media track arrival
    pc.ontrack = (event) => {
      let remoteStream = event.streams[0];
      if (!remoteStream) {
        remoteStream = new MediaStream();
        remoteStream.addTrack(event.track);
      } else if (!remoteStream.getTracks().includes(event.track)) {
        remoteStream.addTrack(event.track);
      }

      this.remoteStreams.set(peerId, remoteStream);
      if (this.onTrackCallback) {
        this.onTrackCallback(peerId, remoteStream);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(peerId);
      }
    };

    // Add local tracks to peer connection
    this.syncTracksWithPeer(pc);

    this.peerConnections.set(peerId, pc);
    return pc;
  }

  private syncTracksWithPeer(pc: RTCPeerConnection) {
    const senders = pc.getSenders();
    const tracksToSync: { track: MediaStreamTrack; stream: MediaStream }[] = [];

    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((track) => {
        tracksToSync.push({ track, stream: this.localScreenStream! });
      });
      if (this.localStream) {
        this.localStream.getAudioTracks().forEach((track) => {
          tracksToSync.push({ track, stream: this.localStream! });
        });
      }
    } else if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        tracksToSync.push({ track, stream: this.localStream! });
      });
    }

    tracksToSync.forEach(({ track, stream }) => {
      const sender = senders.find((s) => s.track?.kind === track.kind);
      if (sender) {
        sender.replaceTrack(track).catch(() => {});
      } else {
        try {
          pc.addTrack(track, stream);
        } catch {
          // Track may already be added
        }
      }
    });
  }

  /**
   * Initiate WebRTC handshake with a newly joined peer
   */
  async callPeer(peerId: string) {
    if (peerId === this.localParticipantId) return;
    const pc = this.getOrCreatePeerConnection(peerId);

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      this.signaling.broadcast({
        type: 'offer',
        senderId: this.localParticipantId,
        targetId: peerId,
        sdp: offer,
      });
    } catch (err) {
      console.warn('Error creating WebRTC offer for peer:', peerId, err);
    }
  }

  private pendingCandidates = new Map<string, RTCIceCandidateInit[]>();

  private flushPendingCandidates(peerId: string, pc: RTCPeerConnection) {
    const candidates = this.pendingCandidates.get(peerId);
    if (candidates && candidates.length > 0) {
      candidates.forEach((candidate) => {
        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      });
      this.pendingCandidates.delete(peerId);
    }
  }

  /**
   * Process incoming WebRTC signaling messages from Spring Boot backend
   */
  async handleSignalingPayload(payload: SignalPayload) {
    if (payload.type === 'offer' && payload.targetId === this.localParticipantId) {
      const pc = this.getOrCreatePeerConnection(payload.senderId);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        this.flushPendingCandidates(payload.senderId, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.signaling.broadcast({
          type: 'answer',
          senderId: this.localParticipantId,
          targetId: payload.senderId,
          sdp: answer,
        });
      } catch (err) {
        console.warn('Error answering offer:', err);
      }
    } else if (payload.type === 'answer' && payload.targetId === this.localParticipantId) {
      const pc = this.peerConnections.get(payload.senderId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          this.flushPendingCandidates(payload.senderId, pc);
        } catch (err) {
          console.warn('Error setting remote answer:', err);
        }
      }
    } else if (payload.type === 'ice-candidate' && payload.targetId === this.localParticipantId) {
      const pc = this.peerConnections.get(payload.senderId);
      if (pc && pc.remoteDescription) {
        pc.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(() => {});
      } else {
        if (!this.pendingCandidates.has(payload.senderId)) {
          this.pendingCandidates.set(payload.senderId, []);
        }
        this.pendingCandidates.get(payload.senderId)!.push(payload.candidate);
      }
    } else if (payload.type === 'leave') {
      this.closePeer(payload.participantId);
    }
  }

  closePeer(peerId: string) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
    this.remoteStreams.delete(peerId);
    if (this.onPeerDisconnectCallback) {
      this.onPeerDisconnectCallback(peerId);
    }
  }

  closeAll() {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.remoteStreams.clear();
  }
}
