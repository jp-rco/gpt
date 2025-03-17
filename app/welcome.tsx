import React, { useContext, useRef, useState } from 'react';
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
import Ionicons from '@expo/vector-icons/Ionicons';
import { DarkModeContext } from '../context/DarkModeContext';

const { width } = Dimensions.get('window');

export default function Welcome() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [pageIndex, setPageIndex] = useState(0);

  // Datos de las tarjetas
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

  // DarkMode
  const { isDarkMode, toggleDarkMode } = useContext(DarkModeContext);
  const styles = getStyles(isDarkMode);

  // Manejo del scroll horizontal para paginación
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
        animated: true
      });
    } else {
      router.push('/chat?forceNew=1');
    }
  };

  return (
    <View style={styles.container}>
      {/* Botón para alternar tema */}
      <TouchableOpacity style={styles.darkModeButton} onPress={toggleDarkMode}>
        {isDarkMode ? (
          <Ionicons name="sunny" size={24} color="#fff" />
        ) : (
          <Ionicons name="moon" size={24} color="#fff" />
        )}
      </TouchableOpacity>

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

      {/* Botón Next / Let’s Chat */}
      <TouchableOpacity style={styles.button} onPress={handleNextPress}>
        <Text style={styles.buttonText}>
          {pageIndex < pages.length - 1 ? 'Next' : `Let's Chat →`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Función de estilos
function getStyles(isDarkMode: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000' : '#343541'
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
    header: {
      alignItems: 'center',
      marginTop: 40,
      marginBottom: 20
    },
    logo: {
      width: 50,
      height: 50,
      resizeMode: 'contain',
      marginBottom: 10
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white'
    },
    subtitle: {
      fontSize: 16,
      color: 'white',
      marginBottom: 10
    },
    scrollContainer: {
      height: 250,
      overflow: 'hidden'
    },
    page: {
      justifyContent: 'center',
      alignItems: 'center'
    },
    sectionTitle: {
      fontSize: 18,
      color: 'white',
      marginVertical: 10,
      textAlign: 'center'
    },
    itemBox: {
      backgroundColor: '#4A4B57',
      padding: 15,
      borderRadius: 10,
      marginVertical: 5,
      width: width * 0.9
    },
    itemText: {
      color: '#fff',
      textAlign: 'center'
    },
    button: {
      backgroundColor: '#2AB37E',
      margin: 20,
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center'
    },
    buttonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold'
    }
  });
}
