import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../auth/Login';
import Register from '../auth/Register';
//import Register from '../auth/Register';
//import MainPage from '../pages/MainPage';
import { useContext } from 'react';
import { AuthContext, AuthProvider } from '../auth/AuthContext';

const Stack = createNativeStackNavigator();

const PrivateRoutes = () => {
  const { authenticated } = useContext(AuthContext);
  if (!authenticated) {
    // Handle unauthenticated state, you can redirect or show a login screen
    // For now, just navigate to the login screen
    return <Stack.Screen name="Login" component={Login} />;
  }

 // return <Stack.Screen name="MainPage" component={MainPage} />;
};

const Routes = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="PrivateRoutes">
        {/* Initial fallback route */}
        <Stack.Screen name="PrivateRoutes" component={PrivateRoutes} options={{ headerShown: false }} />

        {/* Other routes */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Routes;
