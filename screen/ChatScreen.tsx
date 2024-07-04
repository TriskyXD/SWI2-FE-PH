import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { NavigationProp, RouteProp, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DisplayedMessage } from '../interface/DisplayedMessage';
import { BACKEND_URL } from '../constants';
import { ChatMessage } from '../interface/ChatMessage';
import { ChatObject } from '../interface/ChatObject';

type MainPageScreenNavigationProp = NavigationProp<RootStackParamList, 'MainPage'>;
type MainPageScreenRouteProp = RouteProp<RootStackParamList, 'MainPage'>;

interface ChatScreenProps {
  route: MainPageScreenRouteProp;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const { selectedChat } = route.params;
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<DisplayedMessage[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const navigation = useNavigation<MainPageScreenNavigationProp>();
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const run = async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (token === null) return;

      await connectWebSocket(token);

      navigation.setOptions({
        title: selectedChat.chat.chatName,
        headerRight: () => (
            <TouchableOpacity onPress={handleAddUsers} style={{ marginRight: 16 }}>
              <Text style={{ color: 'white', fontSize: 16 }}>Add Users</Text>
            </TouchableOpacity>
        ),
      });
    };

    run();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [selectedChat]);

  const connectWebSocket = async (token: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    if (ws.current) {
      // Clean up previous WebSocket connection
      ws.current.close();
    }

    ws.current = new WebSocket(`${BACKEND_URL.replace(/^http/, 'ws')}/ws-message-ph?token=${token}`);

    ws.current.onopen = () => {
      console.log('Connected to WebSocket');
      setWebSocket(ws.current);
    };

    ws.current.onmessage = (event) => {
      console.log('Received raw message:', event.data);
      try {
        const receivedMessage: DisplayedMessage = JSON.parse(event.data);
        console.log('Received message:', receivedMessage);
        addReceivedMessage(receivedMessage); // Add received message to state
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.current.onclose = () => {
      console.log('Disconnected from WebSocket');
      setWebSocket(null);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };




  const addReceivedMessage = (message: DisplayedMessage) => {
    // Check if the message was not sent by the current user
    if (message.sender.id !== selectedChat.chat.owner.id) {
      setMessages(prevMessages => [...prevMessages, message]);
    }
  };

  async function closeConsumers() {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) return;

    const response = await fetch(`${BACKEND_URL}/api/chat/close-consumers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      console.log("Consumers closed.");
    } else {
      console.error('Failed to fetch user:', response.statusText);
    }
  }

  const handleAddUsers = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleAddUserToChat = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`${BACKEND_URL}/api/chat/add?chatId=${selectedChat?.chat.id}&email=${newUserEmail}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('Added user:', newUserEmail);
      } else {
        console.error('Cannot add user:', newUserEmail);
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }

    setNewUserEmail('');
    handleCloseModal();
  };

  const handleSend = async () => {
    if (message.trim() !== '') {
      const chatMessage: ChatMessage = {
        type: 'Text',
        chatId: selectedChat!.chat.id,
        content: message,
        senderId: selectedChat!.chat.owner.id,
      };

      try {
        const token = await AsyncStorage.getItem('access_token');

        const response = await fetch(`${BACKEND_URL}/api/chat/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(chatMessage),
        });

        if (response.ok) {
          console.log('Message was sent successfully');

          // Show notification after successful message send
          alert('Message sent successfully');

          // Update messages state
          setMessages(prevMessages => [...prevMessages, {
            content: chatMessage.content,
            sender: {
              firstName: selectedChat!.chat.owner.firstName,
            },
          }]);

        } else {
          console.error('Message sending failed:', response.statusText);
          alert('Failed to send message');
        }

        // Send the message through WebSocket
        if (webSocket) {
          webSocket.send(JSON.stringify(chatMessage));
          console.log("Message sent via WebSocket:", JSON.stringify(chatMessage));
        } else {
          console.error('WebSocket connection not established.');
        }
      } catch (error) {
        console.error('Message sending error:', error);
        alert('Message sending error');
      }

      setMessage('');
    }
  };


  return (
      <View style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 10, marginTop: 50 }}>
          {messages.map((msg, index) => (
              <View key={index} style={{ marginBottom: 10, backgroundColor: '#e1e1e1', padding: 10, borderRadius: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>{msg.sender.firstName}:</Text>
                <Text style={{ fontSize: 16, color: '#555' }}>{msg.content}</Text>
              </View>
          ))}
        </ScrollView>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 }}>
          <TextInput
              style={{ flex: 1, height: 50, borderColor: 'gray', borderWidth: 1, marginRight: 10, padding: 10 }}
              placeholder="Type a message..."
              value={message}
              onChangeText={(text) => setMessage(text)}
          />
          <Button title="Send" onPress={handleSend} />
        </View>
        <TouchableOpacity onPress={handleAddUsers} style={{ position: 'absolute', top: 10, right: 10, padding: 10, backgroundColor: 'blue', borderRadius: 5 }}>
          <Text style={{ color: 'white', fontSize: 16 }}>Add Users</Text>
        </TouchableOpacity>

        {/* Add User Modal */}
        <Modal visible={isModalVisible} onRequestClose={handleCloseModal}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, marginBottom: 20 }}>Add User</Text>
            <TextInput
                style={{ height: 40, width: 200, borderColor: 'gray', borderWidth: 1, marginBottom: 20, padding: 5 }}
                placeholder="Enter user email"
                onChangeText={(text) => setNewUserEmail(text)}
                value={newUserEmail}
            />
            <Button title="Add User" onPress={handleAddUserToChat} />
          </View>
        </Modal>
      </View>
  );
};

export default ChatScreen;