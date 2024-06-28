import React, { useState, useEffect, useRef } from 'react';
import {View, Text, TextInput, Button, ScrollView, TouchableOpacity, Modal, StyleSheet} from 'react-native';
import {NavigationProp, RouteProp, useNavigation} from '@react-navigation/native';
import {Client, CompatClient, Stomp} from '@stomp/stompjs';
import { DisplayedMessage } from '../interface/DisplayedMessage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BACKEND_URL} from "../constants";
import {ChatMessage} from "../interface/ChatMessage";
import {ChatObject} from "../interface/ChatObject";
import SockJS from "sockjs-client";

type MainPageScreenNavigationProp = NavigationProp<RootStackParamList, 'MainPage'>;
type MainPageScreenRouteProp = RouteProp<RootStackParamList, 'MainPage'>;

const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const { selectedChat } = route.params;
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<DisplayedMessage[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const navigation = useNavigation();
  const [stompClient, setStompClient] = useState<CompatClient | null>(null);


  useEffect(() => {
    const run = async () => {
      const token = await AsyncStorage.getItem('access_token');
      if(token === null) return;

      await connectWebSocket(token);

      navigation.setOptions({
        title: selectedChat.chat.chatName,
        headerRight: () => (
            <TouchableOpacity onPress={handleAddUsers} style={{ marginRight: 16 }}>
              <Text style={{ color: 'white', fontSize: 16 }}>Add Users</Text>
            </TouchableOpacity>
        ),
      });
    }

    run()



    return () => {
      if (stompClient && stompClient.connected) {
        stompClient.deactivate();
      }
    };
  }, [selectedChat]);




  const connectWebSocket = async (token: string) => {
    const client = await Stomp.over(() => new SockJS(BACKEND_URL + '/ws-message', {
      Authorization: `Bearer ${token}`,
    }));
    await client.configure({
      reconnectDelay: 10000,
    });

    client.onWebSocketError = (() => {
      console.error('WS err')
    })

    client.onStompError = (() => {
      console.error('STOMP err')
    })

    client.onConnect = (async () => {
      setStompClient(client);

      console.log('connected')

      await client.subscribe(`/chat/queue/${selectedChat.queue}`, (message) => {
        const receivedMessage: DisplayedMessage = JSON.parse(message.body);
        setMessages((prevMessages) => [...prevMessages, receivedMessage]);
        console.log("cc");
      })
    })

    client.onWebSocketClose = (() => {
      closeConsumers();
      setStompClient(null);
      console.log('Disconnected from WebSocket');
    });

    await client.activate()
  };

  async function closeConsumers() {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) return;

    const response = await fetch(   BACKEND_URL + '/api/chat/close-consumers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (response.ok) {
      console.log("Consumers closed.")
    } else {
      console.error('Failed to fetch user:', response.statusText);
    }

  }

  console.log(messages);



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
    if (message.trim() !== '') {

      const chatMessage: ChatMessage = {
        type: 'Text',
        chatId: selectedChat!.chat.id,
        content: message,
        senderId: selectedChat!.chat.owner.id
      };

      try {
        const token = await AsyncStorage.getItem('access_token');

        const response = await fetch(`${BACKEND_URL}/api/chat/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(chatMessage),
        });

        if (response.ok) {
          console.log('Message was sent successfully');
        } else {
          console.error('Message sending failed:', response.statusText);
        }
      } catch (error) {
        console.error('Message sending error:', error);
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
