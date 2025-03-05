// app/chat.tsx
import React, { useState, useEffect, useRef } from 'react';
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

interface Message {
  text: string;
  author: 'user' | 'assistant';
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Desplázate al final del ScrollView cuando cambian los mensajes
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Maneja el evento de 'Send' para el usuario
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // Agregar mensaje del usuario
    setMessages((prev) => [...prev, { text: inputText, author: 'user' }]);
    const userQuestion = inputText; // Guardamos el texto para la request
    setInputText('');

    // Llamamos a la API de Google Generative Language
    fetchAssistantResponse(userQuestion);
  };

  // Llama a la API para obtener la respuesta del Assistant
  const fetchAssistantResponse = async (userQuestion: string) => {
    setIsLoading(true);

    // Agregamos un mensaje temporal '...' del assistant
    setMessages((prev) => [...prev, { text: '...', author: 'assistant' }]);

    try {
      // Ajusta la URL con tu propia clave (ojo con exponerla)
      const ENDPOINT =
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAavCejNg4OMr_Lu9hDEijer8wOTyQXZ04';

      // Según la documentación, el formato del body:
      // {
      //   "contents": [
      //     { "parts": [{"text": "..."}] }
      //   ]
      // }
      const body = {
        contents: [
          {
            parts: [{ text: userQuestion }]
          }
        ]
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Agrega más headers si tu API lo requiere, ej. Authorization
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // TODO: Ajusta la forma de extraer la respuesta, según lo devuelto por la API.
      // Suponiendo que la API devuelva algo como data.contents[0].parts[0].text
      const assistantReply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'No response from API';
    

      // Reemplazamos el texto '...' por la respuesta real
      setMessages((prev) =>
        prev.map((msg) =>
          msg.text === '...' && msg.author === 'assistant'
            ? { text: assistantReply, author: 'assistant' }
            : msg
        )
      );
    } catch (error) {
      console.error('Error al llamar a la API:', error);

      // Reemplazamos '...' con un mensaje de error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.text === '...' && msg.author === 'assistant'
            ? {
                text: 'Error: Unable to retrieve response.',
                author: 'assistant'
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Maneja la regeneración de la última respuesta
  const handleRegenerate = () => {
    // Si el último mensaje es del assistant, lo removemos
    setMessages((prev) => {
      const lastIndex = prev.length - 1;
      if (lastIndex >= 0 && prev[lastIndex].author === 'assistant') {
        return prev.slice(0, lastIndex);
      }
      return prev;
    });

    // Llamamos de nuevo a la API con la última pregunta del usuario
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((msg) => msg.author === 'user');
    if (lastUserMessage) {
      fetchAssistantResponse(lastUserMessage.text);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.messagesContainer}
        ref={scrollViewRef}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {/* Mensaje de placeholder si no hay chats */}
        {messages.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Ask anything, get your answer</Text>
          </View>
        )}

        {/* Burbujas de chat */}
        {messages.map((msg, index) => {
          const isUser = msg.author === 'user';
          return (
            <View
              key={index}
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

      {/* Botón de regenerar si el assistant ya respondió */}
      {messages.some((m) => m.author === 'assistant' && m.text !== '...') && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.regenerateButton} onPress={handleRegenerate}>
            <Text style={styles.regenerateText}>Regenerate response</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input para escribir pregunta */}
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
            disabled={isLoading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#343541'
  },
  messagesContainer: {
    flex: 1,
    padding: 10
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
    backgroundColor: '#2AB37E'
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#4A4B57'
  },
  messageText: {
    color: '#fff'
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 10
  },
  regenerateButton: {
    backgroundColor: '#4A4B57',
    borderRadius: 5,
    padding: 8,
    marginBottom: 5
  },
  regenerateText: {
    color: '#fff'
  },
  inputContainer: {
    padding: 10,
    backgroundColor: '#343541'
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: '#4A4B57',
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
  }
});