import { io, Socket } from "socket.io-client";

// Create a singleton socket instance
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    socket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
};

// Connect to socket server
export const connectSocket = (): Socket => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
};

// Disconnect from socket server
export const disconnectSocket = (): void => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

// Join a game room
export const joinGame = (gameId: string): void => {
  const s = connectSocket();
  s.emit("join-game", gameId);
};

// Leave a game room
export const leaveGame = (gameId: string): void => {
  const s = getSocket();
  s.emit("leave-game", gameId);
};

// Start game (notify users)
export const startGame = (gameId: string): void => {
  const s = getSocket();
  s.emit("start-game", { gameId });
};

// Start auto-play
export const startAutoPlay = (gameId: string, callback?: (response: any) => void): void => {
  const s = getSocket();
  s.emit("start-auto-play", { gameId }, callback);
};

// Stop auto-play
export const stopAutoPlay = (gameId: string): void => {
  const s = getSocket();
  s.emit("stop-auto-play", { gameId });
};

// Pause game
export const pauseGame = (gameId: string): void => {
  const s = getSocket();
  s.emit("pause-game", { gameId });
};

// Resume game
export const resumeGame = (gameId: string): void => {
  const s = getSocket();
  s.emit("resume-game", { gameId });
};

// End game
export const endGame = (gameId: string): void => {
  const s = getSocket();
  s.emit("end-game", { gameId });
};

// Manual number call (basic)
export const callNumber = (gameId: string, number: number): void => {
  const s = getSocket();
  s.emit("call-number", { gameId, number });
};

// Admin manual number call with winner detection
export const adminCallNumber = (gameId: string, number: number): void => {
  const s = getSocket();
  s.emit("admin-call-number", { gameId, number });
};

// Export the socket instance for backward compatibility
export { socket };
