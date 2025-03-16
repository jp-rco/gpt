import React, { useEffect, useContext } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { DarkModeContext } from '../context/DarkModeContext';

export default function SplashScreenWelcome() {
  const router = useRouter();
  const { isDarkMode } = useContext(DarkModeContext);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/welcome');
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#343541' }]}>
      <Image source={require('../assets/images/logo.png')} style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: { 
    width: 100, 
    height: 100, 
    resizeMode: 'contain', 
    marginBottom: 10 
  },
});
