// AuthContext.tsx
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  children?: ReactNode;
};

type IAuthContext = {
  authenticated: boolean;
  setAuthenticated: (newState: boolean) => void;
};

const getTokenFromAsyncStorage = async () => {
  try {
    const token = await AsyncStorage.getItem('access_token');

    if (token) {
      const parsedToken = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = parsedToken.exp * 1000;

      if (expirationTime > Date.now()) {
        const remainingTimeInSeconds = Math.floor((expirationTime - Date.now()) / 1000);

        console.log('Remaining time in seconds:', remainingTimeInSeconds);

        return token;
      } else {
        console.warn('Token has expired. Removing from AsyncStorage.');
        await AsyncStorage.removeItem('access_token');
      }
    }
  } catch (error) {
    console.error('Error parsing or checking token:', error);
    console.warn('Removing invalid token from AsyncStorage.');
    await AsyncStorage.removeItem('access_token');
  }

  return null;
};

const initialValue: IAuthContext = {
  authenticated: false,
  setAuthenticated: () => {},
};

const AuthContext = createContext<IAuthContext>(initialValue);

const AuthProvider = ({ children }: Props) => {
  const [authenticated, setAuthenticated] = useState(initialValue.authenticated);

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = await getTokenFromAsyncStorage();
      if (token) {
        setAuthenticated(true);
      }
    };

    checkAuthentication();
  }, []);

  const updateAuthentication = async (newState: boolean) => {
    setAuthenticated(newState);

    // Example: Save the authentication state in AsyncStorage
    if (newState) {
      // Save token in AsyncStorage upon successful authentication
      await AsyncStorage.setItem('access_token', 'your_access_token_here');
    } else {
      // Remove token from AsyncStorage upon logout or authentication failure
      await AsyncStorage.removeItem('access_token');


    }
  };

  return (
    <AuthContext.Provider value={{ authenticated, setAuthenticated: updateAuthentication }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
