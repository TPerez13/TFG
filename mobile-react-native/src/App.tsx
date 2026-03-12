// Punto de entrada y navegacion principal de la app.
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './navigation/RootNavigator';
import { AuthProvider } from './navigation/AuthContext';
import { NotificationRuntime } from './features/notifications/NotificationRuntime';

export default function App() {
  return (
    <AuthProvider>
      <NotificationRuntime />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
