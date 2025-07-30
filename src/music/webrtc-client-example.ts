// // 클라이언트 측 WebRTC 구현 예시 (TypeScript)
// // 이 파일은 참고용이며, 실제로는 프론트엔드에서 구현됩니다.

// import { io, Socket } from 'socket.io-client';

// interface MusicData {
//   type: 'add' | 'remove' | 'update';
//   musicId?: string;
//   title?: string;
//   studentName?: string;
//   timestamp?: Date;
// }

// interface PeerConnection {
//   peerConnection: RTCPeerConnection;
//   dataChannel: RTCDataChannel;
// }

// export class MusicWebRTCClient {
//   private socket: Socket;
//   private peerConnections = new Map<string, PeerConnection>();
//   private roomId: string;
//   private userId: string;
//   private musicList: MusicData[] = [];

//   constructor(signalingUrl: string, roomId: string, userId: string) {
//     this.socket = io(signalingUrl, {
//       namespace: '/webrtc',
//     });
//     this.roomId = roomId;
//     this.userId = userId;
//     this.setupSocketListeners();
//   }

//   private setupSocketListeners() {
//     // 방 참여
//     this.socket.emit('join-room', { roomId: this.roomId, userId: this.userId });

//     // 방 사용자 목록 수신
//     this.socket.on('room-users', (users: any[]) => {
//       console.log('Room users:', users);
//       this.connectToPeers(users);
//     });

//     // 새 사용자 참여
//     this.socket.on('user-joined', (user: any) => {
//       console.log('User joined:', user);
//       this.createPeerConnection(user.socketId);
//     });

//     // 사용자 퇴장
//     this.socket.on('user-left', (user: any) => {
//       console.log('User left:', user);
//       this.removePeerConnection(user.socketId);
//     });

//     // WebRTC 시그널링
//     this.socket.on('offer', async (data: any) => {
//       await this.handleOffer(data.from, data.offer);
//     });

//     this.socket.on('answer', async (data: any) => {
//       await this.handleAnswer(data.from, data.answer);
//     });

//     this.socket.on('ice-candidate', async (data: any) => {
//       await this.handleIceCandidate(data.from, data.candidate);
//     });

//     // 음악 업데이트 (시그널링 서버를 통한 브로드캐스트)
//     this.socket.on('music-updated', (musicData: MusicData) => {
//       this.handleMusicUpdate(musicData);
//     });
//   }

//   private async connectToPeers(users: any[]) {
//     for (const user of users) {
//       if (user.socketId !== this.socket.id) {
//         await this.createPeerConnection(user.socketId);
//       }
//     }
//   }

//   private async createPeerConnection(targetSocketId: string) {
//     try {
//       const peerConnection = new RTCPeerConnection({
//         iceServers: [
//           { urls: 'stun:stun.l.google.com:19302' },
//           { urls: 'stun:stun1.l.google.com:19302' },
//         ],
//       });

//       // 데이터 채널 생성
//       const dataChannel = peerConnection.createDataChannel('music-sync', {
//         ordered: true,
//       });

//       dataChannel.onopen = () => {
//         console.log(`Data channel opened with ${targetSocketId}`);
//         // 초기 음악 리스트 전송
//         this.sendMusicList(targetSocketId);
//       };

//       dataChannel.onmessage = (event) => {
//         this.handlePeerMessage(targetSocketId, JSON.parse(event.data));
//       };

//       // ICE candidate 처리
//       peerConnection.onicecandidate = (event) => {
//         if (event.candidate) {
//           this.socket.emit('ice-candidate', {
//             targetId: targetSocketId,
//             data: event.candidate,
//           });
//         }
//       };

//       this.peerConnections.set(targetSocketId, { peerConnection, dataChannel });

//       // Offer 생성 및 전송
//       const offer = await peerConnection.createOffer();
//       await peerConnection.setLocalDescription(offer);
      
//       this.socket.emit('offer', {
//         targetId: targetSocketId,
//         data: offer,
//       });

//     } catch (error) {
//       console.error('Failed to create peer connection:', error);
//     }
//   }

//   private async handleOffer(fromSocketId: string, offer: RTCSessionDescriptionInit) {
//     try {
//       const peerConnection = new RTCPeerConnection({
//         iceServers: [
//           { urls: 'stun:stun.l.google.com:19302' },
//           { urls: 'stun:stun1.l.google.com:19302' },
//         ],
//       });

//       // 데이터 채널 수신
//       peerConnection.ondatachannel = (event) => {
//         const dataChannel = event.channel;
//         dataChannel.onopen = () => {
//           console.log(`Data channel opened with ${fromSocketId}`);
//           this.sendMusicList(fromSocketId);
//         };
//         dataChannel.onmessage = (event) => {
//           this.handlePeerMessage(fromSocketId, JSON.parse(event.data));
//         };
//         this.peerConnections.set(fromSocketId, { peerConnection, dataChannel });
//       };

//       // ICE candidate 처리
//       peerConnection.onicecandidate = (event) => {
//         if (event.candidate) {
//           this.socket.emit('ice-candidate', {
//             targetId: fromSocketId,
//             data: event.candidate,
//           });
//         }
//       };

//       await peerConnection.setRemoteDescription(offer);
//       const answer = await peerConnection.createAnswer();
//       await peerConnection.setLocalDescription(answer);

//       this.socket.emit('answer', {
//         targetId: fromSocketId,
//         data: answer,
//       });

//     } catch (error) {
//       console.error('Failed to handle offer:', error);
//     }
//   }

//   private async handleAnswer(fromSocketId: string, answer: RTCSessionDescriptionInit) {
//     try {
//       const peerConnection = this.peerConnections.get(fromSocketId)?.peerConnection;
//       if (peerConnection) {
//         await peerConnection.setRemoteDescription(answer);
//       }
//     } catch (error) {
//       console.error('Failed to handle answer:', error);
//     }
//   }

//   private async handleIceCandidate(fromSocketId: string, candidate: RTCIceCandidateInit) {
//     try {
//       const peerConnection = this.peerConnections.get(fromSocketId)?.peerConnection;
//       if (peerConnection) {
//         await peerConnection.addIceCandidate(candidate);
//       }
//     } catch (error) {
//       console.error('Failed to handle ICE candidate:', error);
//     }
//   }

//   private removePeerConnection(socketId: string) {
//     const connection = this.peerConnections.get(socketId);
//     if (connection) {
//       connection.peerConnection.close();
//       this.peerConnections.delete(socketId);
//     }
//   }

//   private sendMusicList(targetSocketId: string) {
//     const connection = this.peerConnections.get(targetSocketId);
//     if (connection?.dataChannel.readyState === 'open') {
//       connection.dataChannel.send(JSON.stringify({
//         type: 'music-list',
//         data: this.musicList,
//       }));
//     }
//   }

//   private handlePeerMessage(fromSocketId: string, message: any) {
//     switch (message.type) {
//       case 'music-list':
//         this.musicList = message.data;
//         this.updateMusicList();
//         break;
//       case 'add-music':
//         this.addMusicToList(message.data);
//         break;
//       case 'remove-music':
//         this.removeMusicFromList(message.data.musicId);
//         break;
//       default:
//         console.log('Unknown message type:', message.type);
//     }
//   }

//   private handleMusicUpdate(musicData: MusicData) {
//     switch (musicData.type) {
//       case 'add':
//         this.addMusicToList(musicData);
//         break;
//       case 'remove':
//         this.removeMusicFromList(musicData.musicId!);
//         break;
//     }
//   }

//   private addMusicToList(musicData: MusicData) {
//     if (musicData.musicId) {
//       this.musicList.push(musicData);
//       this.updateMusicList();
//       this.broadcastToPeers({
//         type: 'add-music',
//         data: musicData,
//       });
//     }
//   }

//   private removeMusicFromList(musicId: string) {
//     this.musicList = this.musicList.filter(music => music.musicId !== musicId);
//     this.updateMusicList();
//     this.broadcastToPeers({
//       type: 'remove-music',
//       data: { musicId },
//     });
//   }

//   private broadcastToPeers(message: any) {
//     this.peerConnections.forEach((connection, socketId) => {
//       if (connection.dataChannel.readyState === 'open') {
//         connection.dataChannel.send(JSON.stringify(message));
//       }
//     });
//   }

//   private updateMusicList() {
//     // UI 업데이트 로직 (실제 구현에서는 React/Vue 상태 업데이트)
//     console.log('Updated music list:', this.musicList);
//   }

//   // 공개 메서드들
//   public addMusic(musicId: string, title: string, studentName: string) {
//     const musicData: MusicData = {
//       type: 'add',
//       musicId,
//       title,
//       studentName,
//       timestamp: new Date(),
//     };

//     this.addMusicToList(musicData);
    
//     // 서버에도 저장 (하이브리드 방식)
//     this.socket.emit('music-update', {
//       roomId: this.roomId,
//       musicData,
//     });
//   }

//   public removeMusic(musicId: string) {
//     this.removeMusicFromList(musicId);
    
//     // 서버에도 삭제 요청 (하이브리드 방식)
//     this.socket.emit('music-update', {
//       roomId: this.roomId,
//       musicData: { type: 'remove', musicId },
//     });
//   }

//   public disconnect() {
//     this.socket.emit('leave-room');
//     this.peerConnections.forEach((connection) => {
//       connection.peerConnection.close();
//     });
//     this.peerConnections.clear();
//     this.socket.disconnect();
//   }

//   public getMusicList(): MusicData[] {
//     return [...this.musicList];
//   }

//   public getConnectedPeers(): string[] {
//     return Array.from(this.peerConnections.keys());
//   }
// }

// // 사용 예시:
// /*
// const client = new MusicWebRTCClient(
//   'ws://localhost:8080',
//   'room-123',
//   'user-456'
// );

// // 음악 추가
// client.addMusic('youtube-id', '노래 제목', '학생 이름');

// // 음악 삭제
// client.removeMusic('youtube-id');

// // 연결 해제
// client.disconnect();
// */ 