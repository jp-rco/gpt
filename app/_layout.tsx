import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      initialRouteName="index" // <-- Ajuste para abrir primero splashscreen
      screenOptions={{}}
    >
      <Stack.Screen name="splashscreenchat" options={{ headerShown: false }} />
      <Stack.Screen name="splashscreenwelcome" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ title: "Home", headerShown: false }} />
      <Stack.Screen name="welcome" options={{ title: "Bienvenido" }} />
      <Stack.Screen name="chat" options={{ title: "Chat" }} />
    </Stack>
  );
}
