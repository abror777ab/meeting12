import { MeetingSocketService } from './meeting-socket.service';

export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun.relay.metered.ca:80' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
};

export type RemoteStreamCallback = (userId: string, stream: MediaStream) => void;
export type RemoteStreamRemoveCallback = (userId: string) => void;

interface GenericSignalObject {
  type?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  payload?: {
    type?: string;
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
  };
}

export class WebRTCManager {
  private peers: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();
  private localStream: MediaStream | null = null;
  private socketService: MeetingSocketService;
  private onRemoteStreamAdded: RemoteStreamCallback;
  private onRemoteStreamRemoved: RemoteStreamRemoveCallback;

  constructor(
    localUserId: string,
    socketService: MeetingSocketService,
    onRemoteStreamAdded: RemoteStreamCallback,
    onRemoteStreamRemoved: RemoteStreamRemoveCallback
  ) {
    this.socketService = socketService;
    this.onRemoteStreamAdded = onRemoteStreamAdded;
    this.onRemoteStreamRemoved = onRemoteStreamRemoved;
  }

  public setLocalStream(stream: MediaStream | null): void {
    this.localStream = stream;

    this.peers.forEach((peer) => {
      if (!stream) return;
      const senders = peer.getSenders();
      stream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track?.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track).catch(console.warn);
        } else {
          try {
            peer.addTrack(track, stream);
          } catch (e) {
            console.warn('Track qo‘shishda ogohlantirish:', e);
          }
        }
      });
    });
  }

  /**
   * Yangi qatnashuvchi bilan WebRTC aloqa o'rnatish
   */
  public async createPeerConnection(targetUserId: string, isInitiator: boolean): Promise<RTCPeerConnection> {
    if (this.peers.has(targetUserId)) {
      return this.peers.get(targetUserId)!;
    }

    const peer = new RTCPeerConnection(ICE_SERVERS);
    this.peers.set(targetUserId, peer);
    this.pendingCandidates.set(targetUserId, []);

    // 1. Transceiverlarni oldindan yaratish (Kamera/mic bo'lmasa ham audio/video kanallari darhol ochiladi)
    try {
      peer.addTransceiver('audio', { direction: 'sendrecv' });
      peer.addTransceiver('video', { direction: 'sendrecv' });
    } catch (e) {
      console.warn('Transceiver yaratishda ogohlantirish:', e);
    }

    // 2. Local stream treklarini qo'shish
    if (this.localStream) {
      const senders = peer.getSenders();
      this.localStream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track?.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track).catch(console.warn);
        } else {
          try {
            peer.addTrack(track, this.localStream!);
          } catch (e) {
            console.warn('Local track qo‘shishda ogohlantirish:', e);
          }
        }
      });
    }

    // 3. ICE Candidate paydo bo'lganda server orqali yuborish
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.socketService.sendSignal(targetUserId, {
          type: 'ICE_CANDIDATE',
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // 4. Masofaviy (remote) video/audio trek kelganda
    peer.ontrack = (event) => {
      let stream = this.remoteStreams.get(targetUserId);
      if (!stream) {
        stream = new MediaStream();
        this.remoteStreams.set(targetUserId, stream);
      }

      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (!stream!.getTracks().some((t) => t.id === track.id)) {
            stream!.addTrack(track);
          }
        });
      } else if (event.track) {
        if (!stream.getTracks().some((t) => t.id === event.track.id)) {
          stream.addTrack(event.track);
        }
      }

      this.onRemoteStreamAdded(targetUserId, stream);
    };

    peer.oniceconnectionstatechange = () => {
      if (
        peer.iceConnectionState === 'disconnected' ||
        peer.iceConnectionState === 'failed' ||
        peer.iceConnectionState === 'closed'
      ) {
        console.warn(`Peer ${targetUserId} holati:`, peer.iceConnectionState);
      }
    };

    if (isInitiator) {
      try {
        const offer = await peer.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await peer.setLocalDescription(offer);

        this.socketService.sendSignal(targetUserId, {
          type: 'OFFER',
          sdp: offer,
        });
      } catch (err) {
        console.error('WebRTC Offer yaratishda xatolik:', err);
      }
    }

    return peer;
  }

  /**
   * Masofaviy WebRTC signallarni (Offer, Answer, ICE Candidate) qayta ishlash
   */
  public async handleSignal(senderId: string, rawSignalData: unknown): Promise<void> {
    if (!rawSignalData || typeof rawSignalData !== 'object') return;
    const signalData = rawSignalData as GenericSignalObject;

    const type = signalData.type || signalData.payload?.type;
    const sdp = signalData.sdp || signalData.payload?.sdp;
    const candidate = signalData.candidate || signalData.payload?.candidate;

    switch (type) {
      case 'OFFER': {
        if (sdp) {
          const peer = await this.createPeerConnection(senderId, false);
          await peer.setRemoteDescription(new RTCSessionDescription(sdp));

          // Navbatdagi ICE nomzodlarni qo'shish
          this.flushPendingCandidates(senderId, peer);

          const answer = await peer.createAnswer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await peer.setLocalDescription(answer);

          this.socketService.sendSignal(senderId, {
            type: 'ANSWER',
            sdp: answer,
          });
        }
        break;
      }

      case 'ANSWER': {
        if (sdp) {
          const peer = this.peers.get(senderId);
          if (peer && peer.signalingState !== 'stable') {
            await peer.setRemoteDescription(new RTCSessionDescription(sdp));
            this.flushPendingCandidates(senderId, peer);
          }
        }
        break;
      }

      case 'ICE_CANDIDATE': {
        if (candidate) {
          const peer = this.peers.get(senderId);
          if (peer && peer.remoteDescription && peer.remoteDescription.type) {
            try {
              await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.warn('ICE Candidate qo‘shishda ogohlantirish:', e);
            }
          } else {
            const queue = this.pendingCandidates.get(senderId) || [];
            queue.push(candidate);
            this.pendingCandidates.set(senderId, queue);
          }
        }
        break;
      }
    }
  }

  private flushPendingCandidates(senderId: string, peer: RTCPeerConnection): void {
    const queue = this.pendingCandidates.get(senderId) || [];
    while (queue.length > 0) {
      const candidate = queue.shift();
      if (candidate) {
        peer.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
      }
    }
  }

  public removePeer(userId: string): void {
    const peer = this.peers.get(userId);
    if (peer) {
      try {
        peer.close();
      } catch {}
      this.peers.delete(userId);
      this.pendingCandidates.delete(userId);
      this.remoteStreams.delete(userId);
      this.onRemoteStreamRemoved(userId);
    }
  }

  public destroy(): void {
    this.peers.forEach((peer) => {
      try {
        peer.close();
      } catch {}
    });
    this.peers.clear();
    this.pendingCandidates.clear();
    this.remoteStreams.clear();
  }
}
