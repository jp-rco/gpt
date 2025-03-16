import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { DarkModeContext } from '../context/DarkModeContext';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Index() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useContext(DarkModeContext);

  const handleGoToChat = () => {
    router.push('/splashscreenchat');
  };

  const handleGoToWelcome = () => {
    router.push('/splashscreenwelcome');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#343541' }]}>
      {/* Botón de cambio de tema */}
      <TouchableOpacity style={styles.darkModeButton} onPress={toggleDarkMode}>
        {isDarkMode ? (
          <Ionicons name="sunny" size={24} color="#fff" />
        ) : (
          <Ionicons name="moon" size={24} color="#fff" />
        )}
      </TouchableOpacity>
      <Text style={styles.title}>Bienvenido!!!</Text>
      <Image source={require('../assets/images/logo.png')} style={styles.logo} />
      <TouchableOpacity style={styles.button} onPress={handleGoToChat}>
        <Text style={styles.buttonText}>Empieza a chatear</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleGoToWelcome}>
        <Text style={styles.buttonText}>Welcome</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkModeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    backgroundColor: '#2AB37E',
    borderRadius: 5,
    zIndex: 10,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2AB37E',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    margin: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 10,
  },
});
