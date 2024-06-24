// Login.tsx

import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthContext } from './AuthContext';
import { useNavigation, NavigationProp, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BACKEND_URL} from "../constants";

type RootStackParamList = {
  MainPage: undefined;
  Register: undefined;
  Login: undefined;
};

type LoginScreenNavigationProp = NavigationProp<RootStackParamList, 'Login'>;
type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Login'>;

const Login = () => {
  const { setAuthenticated } = useContext(AuthContext);
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);

        // Save tokens to AsyncStorage (Expo's version of local storage)
        await AsyncStorage.setItem('access_token', data.access_token);
        await AsyncStorage.setItem('refresh_token', data.refresh_token);

        setAuthenticated(true);
        console.log('Authenticated: ' + email);
        
        // Navigate to the main screen after successful login
        navigation.navigate('MainPage');
      } else {
        console.log('Error: ' + response.status);
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const goToRegistration = () => {
    // Navigate to the registration screen
    navigation.navigate('Register');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={(text) => setEmail(text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={(text) => setPassword(text)}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={goToRegistration}>
        <Text style={styles.registerLink}>Don't have an account? Register here</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#ecf0f1',
  },
  input: {
    height: 40,
    width: '80%',
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingLeft: 10,
    backgroundColor: '#ecf0f1',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: '#ecf0f1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerLink: {
    color: '#3498db',
    marginTop: 10,
  },
});

export default Login;
