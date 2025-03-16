import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { app } from '../utils/FirebaseConfig';
import { DarkModeContext } from '../context/DarkModeContext';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function AuthScreen() {
  const router = useRouter();
  const auth = getAuth(app);
  const { isDarkMode, toggleDarkMode } = useContext(DarkModeContext);

  const [user, setUser] = useState<User | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        router.replace('/chat');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleToggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
  };

  const handleLoginOrRegister = async () => {
    if (!email || !password) return;
    try {
      if (isRegisterMode) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Usuario registrado:', userCredential.user.uid);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Usuario logueado:', userCredential.user.uid);
      }
    } catch (error: any) {
      console.log('Error en Auth:', error.message);
    }
  };

  if (user) {
    return (
      <View style={[styles.loggedInContainer, { backgroundColor: isDarkMode ? '#000' : '#343541' }]}>
        <Text style={styles.loggedInText}>Hola {user.email}, redirigiendo al chat...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#343541' }]}>
      <TouchableOpacity style={styles.darkModeButton} onPress={toggleDarkMode}>
        <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.title}>
        {isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesión'}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.mainButton} onPress={handleLoginOrRegister}>
        <Text style={styles.mainButtonText}>
          {isRegisterMode ? 'Registrarme' : 'Entrar'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.toggleButton} onPress={handleToggleMode}>
        <Text style={styles.toggleButtonText}>
          {isRegisterMode ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  darkModeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    backgroundColor: '#2AB37E',
    borderRadius: 5,
    zIndex: 10
  },
  title: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 24,
    fontWeight: 'bold'
  },
  input: {
    width: '100%',
    backgroundColor: '#4A4B57',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginVertical: 8
  },
  mainButton: {
    backgroundColor: '#2AB37E',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
    width: '100%'
  },
  mainButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  toggleButton: {
    marginTop: 8
  },
  toggleButtonText: {
    color: '#2AB37E',
    textAlign: 'center'
  },
  loggedInContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  loggedInText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 24
  }
});
