import { formatCurrency, formatDate, KGBData } from '@/services/SpreadsheetService';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

interface KGBCardProps {
  data: KGBData;
  status: 'akan_datang' | 'waktunya' | 'terlambat';
}

export function KGBCard({ data, status }: KGBCardProps) {
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
    <Link href={`/reminder/${data.no}`} asChild>
      <View style={[styles.card, { borderLeftColor: statusColors[status] }]}>
        <View style={styles.header}>
          <Text style={styles.name}>{data.nama}</Text>
          <Text style={[styles.status, { color: statusColors[status] }]}>
            {statusText[status]}
          </Text>
        </View>
        
        <Text style={styles.nip}>{data.nip}</Text>
        
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.label}>TMT KGB</Text>
            <Text style={styles.value}>{formatDate(data.tmtBaru)}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.label}>Gaji Pokok</Text>
            <Text style={styles.value}>{formatCurrency(data.gajiPokokBaru)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.nextKGB}>
            KGB Berikutnya: {formatDate(data.kgbBerikutnya)}
          </Text>
        </View>
      </View>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  nip: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  nextKGB: {
    fontSize: 14,
    color: '#666',
  },
}); 