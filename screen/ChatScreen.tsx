import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert
} from 'react-native';
import { NavigationProp, RouteProp, useNavigation } from '@react-navigation/native';
import { CompatClient, Stomp } from '@stomp/stompjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SockJS from 'sockjs-client';
import { BACKEND_URL } from '../constants';
import { ChatMessage } from '../interface/ChatMessage';
import { ChatObject } from '../interface/ChatObject';
import { DisplayedMessage } from '../interface/DisplayedMessage';

type MainPageScreenNavigationProp = NavigationProp<RootStackParamList, 'ChatScreen'>;
type MainPageScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;

interface ChatScreenProps {
  route: MainPageScreenRouteProp;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const { selectedChat, localUser } = route.params;
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<DisplayedMessage[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const navigation = useNavigation<MainPageScreenNavigationProp>();
  const [stompClient, setStompClient] = useState<CompatClient | null>(null);
  useEffect(() => {
    const run = async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (token === null) return;
      await connectWebSocket(token);

      navigation.setOptions({
        title: selectedChat.chat.chatName,
        headerRight: () => (
            <TouchableOpacity onPress={handleAddUsers} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Add Users</Text>
            </TouchableOpacity>
        ),
      });
    };

    run();

    return () => {
      if (stompClient && stompClient.connected) {
        stompClient.deactivate();
      }
    };
  }, [selectedChat]);



  const connectWebSocket = async (token: string) => {
    const client = Stomp.over(() => new SockJS(BACKEND_URL + '/ws-message'));
    client.configure({
      reconnectDelay: 10000,
    });

    client.connect(
        { Authorization: `Bearer ${token}` },
        async () => {
          setStompClient(client);
          console.log('Connected to WebSocket');

          for (const queue of selectedChat.queues) {
            await client.subscribe(`/chat/queue/${queue}`, (message) => {
              const receivedMessage: DisplayedMessage = JSON.parse(message.body);
              setMessages((prevMessages) => [...prevMessages, receivedMessage]);
            });
          }
        },
        (error) => {
          console.error('STOMP Error: ', error);
        }
    );

    client.onWebSocketClose = () => {
      closeConsumers();
      setStompClient(null);
      console.log('Disconnected from WebSocket');
    };
  };

  const closeConsumers = async () => {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) return;

    const response = await fetch(BACKEND_URL + '/api/chat/close-consumers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (response.ok) {
      console.log('Consumers closed.');
    } else {
      console.error('Failed to close consumers:', response.statusText);
    }
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

      const response = await fetch(`${BACKEND_URL}/api/chat/add?chatId=${selectedChat.chat.id}&email=${newUserEmail}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        Alert.alert('Success', `Added user: ${newUserEmail}`);
      } else {
        Alert.alert('Error', `Cannot add user: ${newUserEmail}`);
      }
    } catch (error) {
      console.error('Error adding user:', error);
      Alert.alert('Error', 'An error occurred while adding the user.');
    }

    setNewUserEmail('');
    handleCloseModal();
  };

  const handleSend = async () => {
    if (message.trim() !== '') {
      const chatMessage: ChatMessage = {
        type: 'Text',
        chatId: selectedChat.chat.id,
        content: message,
        senderId: selectedChat.chat.owner.id,
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
          console.log('Message sent successfully');
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
      <View style={styles.container}>
        <ScrollView style={styles.messagesContainer}>
          {messages.map((msg, index) => (
              <View
                  key={index}
                  style={[
                    styles.messageBubble,
                    msg.senderId === localUser.id ? styles.localUserBubble : styles.otherUserBubble,
                    msg.senderId === localUser.id ? styles.localUserAlignment : styles.otherUserAlignment
                  ]}
              >
                <Text style={styles.messageText}>{msg.content}</Text>
              </View>
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              value={message}
              onChangeText={(text) => setMessage(text)}
          />
          <Button title="Send" onPress={handleSend} />
        </View>

        <TouchableOpacity onPress={handleAddUsers} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add Users</Text>
        </TouchableOpacity>

        <Modal visible={isModalVisible} onRequestClose={handleCloseModal} transparent={true}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add User</Text>
            <TextInput
                style={styles.modalInput}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
    marginTop: 50,
  },
  messageBubble: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
  },
  localUserBubble: {
    backgroundColor: '#d0f0c0',
  },
  otherUserBubble: {
    backgroundColor: '#e1e1e1',
  },
  localUserAlignment: {
    alignSelf: 'flex-end',
    borderRadius: 8,
    marginLeft: 50,
  },
  otherUserAlignment: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    marginRight: 50,
  },
  messageText: {
    fontSize: 16,
    color: '#555',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  textInput: {
    flex: 1,
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    marginRight: 10,
    padding: 10,
  },
  addButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
    backgroundColor: 'blue',
    borderRadius: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 20,
    color: 'white',
  },
  modalInput: {
    height: 40,
    width: 200,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    padding: 5,
    color: 'black',
    backgroundColor: 'white',
  },
});

export default ChatScreen;
