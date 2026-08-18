import { MeetingSocketService } from './meeting-socket.service';

export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export type RemoteStreamCallback = (userId: string, stream: MediaStream) => void;
export type RemoteStreamRemoveCallback = (userId: string) => void;

export interface WebRTCSignalPayload {
  type: 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export class WebRTCManager {
  private peers: Map<string, RTCPeerConnection> = new Map();
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

    // Mavjud barcha peer larga local stream tracklarini yangilash
    this.peers.forEach((peer) => {
      const senders = peer.getSenders();
      if (stream) {
        stream.getTracks().forEach((track) => {
          const sender = senders.find((s) => s.track?.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track).catch(console.warn);
          } else {
            peer.addTrack(track, stream);
          }
        });
      }
    });
  }

  /**
   * Yangi qatnashuvchi bilan WebRTC aloqa o'rnatish (Offer yaratuvchi tomon)
   */
  public async createPeerConnection(targetUserId: string, isInitiator: boolean): Promise<RTCPeerConnection> {
    if (this.peers.has(targetUserId)) {
      return this.peers.get(targetUserId)!;
    }

    const peer = new RTCPeerConnection(ICE_SERVERS);
    this.peers.set(targetUserId, peer);

    // Local stream tracklarini peer ga qo'shish
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        peer.addTrack(track, this.localStream!);
      });
    }

    // ICE Candidate topilganda server orqali target user ga yuborish
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.socketService.sendSignal(targetUserId, {
          type: 'ICE_CANDIDATE',
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Masofaviy (remote) video/audio oqim kelganda
    peer.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.onRemoteStreamAdded(targetUserId, event.streams[0]);
      }
    };

    peer.oniceconnectionstatechange = () => {
      if (
        peer.iceConnectionState === 'disconnected' ||
        peer.iceConnectionState === 'failed' ||
        peer.iceConnectionState === 'closed'
      ) {
        this.onRemoteStreamRemoved(targetUserId);
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
   * Boshqa foydalanuvchidan kelgan WebRTC signalni (Offer, Answer, ICE) qayta ishlash
   */
  public async handleSignal(senderId: string, rawSignalData: unknown): Promise<void> {
    if (!rawSignalData || typeof rawSignalData !== 'object') return;
    const signalData = rawSignalData as WebRTCSignalPayload;

    switch (signalData.type) {
      case 'OFFER': {
        if (signalData.sdp) {
          const peer = await this.createPeerConnection(senderId, false);
          await peer.setRemoteDescription(new RTCSessionDescription(signalData.sdp));

          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);

          this.socketService.sendSignal(senderId, {
            type: 'ANSWER',
            sdp: answer,
          });
        }
        break;
      }

      case 'ANSWER': {
        if (signalData.sdp) {
          const peer = this.peers.get(senderId);
          if (peer) {
            await peer.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
          }
        }
        break;
      }

      case 'ICE_CANDIDATE': {
        if (signalData.candidate) {
          const peer = this.peers.get(senderId);
          if (peer) {
            try {
              await peer.addIceCandidate(new RTCIceCandidate(signalData.candidate));
            } catch (e) {
              console.warn('ICE Candidate qo‘shishda ogohlantirish:', e);
            }
          }
        }
        break;
      }
    }
  }

  public removePeer(userId: string): void {
    const peer = this.peers.get(userId);
    if (peer) {
      peer.close();
      this.peers.delete(userId);
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
  }
}
