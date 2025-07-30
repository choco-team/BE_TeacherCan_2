import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

interface RoomUser {
  socketId: string;
  userId: string;
  roomId: string;
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-room' | 'leave-room';
  roomId: string;
  targetId?: string;
  data?: any;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'https://teachercan.com'],
    credentials: true,
  },
  namespace: '/webrtc',
})
export class MusicWebRTCGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MusicWebRTCGateway.name);
  private rooms = new Map<string, Set<string>>(); // roomId -> Set<socketId>
  private userSockets = new Map<string, RoomUser>(); // socketId -> RoomUser

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.removeUserFromRoom(client.id);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string },
  ) {
    const { roomId, userId } = data;
    
    // 기존 방에서 제거
    this.removeUserFromRoom(client.id);
    
    // 새 방에 추가
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    this.rooms.get(roomId)!.add(client.id);
    this.userSockets.set(client.id, { socketId: client.id, userId, roomId });
    
    // 방에 참여
    client.join(roomId);
    
    // 방의 다른 사용자들에게 새 사용자 알림
    client.to(roomId).emit('user-joined', {
      socketId: client.id,
      userId,
    });
    
    // 현재 방의 모든 사용자 목록 전송
    const roomUsers = Array.from(this.rooms.get(roomId)!).map(socketId => {
      const user = this.userSockets.get(socketId);
      return { socketId, userId: user?.userId };
    });
    
    client.emit('room-users', roomUsers);
    
    this.logger.log(`User ${userId} joined room ${roomId}`);
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(@ConnectedSocket() client: Socket) {
    this.removeUserFromRoom(client.id);
    client.emit('left-room');
  }

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SignalingMessage,
  ) {
    const { roomId, targetId, data: offerData } = data;
    
    // 특정 사용자에게 offer 전송
    if (targetId) {
      this.server.to(targetId).emit('offer', {
        from: client.id,
        offer: offerData,
      });
    }
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SignalingMessage,
  ) {
    const { targetId, data: answerData } = data;
    
    // 특정 사용자에게 answer 전송
    if (targetId) {
      this.server.to(targetId).emit('answer', {
        from: client.id,
        answer: answerData,
      });
    }
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SignalingMessage,
  ) {
    const { targetId, data: candidateData } = data;
    
    // 특정 사용자에게 ICE candidate 전송
    if (targetId) {
      this.server.to(targetId).emit('ice-candidate', {
        from: client.id,
        candidate: candidateData,
      });
    }
  }

  @SubscribeMessage('music-update')
  handleMusicUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; musicData: any },
  ) {
    const { roomId, musicData } = data;
    
    // 방의 모든 사용자에게 음악 업데이트 브로드캐스트
    client.to(roomId).emit('music-updated', musicData);
  }

  private removeUserFromRoom(socketId: string) {
    const user = this.userSockets.get(socketId);
    if (user) {
      const { roomId } = user;
      const room = this.rooms.get(roomId);
      
      if (room) {
        room.delete(socketId);
        
        // 방이 비어있으면 방 삭제
        if (room.size === 0) {
          this.rooms.delete(roomId);
        } else {
          // 다른 사용자들에게 사용자 퇴장 알림
          this.server.to(roomId).emit('user-left', {
            socketId,
            userId: user.userId,
          });
        }
      }
      
      this.userSockets.delete(socketId);
      this.logger.log(`User ${user.userId} left room ${roomId}`);
    }
  }

  // 방 정보 조회 (디버깅용)
  getRoomInfo(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    return {
      roomId,
      userCount: room.size,
      users: Array.from(room).map(socketId => this.userSockets.get(socketId)),
    };
  }

  // 모든 방 정보 조회 (디버깅용)
  getAllRooms() {
    const rooms = [];
    for (const [roomId, userSet] of this.rooms.entries()) {
      rooms.push({
        roomId,
        userCount: userSet.size,
        users: Array.from(userSet).map(socketId => this.userSockets.get(socketId)),
      });
    }
    return rooms;
  }
} 