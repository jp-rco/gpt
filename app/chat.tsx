import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  TextInput,
  TouchableOpacity,
  Platform
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
  orderBy
} from 'firebase/firestore/lite';
import { signOut } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
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
  const navigation = useNavigation<any>();
  const { isDarkMode, toggleDarkMode } = useContext(DarkModeContext);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  // Redirige a AuthScreen si el usuario no está autenticado
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        navigation.replace('AuthScreen');
      }
    });
    return unsubscribe;
  }, []);

  // Cargar sesiones del usuario
  useEffect(() => {
    const loadSessions = async () => {
      try {
        if (!auth.currentUser) return;
        const sessionsRef = collection(db, 'chatSessions');
        const q = query(sessionsRef, where('uid', '==', auth.currentUser.uid));
        const snapshot = await getDocs(q);
        const loadedSessions: ChatSession[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data() as Omit<ChatSession, 'id'>;
          return { id: docSnap.id, ...data };
        });
        loadedSessions.sort((a, b) => b.createdAt - a.createdAt);
        setSessions(loadedSessions);
        if (loadedSessions.length > 0) {
          setCurrentSessionId(loadedSessions[0].id);
        }
      } catch (error) {
        console.error('Error al cargar sesiones:', error);
      }
    };
    loadSessions();
  }, []);

  // Cargar mensajes de la sesión activa
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }
    const loadMessages = async () => {
      try {
        const messagesRef = collection(db, 'chatSessions', currentSessionId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const snapshot = await getDocs(q);
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

  // Desplazar el scroll al final al actualizar los mensajes
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

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

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsMenuOpen(false);
  };

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
    const sessionData = sessions.find(s => s.id === currentSessionId);
    if (sessionData && sessionData.sessionName === 'New Chat') {
      const firstWord = inputText.trim().split(/\s+/)[0] || 'Chat';
      updateSessionTitle(firstWord);
    }
    fetchAssistantResponse(newMessage.text);
  };

  const updateSessionTitle = async (title: string) => {
    if (!currentSessionId) return;
    try {
      const docRef = doc(db, 'chatSessions', currentSessionId);
      await updateDoc(docRef, { sessionName: title });
      setSessions(prev =>
        prev.map(s => s.id === currentSessionId ? { ...s, sessionName: title } : s)
      );
    } catch (error) {
      console.error('Error al actualizar el título de la sesión:', error);
    }
  };

  const saveMessageToFirebase = async (message: Message) => {
    if (!currentSessionId) return;
    try {
      const messagesRef = collection(db, 'chatSessions', currentSessionId, 'messages');
      await addDoc(messagesRef, message);
    } catch (error) {
      console.error('Error al guardar mensaje:', error);
    }
  };

  const fetchAssistantResponse = async (userQuestion: string) => {
    setIsLoading(true);
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
      const finalMessage: Message = {
        text: assistantReply,
        author: 'assistant',
        timestamp: Date.now()
      };
      setMessages(prev =>
        prev.map(msg =>
          msg.text === '...' && msg.author === 'assistant' ? finalMessage : msg
        )
      );
      saveMessageToFirebase(finalMessage);
    } catch (error) {
      console.error('Error al llamar a la API:', error);
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('AuthScreen');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

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

      {/* Botón para alternar modo oscuro */}
      <TouchableOpacity
        style={styles.themeButton}
        onPress={toggleDarkMode}
      >
        {isDarkMode ? (
          <Ionicons name="sunny" size={24} color="#fff" />
        ) : (
          <Ionicons name="moon" size={24} color="#fff" />
        )}
      </TouchableOpacity>

      {/* Menú lateral */}
      {isMenuOpen && (
        <View style={styles.sideMenu}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sideMenuTitle}>Chats</Text>
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
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de mensajes */}
      <ScrollView
        style={styles.messagesContainer}
        ref={scrollViewRef}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
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
              <Text style={styles.messageText}>{msg.text}</Text>
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
    </View>
  );
}

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
    themeButton: {
      position: 'absolute',
      top: 40,
      right: 20,
      zIndex: 10,
      padding: 10
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
      marginBottom: 15
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
      flexGrow: 1
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
