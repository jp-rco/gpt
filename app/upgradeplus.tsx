import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DarkModeContext } from '../context/DarkModeContext';

export default function UpgradePlus() {
  const { isDarkMode, toggleDarkMode } = useContext(DarkModeContext);

  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      {/* Botón para alternar modo oscuro */}
      <TouchableOpacity style={styles.themeButton} onPress={toggleDarkMode}>
        <Ionicons
          name={isDarkMode ? 'sunny' : 'moon'}
          size={24}
          color="#fff"
        />
      </TouchableOpacity>

      <Text style={styles.header}>Planes</Text>

      <ScrollView contentContainerStyle={styles.plansContainer}>
        {/* Plan PLUS */}
        <View style={styles.planBox}>
          <Text style={styles.planTitle}>Plus</Text>
          <Text style={styles.price}>$20 USD/mes</Text>
          <Text style={styles.description}>
            Aumenta la productividad y la creatividad con un acceso ampliado:
          </Text>
          <Text style={styles.bullet}>• Todo lo que está incluido en la versión gratuita</Text>
          <Text style={styles.bullet}>• Límites de uso ampliados en mensajes y archivos</Text>
          <Text style={styles.bullet}>• Modo de voz avanzada y estándar</Text>
          <Text style={styles.bullet}>• Acceso a investigación en profundidad</Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Seleccionar Plus</Text>
          </TouchableOpacity>
        </View>

        {/* Plan PRO */}
        <View style={styles.planBox}>
          <Text style={styles.planTitle}>Pro</Text>
          <Text style={styles.price}>$200 USD/mes</Text>
          <Text style={styles.description}>
            Consigue lo mejor de OpenAI con el máximo nivel de acceso:
          </Text>
          <Text style={styles.bullet}>• Todo lo que está incluido en la versión Plus</Text>
          <Text style={styles.bullet}>
            • Acceso ilimitado a los modelos de razonamiento y a GPT-4o
          </Text>
          <Text style={styles.bullet}>• Acceso ilimitado al modo de voz avanzado</Text>
          <Text style={styles.bullet}>
            • Acceso ampliado a la generación de video con Sora
          </Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Seleccionar Pro</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// Generador de estilos en base al modo oscuro
function getStyles(isDarkMode: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000' : '#343541',
      paddingHorizontal: 20,
      paddingTop: 50
    },
    themeButton: {
      position: 'absolute',
      top: 40,
      right: 20,
      zIndex: 10,
      padding: 10,
      backgroundColor: '#2AB37E',
      borderRadius: 5
    },
    header: {
      fontSize: 24,
      color: '#fff',
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center'
    },
    plansContainer: {
      paddingBottom: 30
    },
    planBox: {
      backgroundColor: isDarkMode ? '#333333' : '#444654',
      borderRadius: 10,
      marginBottom: 20,
      padding: 15
    },
    planTitle: {
      fontSize: 20,
      color: '#fff',
      fontWeight: 'bold',
      marginBottom: 5
    },
    price: {
      fontSize: 18,
      color: '#2AB37E',
      marginBottom: 10
    },
    description: {
      color: '#fff',
      marginBottom: 10
    },
    bullet: {
      color: '#fff',
      marginLeft: 5,
      marginBottom: 5
    },
    upgradeButton: {
      marginTop: 10,
      backgroundColor: '#2AB37E',
      paddingVertical: 10,
      borderRadius: 5
    },
    upgradeButtonText: {
      textAlign: 'center',
      color: '#fff',
      fontWeight: 'bold'
    }
  });
}
