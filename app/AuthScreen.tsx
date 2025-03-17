import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
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

  // NUEVO: state para el nombre
  const [name, setName] = useState('');

  // NUEVO: estados para email y password (se mantienen) y para mostrar/ocultar contraseña
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  // VALIDACIÓN BÁSICA DE EMAIL (formato con @ y dominio .com o .co)
  const isValidEmailFormat = (emailToTest: string) => {
    const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|co)$/;
    return regex.test(emailToTest);
  };

  const handleLoginOrRegister = async () => {
    // Verifica que haya email y contraseña
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa un correo y contraseña.');
      return;
    }

    // Verifica formato de email
    if (!isValidEmailFormat(email)) {
      Alert.alert('Error', 'Formato de correo inválido');
      return;
    }

    // En modo registro, también forzamos que el usuario ingrese un nombre
    if (isRegisterMode && !name.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre.');
      return;
    }

    try {
      if (isRegisterMode) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // NUEVO: Se guarda el displayName en el perfil de Firebase
        await updateProfile(userCredential.user, { displayName: name });

        console.log('Usuario registrado:', userCredential.user.uid);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Usuario logueado:', userCredential.user.uid);
      }
    } catch (error: any) {
      console.log('Error en Auth:', error.message);
      Alert.alert('Error', error.message);
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

      {/** NUEVO: Input para Nombre (solo se muestra en modo registro) */}
      {isRegisterMode && (
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {/** Campo de contraseña con botón para ocultar/mostrar */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1, marginVertical: 0 }]}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={24}
            color="#fff"
            style={{ marginLeft: 10 }}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.mainButton} onPress={handleLoginOrRegister}>
        <Text style={styles.mainButtonText}>
          {isRegisterMode ? 'Registrarme' : 'Entrar'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.toggleButton} onPress={handleToggleMode}>
        <Text style={styles.toggleButtonText}>
          {isRegisterMode
            ? '¿Ya tienes cuenta? Inicia Sesión'
            : '¿No tienes cuenta? Regístrate'}
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#4A4B57',
    borderRadius: 8,
    marginVertical: 8,
    paddingHorizontal: 10
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
