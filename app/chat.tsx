import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  TextInput,
  TouchableOpacity,
  Platform,
  Linking,
  Alert
} from 'react-native';
import { db, auth } from '../utils/FirebaseConfig';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  deleteDoc
} from 'firebase/firestore/lite';
import { signOut } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

// IMPORTAMOS useRouter de expo-router (si utilizas Expo Router)
import { useRouter } from 'expo-router';

// IMPORTAMOS la función parseAndFormat desde utils/markdownParser
import { parseAndFormat } from '../utils/markdownParser';

// Context para modo oscuro
import { DarkModeContext } from '../context/DarkModeContext';

interface Message {
  id?: string;
  text: string;
  author: 'user' | 'assistant';
  timestamp: number;
}

interface ChatSession {
  id: string;
  createdAt: number;
  sessionName: string;
  uid?: string;
}

export default function Chat() {
  // Hooks de navegación:
  const navigation = useNavigation<any>();
  const router = useRouter(); // Si usas Expo Router
  
  // Hook del modo oscuro (si lo usas)
  const { isDarkMode, toggleDarkMode } = useContext(DarkModeContext);

  // Estados
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');

  // Referencia al ScrollView (para auto-scroll)
  const scrollViewRef = useRef<ScrollView>(null);

  // Verifica autenticación de usuario en Firebase
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        navigation.replace('AuthScreen'); 
      } else if (user.displayName) {
        setDisplayName(user.displayName);
      }
    });
    return unsubscribe;
  }, []);

  // Carga las sesiones de chat de Firestore
  useEffect(() => {
    const loadSessions = async () => {
      try {
        if (!auth.currentUser) return;
        const sessionsRef = collection(db, 'chatSessions');
        const qSessions = query(sessionsRef, where('uid', '==', auth.currentUser.uid));
        const snapshot = await getDocs(qSessions);

        const loadedSessions: ChatSession[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data() as Omit<ChatSession, 'id'>;
          return { id: docSnap.id, ...data };
        });

        // Ordenamos por fecha descendiente
        loadedSessions.sort((a, b) => b.createdAt - a.createdAt);
        setSessions(loadedSessions);

        // Seleccionamos la primera sesión (más reciente) si existe
        if (loadedSessions.length > 0) {
          setCurrentSessionId(loadedSessions[0].id);
        }
      } catch (error) {
        console.error('Error al cargar sesiones:', error);
      }
    };
    loadSessions();
  }, []);

  // Carga los mensajes de la sesión activa
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }
    const loadMessages = async () => {
      try {
        const messagesRef = collection(db, 'chatSessions', currentSessionId, 'messages');
        const qMessages = query(messagesRef, orderBy('timestamp', 'asc'));
        const snapshot = await getDocs(qMessages);

        const loadedMessages: Message[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data() as Omit<Message, 'id'>;
          return { id: docSnap.id, ...data };
        });

        setMessages(loadedMessages);
      } catch (error) {
        console.error('Error al cargar mensajes:', error);
      }
    };
    loadMessages();
  }, [currentSessionId]);

  // Auto-scroll cada vez que cambian los mensajes
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Crea una nueva sesión
  const createNewSession = async () => {
    try {
      if (!auth.currentUser) return;
      const newSession = {
        createdAt: Date.now(),
        sessionName: 'New Chat',
        uid: auth.currentUser.uid
      };
      const sessionsRef = collection(db, 'chatSessions');
      const docRef = await addDoc(sessionsRef, newSession);

      const sessionCreated: ChatSession = { id: docRef.id, ...newSession };
      setSessions(prev => [sessionCreated, ...prev]);
      setCurrentSessionId(docRef.id);
      setMessages([]);
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error al crear sesión:', error);
    }
  };

  // Selecciona una sesión al hacer tap en la lista
  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsMenuOpen(false);
  };

  // Enviar mensaje del usuario
  const handleSendMessage = () => {
    if (!inputText.trim() || !currentSessionId) return;
    const newMessage: Message = {
      text: inputText,
      author: 'user',
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    saveMessageToFirebase(newMessage);

    // Actualizamos el título si es un 'New Chat'
    const sessionData = sessions.find(s => s.id === currentSessionId);
    if (sessionData && sessionData.sessionName === 'New Chat') {
      const firstWord = inputText.trim().split(/\s+/)[0] || 'Chat';
      updateSessionTitle(firstWord);
    }

    // Llamamos a la "IA"
    fetchAssistantResponse(newMessage.text);
  };

  // Actualiza el título de la sesión
  const updateSessionTitle = async (title: string) => {
    if (!currentSessionId) return;
    try {
      const docRef = doc(db, 'chatSessions', currentSessionId);
      await updateDoc(docRef, { sessionName: title });
      setSessions(prev =>
        prev.map(s => (s.id === currentSessionId ? { ...s, sessionName: title } : s))
      );
    } catch (error) {
      console.error('Error al actualizar el título de la sesión:', error);
    }
  };

  // Guarda el mensaje en Firestore
  const saveMessageToFirebase = async (message: Message) => {
    if (!currentSessionId) return;
    try {
      const messagesRef = collection(db, 'chatSessions', currentSessionId, 'messages');
      await addDoc(messagesRef, message);
    } catch (error) {
      console.error('Error al guardar mensaje:', error);
    }
  };

  // Llamada (ejemplo) a la API generativa
  const fetchAssistantResponse = async (userQuestion: string) => {
    setIsLoading(true);

    // Mensaje placeholder de la IA
    const placeholderMessage: Message = {
      text: '...',
      author: 'assistant',
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, placeholderMessage]);

    try {
      const ENDPOINT =
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAavCejNg4OMr_Lu9hDEijer8wOTyQXZ04';
      const body = {
        contents: [
          {
            parts: [{ text: userQuestion }]
          }
        ]
      };
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const assistantReply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from API';

      // Mensaje final
      const finalMessage: Message = {
        text: assistantReply,
        author: 'assistant',
        timestamp: Date.now()
      };

      // Reemplaza "..." con la respuesta real
      setMessages(prev =>
        prev.map(msg =>
          msg.text === '...' && msg.author === 'assistant' ? finalMessage : msg
        )
      );
      saveMessageToFirebase(finalMessage);
    } catch (error) {
      console.error('Error al llamar a la API:', error);
      // Mensaje de error
      const errorMessage: Message = {
        text: 'Error: Unable to retrieve response.',
        author: 'assistant',
        timestamp: Date.now()
      };
      setMessages(prev =>
        prev.map(msg =>
          msg.text === '...' && msg.author === 'assistant' ? errorMessage : msg
        )
      );
      saveMessageToFirebase(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Borrar conversaciones
  const handleClearConversations = async () => {
    if (!auth.currentUser) return;
    try {
      const sessionsRef = collection(db, 'chatSessions');
      const qSessions = query(sessionsRef, where('uid', '==', auth.currentUser.uid));
      const snapshot = await getDocs(qSessions);

      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, 'chatSessions', docSnap.id));
      }

      setSessions([]);
      setMessages([]);
      setCurrentSessionId(null);
      setIsMenuOpen(false);
      Alert.alert('Conversaciones borradas', 'Se han eliminado todas las conversaciones.');
    } catch (error) {
      console.error('Error al borrar conversaciones:', error);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('AuthScreen'); 
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Estilos
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      {/* Botón menú */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setIsMenuOpen(!isMenuOpen)}
      >
        <Ionicons name="menu" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Lista de mensajes */}
      <ScrollView
        style={styles.messagesContainer}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Ask anything, get your answer</Text>
          </View>
        )}
        {messages.map((msg, index) => {
          const isUser = msg.author === 'user';
          return (
            <View
              key={msg.id || index}
              style={[
                styles.messageBubble,
                isUser ? styles.userBubble : styles.assistantBubble
              ]}
            >
              {/* Renderizamos el texto con parseAndFormat */}
              <Text style={styles.messageText}>
                {parseAndFormat(msg.text).map((component, i) => (
                  <React.Fragment key={i}>{component}</React.Fragment>
                ))}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Input para enviar mensaje */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your question..."
            placeholderTextColor="#888"
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={isLoading || !currentSessionId}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Menú lateral */}
      {isMenuOpen && (
        <View style={styles.sideMenu}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sideMenuTitle}>Chats</Text>

            {displayName ? (
              <Text style={styles.userName}>{displayName}</Text>
            ) : null}

            <TouchableOpacity style={styles.newChatButton} onPress={createNewSession}>
              <Text style={styles.newChatButtonText}>+ New Chat</Text>
            </TouchableOpacity>

            <ScrollView style={styles.sessionList}>
              {sessions.map(session => (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionItem}
                  onPress={() => handleSelectSession(session.id)}
                >
                  <Text style={styles.sessionItemText}>{session.sessionName}</Text>
                  <Text style={{ color: '#999', fontSize: 12 }}>
                    {new Date(session.createdAt).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Clear conversations */}
            <TouchableOpacity style={styles.menuItem} onPress={handleClearConversations}>
              <Ionicons name="trash" size={20} color="#fff" style={{ marginRight: 5 }} />
              <Text style={styles.menuItemText}>Clear conversations</Text>
            </TouchableOpacity>

            {/* Upgrade to Plus (si deseas usar router) */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.replace('/upgradeplus')}
            >
              <Ionicons name="star" size={20} color="#fff" style={{ marginRight: 5 }} />
              <Text style={styles.menuItemText}>Upgrade to Plus</Text>
            </TouchableOpacity>

            {/* Modo claro/oscuro */}
            <TouchableOpacity style={styles.menuItem} onPress={toggleDarkMode}>
              <Ionicons
                name={isDarkMode ? 'sunny' : 'moon'}
                size={20}
                color="#fff"
                style={{ marginRight: 5 }}
              />
              <Text style={styles.menuItemText}>
                {isDarkMode ? 'Light mode' : 'Dark mode'}
              </Text>
            </TouchableOpacity>

            {/* Updates & FAQ */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Linking.openURL('https://help.openai.com/')}
            >
              <Ionicons name="help" size={20} color="#fff" style={{ marginRight: 5 }} />
              <Text style={styles.menuItemText}>Updates & FAQ</Text>
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Estilos condicionados según modo oscuro/normal
function getStyles(isDarkMode: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : '#343541'
    },
    menuButton: {
      position: 'absolute',
      top: 40,
      left: 20,
      zIndex: 10,
      padding: 10
    },
    messagesContainer: {
      flex: 1,
      paddingTop: 80,
      paddingHorizontal: 10
    },
    emptyContainer: {
      marginTop: 30,
      alignItems: 'center'
    },
    emptyText: {
      color: '#777',
      fontSize: 16
    },
    messageBubble: {
      marginVertical: 5,
      padding: 10,
      borderRadius: 8,
      maxWidth: '80%'
    },
    userBubble: {
      alignSelf: 'flex-end',
      backgroundColor: isDarkMode ? '#555555' : '#2AB37E'
    },
    assistantBubble: {
      alignSelf: 'flex-start',
      backgroundColor: isDarkMode ? '#333333' : '#4A4B57'
    },
    messageText: {
      color: '#fff'
    },
    inputContainer: {
      padding: 10,
      backgroundColor: isDarkMode ? '#000000' : '#343541'
    },
    inputWrapper: {
      flexDirection: 'row',
      backgroundColor: isDarkMode ? '#222222' : '#4A4B57',
      borderRadius: 25,
      alignItems: 'center',
      paddingHorizontal: 10
    },
    textInput: {
      flex: 1,
      color: '#fff'
    },
    sendButton: {
      marginLeft: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: '#2AB37E',
      borderRadius: 20
    },
    sendButtonText: {
      color: '#fff',
      fontWeight: 'bold'
    },
    sideMenu: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 250,
      height: '100%',
      backgroundColor: isDarkMode ? '#111111' : '#202123',
      paddingTop: 60,
      paddingHorizontal: 10,
      zIndex: 20
    },
    sideMenuTitle: {
      fontSize: 18,
      color: '#fff',
      marginBottom: 10
    },
    userName: {
      color: '#fff',
      fontSize: 16,
      marginBottom: 10,
      fontWeight: 'bold'
    },
    newChatButton: {
      backgroundColor: '#2AB37E',
      borderRadius: 5,
      marginBottom: 15,
      padding: 10
    },
    newChatButtonText: {
      color: '#fff',
      fontWeight: 'bold'
    },
    sessionList: {
      flexGrow: 1,
      marginBottom: 10
    },
    sessionItem: {
      backgroundColor: isDarkMode ? '#333333' : '#4A4B57',
      padding: 10,
      borderRadius: 5,
      marginBottom: 10
    },
    sessionItemText: {
      color: '#fff',
      fontSize: 16,
      marginBottom: 3
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15
    },
    menuItemText: {
      color: '#fff',
      fontSize: 16
    },
    logoutButton: {
      backgroundColor: 'red',
      padding: 10,
      borderRadius: 5,
      marginBottom: 10
    },
    logoutButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      textAlign: 'center'
    }
  });
}
