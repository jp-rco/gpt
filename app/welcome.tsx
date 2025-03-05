// app/welcome.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function Welcome() {
  const router = useRouter();
  const [pageIndex, setPageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const pages = [
    {
      title: 'Examples',
      items: [
        'Explain quantum computing in simple terms',
        'Got any creative ideas for a 10-year-old’s birthday?',
        'How do I make an HTTP request in JavaScript?'
      ]
    },
    {
      title: 'Capabilities',
      items: [
        'Remembers what user said earlier in the conversation',
        'Allows user to provide follow-up corrections',
        'Trained to decline inappropriate requests'
      ]
    },
    {
      title: 'Limitations',
      items: [
        'May occasionally generate incorrect information',
        'May occasionally produce harmful instructions or biased content',
        'Limited knowledge of world and events after 2021'
      ]
    }
  ];

  // Actualiza el índice de página mientras haces scroll horizontal
  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const newPageIndex = Math.round(scrollX / width);
    setPageIndex(newPageIndex);
  };

  // Botón Next / Let’s Chat
  const handleNextPress = () => {
    if (pageIndex < pages.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (pageIndex + 1) * width,
        y: 0,
        animated: true,
      });
    } else {
      // Vamos a la pantalla de chat
      router.push('/chat');
    }
  };

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Welcome to ChatGPT</Text>
        <Text style={styles.subtitle}>Ask anything, get your answer</Text>
      </View>

      {/* Contenedor desplazable */}
      <View style={styles.scrollContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          onScroll={handleScroll}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          {pages.map((page, index) => (
            <View key={index} style={[styles.page, { width }]}>
              <Text style={styles.sectionTitle}>{page.title}</Text>
              {page.items.map((item, idx) => (
                <View key={idx} style={styles.itemBox}>
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Botón */}
      <TouchableOpacity style={styles.button} onPress={handleNextPress}>
        <Text style={styles.buttonText}>
          {pageIndex < pages.length - 1 ? 'Next' : `Let's Chat →`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#343541',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 10,
  },
  scrollContainer: {
    height: 250,
    overflow: 'hidden',
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    color: 'white',
    marginVertical: 10,
    textAlign: 'center',
  },
  itemBox: {
    backgroundColor: '#4A4B57',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    width: width * 0.9,
  },
  itemText: {
    color: '#fff',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2AB37E',
    margin: 20,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
