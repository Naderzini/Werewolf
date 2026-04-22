/**
 * Voice Chat Service using WebRTC
 * 
 * Free solution for voice chat between players.
 * Uses WebRTC peer-to-peer connections for audio streaming.
 * 
 * In production, you'll need a STUN/TURN server:
 * - Free STUN: stun:stun.l.google.com:19302
 * - Free TURN: https://www.metered.ca/tools/openrelay/ (free tier)
 * 
 * For React Native, use: react-native-webrtc
 * This file provides the service layer that works with Socket.IO signaling.
 */

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

class VoiceService {
  constructor() {
    this.peers = new Map();       // peerId -> RTCPeerConnection
    this.localStream = null;
    this.isMuted = false;
    this.onSpeakingChange = null; // callback(peerId, isSpeaking)
    this.onRemoteStream = null;   // callback(peerId, stream)
  }

  /**
   * Initialize local audio stream
   * In React Native, use react-native-webrtc's mediaDevices
   */
  async initLocalStream() {
    try {
      // For React Native, replace with:
      // import { mediaDevices } from 'react-native-webrtc';
      // this.localStream = await mediaDevices.getUserMedia({ audio: true, video: false });
      
      // Web fallback for testing:
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }
      return this.localStream;
    } catch (error) {
      console.error('Failed to get audio stream:', error);
      return null;
    }
  }

  /**
   * Create a peer connection for a specific player
   */
  createPeerConnection(peerId, socketService) {
    // In React Native: import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate } from 'react-native-webrtc';
    if (typeof RTCPeerConnection === 'undefined') {
      console.warn('RTCPeerConnection not available - voice chat requires react-native-webrtc');
      return null;
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.sendIceCandidate(peerId, event.candidate);
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      if (this.onRemoteStream) {
        this.onRemoteStream(peerId, event.streams[0]);
      }
    };

    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      console.log(`Peer ${peerId} connection state: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.removePeer(peerId);
      }
    };

    this.peers.set(peerId, pc);
    return pc;
  }

  /**
   * Create and send an offer to a peer
   */
  async createOffer(peerId, socketService, roomCode) {
    const pc = this.createPeerConnection(peerId, socketService);
    if (!pc) return;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketService.sendVoiceOffer(roomCode, peerId, offer);
    } catch (error) {
      console.error('Failed to create offer:', error);
    }
  }

  /**
   * Handle an incoming offer
   */
  async handleOffer(peerId, offer, socketService) {
    const pc = this.createPeerConnection(peerId, socketService);
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketService.sendVoiceAnswer(peerId, answer);
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
  }

  /**
   * Handle an incoming answer
   */
  async handleAnswer(peerId, answer) {
    const pc = this.peers.get(peerId);
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Failed to handle answer:', error);
    }
  }

  /**
   * Handle an incoming ICE candidate
   */
  async handleIceCandidate(peerId, candidate) {
    const pc = this.peers.get(peerId);
    if (!pc) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !this.isMuted;
      });
    }
    return this.isMuted;
  }

  /**
   * Remove a peer connection
   */
  removePeer(peerId) {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
    }
  }

  /**
   * Clean up all connections
   */
  cleanup() {
    this.peers.forEach((pc, peerId) => {
      pc.close();
    });
    this.peers.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }
}

export default new VoiceService();
