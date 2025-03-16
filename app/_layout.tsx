import React from 'react';
import { Stack } from 'expo-router';
import { DarkModeProvider } from '../context/DarkModeContext'; // Ajusta la ruta según corresponda

export default function RootLayout() {
  return (
    <DarkModeProvider>
      <Stack
        initialRouteName="AuthScreen"
        screenOptions={{}}
      >
        <Stack.Screen name="splashscreenchat" options={{ headerShown: false }} />
        <Stack.Screen name="splashscreenwelcome" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ title: "Home", headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="AuthScreen" options={{ headerShown: false }} />
      </Stack>
    </DarkModeProvider>
  );
}
