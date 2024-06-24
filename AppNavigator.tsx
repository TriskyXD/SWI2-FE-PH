// navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './auth/Login';
import Register from './auth/Register';
import MainPage from './screen/MainPage';
import ChatScreen from './screen/ChatScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="MainPage" component={MainPage} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />

        
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
