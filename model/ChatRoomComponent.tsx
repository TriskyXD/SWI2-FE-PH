// ChatRoomComponent.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { ChatRoom } from '../interface/ChatRoom';

interface ChatRoomProps {
  room: ChatRoom;
}

const ChatRoomComponent: React.FC<ChatRoomProps> = ({ room }) => {
  return (
    <View style={{ margin: 10, padding: 10, borderWidth: 1, borderColor: 'gray' }}>
      <Text style={{ fontWeight: 'bold' }}>{room.chatName}</Text>
    </View>
  );
};

export default ChatRoomComponent;
