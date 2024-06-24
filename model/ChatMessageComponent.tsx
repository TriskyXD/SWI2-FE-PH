import React from 'react';
import { View, Text } from 'react-native';
import { ChatMessage } from '../interface/ChatMessage';



const ChatMessageComponent: React.FC<{ message: ChatMessage }> = ({ message }) => {
  return (
    <View>
      <Text>Type: {message.type}</Text>
      <Text>Chat ID: {message.chatId}</Text>
      <Text>Content: {message.content}</Text>
      <Text>Sender ID: {message.senderId}</Text>
    </View>
  );
};

export default ChatMessageComponent;

