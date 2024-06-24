import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, ScrollView, TouchableOpacity, Modal } from 'react-native';
import {NavigationProp, RouteProp, useNavigation} from '@react-navigation/native';
import { Client } from '@stomp/stompjs';
import { DisplayedMessage } from '../interface/DisplayedMessage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BACKEND_URL} from "../constants";

type MainPageScreenNavigationProp = NavigationProp<RootStackParamList, 'MainPage'>;
type MainPageScreenRouteProp = RouteProp<RootStackParamList, 'MainPage'>;

const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const { selectedChat } = route.params;
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<DisplayedMessage[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const navigation = useNavigation();
  const stompClient = useRef<Client | null>(null);

  const webSocketConfig = {
    webSocketUrl: BACKEND_URL + '/ws-message',
    stompHeaders: {},
    topics: [`/topic/chat/${selectedChat.chat.chatId}`],
  };

  useEffect(() => {
    const initializeStompClient = () => {
      stompClient.current = new Client({
        webSocketFactory: () => new WebSocket(webSocketConfig.webSocketUrl),
        connectHeaders: {},
        debug: function (str) {
          console.log(str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      

      stompClient.current.onConnect = () => {
        console.log('StompJS connected');
        stompClient.current?.subscribe(`/topic/chat/${selectedChat.chat.chatId}`, onMessageReceived);
      };

      stompClient.current.onWebSocketClose = () => {
        console.log('StompJS closed');
      };

      stompClient.current.activate();
    };

    if (selectedChat && stompClient.current === null) {
      initializeStompClient();
    } else if (stompClient.current && !stompClient.current.connected) {
      initializeStompClient();
    }

    navigation.setOptions({
      title: selectedChat.chat.chatName,
      headerRight: () => (
        <TouchableOpacity onPress={handleAddUsers} style={{ marginRight: 16 }}>
          <Text style={{ color: 'white', fontSize: 16 }}>Add Users</Text>
        </TouchableOpacity>
      ),
    });

    return () => {
      if (stompClient.current && stompClient.current.connected) {
        stompClient.current.deactivate();
      }
    };
  }, [selectedChat]);

  

  const onMessageReceived = (message) => {
    const receivedMessage: DisplayedMessage = JSON.parse(message.body);
    setMessages((prevMessages) => [...prevMessages, receivedMessage]);
  };

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
        const msg = 'Added user: ' + newUserEmail;
        console.log(msg);
      } else {
        const msg = 'Cannot add user: ' + newUserEmail;
        console.error('Message sending failed:', response.statusText);
      }
    } catch (error) {
      console.error('Message sending error:', error);
    }

    setNewUserEmail('');
    handleCloseModal();
  };

  const handleSend = async () => {
    if (message.trim() !== '' && selectedChat && selectedChat.chat) {
      const newMessage: DisplayedMessage = {
        sender: selectedChat.chat.owner,
        content: message,
        type: 'Text',
      };

      setMessages((prevMessages) => [...prevMessages, newMessage]);

      try {
        if (stompClient.current && stompClient.current.connected) {
          stompClient.current.send(`/app/chat/${selectedChat.chat.chatId}`, {}, JSON.stringify(newMessage));
        } else {

          const token = await AsyncStorage.getItem('access_token');

          if (token) {
            const response = await fetch(`${BACKEND_URL}/api/chat/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                type: 'Text',
                chatId: selectedChat.chat.id,
                content: message,
                senderId: selectedChat.chat.owner.id,
              }),
            });

            console.log('HTTP Response:', response);

            if (response.ok) {
              console.log('Message sent successfully through HTTP');
            } else {
              console.error('Message sending failed through HTTP:', response.statusText);
            }
          } else {
            console.error('Access token not found.');
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }

      setMessage('');
    }
  };

  return (
          <View style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, maxHeight: 3000, padding: 10, marginTop: 50 }}>
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
          <Button  title="Add User" onPress={handleAddUserToChat} />
        </View>
      </Modal>
    </View>
  );
};

export default ChatScreen;
