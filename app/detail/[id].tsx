import { KGBData, calculateKGBStatus, fetchKGBData, formatCurrency, formatDate } from '@/services/SpreadsheetService';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<KGBData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const kgbData = await fetchKGBData();
        const detail = kgbData.find(item => item.no === id);
        setData(detail || null);
      } catch (error) {
        console.error('Error loading KGB detail:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.errorText}>Data KGB tidak ditemukan</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = calculateKGBStatus(data);
  const statusColors = {
    akan_datang: '#2196F3',
    waktunya: '#FFC107',
    terlambat: '#F44336',
  };

  const statusText = {
    akan_datang: 'Akan Datang',
    waktunya: 'Waktunya KGB',
    terlambat: 'Terlambat',
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.status, { color: statusColors[status] }]}>
            {statusText[status]}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Pegawai</Text>
          <InfoItem label="Nama" value={data.nama} />
          <InfoItem label="NIP" value={data.nip} />
          <InfoItem label="Pangkat" value={data.pangkat} />
          <InfoItem label="Golongan" value={data.gol} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KGB Lama</Text>
          <InfoItem label="TMT" value={formatDate(data.tmtLama)} />
          <InfoItem label="Gaji Pokok" value={formatCurrency(data.gajiPokokLama)} />
          <InfoItem label="Masa Kerja" value={data.masaKerjaLama} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KGB Baru</Text>
          <InfoItem label="TMT" value={formatDate(data.tmtBaru)} />
          <InfoItem label="Gaji Pokok" value={formatCurrency(data.gajiPokokBaru)} />
          <InfoItem label="Masa Kerja" value={data.masaKerjaBaru} />
          <InfoItem label="KGB Berikutnya" value={formatDate(data.kgbBerikutnya)} />
        </View>

        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Informasi Surat</Text>
          <InfoItem label="Nomor Surat" value={data.nomorSurat} />
          <InfoItem label="Tanggal Surat" value={formatDate(data.tanggalSurat)} />
          <InfoItem label="Oleh Pejabat" value={data.olehPejabat} />
          <InfoItem label="Satuan Kerja" value={data.satker} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  status: {
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lastSection: {
    borderBottomWidth: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#2196F3',
  },
  infoItem: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 