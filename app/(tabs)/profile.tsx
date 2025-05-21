import Constants from 'expo-constants';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
      <View style={styles.header}>
        <Text style={styles.title}>BNN Reminder</Text>
        <Text style={styles.version}>Versi {Constants.expoConfig?.version || '1.0.0'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tentang Aplikasi</Text>
        <Text style={styles.description}>
          Aplikasi pengingat KGB (Kenaikan Gaji Berkala) untuk pegawai BNN Provinsi D.I. Yogyakarta. Aplikasi ini membantu memantau jadwal KGB pegawai dan memberikan notifikasi ketika waktunya KGB.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fitur</Text>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• Monitoring jadwal KGB pegawai</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• Notifikasi otomatis</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• Detail informasi KGB</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• Pencarian pegawai</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pengembang</Text>
        <Text style={styles.developer}>Agil Ghani Istikmal</Text>
        <Text style={{color: '#666', fontSize: 12}}>Program KDK Magang Informatika</Text>
        <Text style={{color: '#666', fontSize: 12}}>Universitas Teknologi Yogyakarta</Text>
        <Text style={{color: '#666', fontSize: 12}}>Email: hubungi@agil.zip</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://agil.zip')}>
          <Text style={{color: '#2196F3', textDecorationLine: 'underline'}}>https://agil.zip</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lastSection: {
    borderBottomWidth: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  featureItem: {
    marginBottom: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
  },
  developer: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  contact: {
    fontSize: 16,
    color: '#666',
  },
  copyright: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
}); 