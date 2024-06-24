// Register.tsx

import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthContext } from './AuthContext';
import { useNavigation, NavigationProp, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BACKEND_URL} from "../constants";

type RootStackParamList = {
  MainPage: undefined;
  Login: undefined;
  Register: undefined
};

type RegisterScreenNavigationProp = NavigationProp<RootStackParamList, 'Register'>;
type RegisterScreenRouteProp = RouteProp<RootStackParamList, 'Register'>;

const Register: React.FC = () => {
  const { setAuthenticated } = useContext(AuthContext);
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);

        await AsyncStorage.setItem('access_token', data.access_token);
        await AsyncStorage.setItem('refresh_token', data.refresh_token);

        setAuthenticated(true);

        navigation.navigate('MainPage');
      } else {
        console.log(response);
      }
    } catch (error) {
      console.error('Error during registration:', error);
    }
  };

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput
        style={styles.input}
        placeholder="First name"
        value={firstName}
        onChangeText={(text) => setFirstName(text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Last name"
        value={lastName}
        onChangeText={(text) => setLastName(text)}
      />
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
      <TouchableOpacity style={styles.button} onPress={async () => await handleRegister()}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      <Text style={styles.loginText}>
        Already have an account?{' '}
        <Text style={styles.loginLink} onPress={goToLogin}>
          Login
        </Text>
      </Text>
      <TouchableOpacity style={styles.loginButton} onPress={goToLogin}>
        <Text style={styles.loginButtonText}>Go to Login</Text>
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
    marginTop: 10,
  },
  buttonText: {
    color: '#ecf0f1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginText: {
    color: '#ecf0f1',
    marginTop: 20,
  },
  loginLink: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: '#2ecc71',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  loginButtonText: {
    color: '#ecf0f1',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Register;
