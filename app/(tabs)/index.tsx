import {
  KGBData,
  calculateKGBStatus,
  fetchKGBData,
  formatDate,
} from "@/services/SpreadsheetService";
import { MaterialIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [data, setData] = useState<KGBData[]>([]);
  const [filteredData, setFilteredData] = useState<KGBData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "semua" | "terlambat" | "waktunya" | "akan_datang"
  >("semua");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [data, searchQuery, selectedFilter]);

  async function loadData() {
    try {
      const kgbData = await fetchKGBData();
      // Sort data berdasarkan status: terlambat -> waktunya -> akan datang
      const sortedData = kgbData.sort((a, b) => {
        const statusA = calculateKGBStatus(a);
        const statusB = calculateKGBStatus(b);
        const priority = { terlambat: 0, waktunya: 1, akan_datang: 2 };
        return priority[statusA] - priority[statusB];
      });
      setData(sortedData);
      setFilteredData(sortedData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
  }

  function filterData() {
    let filtered = [...data];

    // Apply status filter
    if (selectedFilter !== "semua") {
      filtered = filtered.filter(
        (item) => calculateKGBStatus(item) === selectedFilter
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.nama.toLowerCase().includes(query) ||
          item.nip.toLowerCase().includes(query)
      );
    }

    setFilteredData(filtered);
  }

  function getStatusColor(
    status: "akan_datang" | "waktunya" | "terlambat"
  ): string {
    const colors = {
      akan_datang: "#2196F3",
      waktunya: "#FFC107",
      terlambat: "#F44336",
    };
    return colors[status];
  }

  function getStatusText(
    status: "akan_datang" | "waktunya" | "terlambat"
  ): string {
    const text = {
      akan_datang: "Akan Datang",
      waktunya: "Waktunya KGB",
      terlambat: "Terlambat",
    };
    return text[status];
  }

  function FilterButton({
    status,
    label,
  }: {
    status: typeof selectedFilter;
    label: string;
  }) {
    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          selectedFilter === status && styles.filterButtonActive,
        ]}
        onPress={() => setSelectedFilter(status)}
      >
        <Text
          style={[
            styles.filterButtonText,
            selectedFilter === status && styles.filterButtonTextActive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderItem({ item }: { item: KGBData }) {
    const status = calculateKGBStatus(item);
    return (
      <Link href={`/detail/${item.no}`} asChild>
        <TouchableOpacity style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.name}>{item.nama}</Text>
            <Text style={[styles.status, { color: getStatusColor(status) }]}>
              {getStatusText(status)}
            </Text>
          </View>
          <Text style={styles.nip}>{item.nip}</Text>
          <Text style={styles.info}>
            KGB TMT Baru: {formatDate(item.tmtBaru)}
          </Text>
        </TouchableOpacity>
      </Link>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons
            name="search"
            size={24}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama atau NIP..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          <FilterButton status="semua" label="Semua" />
          <FilterButton status="terlambat" label="Terlambat" />
          <FilterButton status="waktunya" label="Waktunya" />
          <FilterButton status="akan_datang" label="Akan Datang" />
        </ScrollView>
      </View>
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.no}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tidak ada data yang sesuai</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2196F3"]}
            tintColor="#2196F3"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    gap: 12,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: "#000",
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  filterButtonActive: {
    backgroundColor: "#2196F3",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#666",
  },
  filterButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  list: {
    padding: 16,
  },
  emptyContainer: {
    padding: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  status: {
    fontSize: 14,
    fontWeight: "600",
  },
  nip: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  info: {
    fontSize: 14,
    color: "#2196F3",
  },
});
