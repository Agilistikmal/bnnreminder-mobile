import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { calculateKGBStatus, fetchKGBData } from './SpreadsheetService';

const BACKGROUND_FETCH_TASK = 'BACKGROUND_FETCH_TASK';

// Cek apakah menggunakan Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Konfigurasi notifikasi
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true
    }),
});

// Konfigurasi background fetch task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    try {
        const hasNewReminders = await checkForNewReminders();

        if (hasNewReminders) {
            await sendNotification();
        }

        return hasNewReminders ? BackgroundFetch.BackgroundFetchResult.NewData : BackgroundFetch.BackgroundFetchResult.NoData;
    } catch (error) {
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

export async function registerBackgroundFetch() {
    if (isExpoGo) {
        console.warn('Background fetch tidak tersedia di Expo Go');
        return;
    }

    try {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
            minimumInterval: 60 * 60, // 1 jam
            stopOnTerminate: false,
            startOnBoot: true,
        });
    } catch (err) {
        console.error("Gagal mendaftarkan task:", err);
    }
}

export async function requestNotificationPermissions() {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            throw new Error('Izin notifikasi tidak diberikan');
        }

        if (Platform.OS === 'android') {
            if (isExpoGo) {
                console.warn('Notifikasi mungkin tidak berfungsi sepenuhnya di Expo Go');
            }

            await Notifications.setNotificationChannelAsync('default', {
                name: 'Pengingat KGB',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return true;
    } catch (error) {
        if (isExpoGo) {
            console.warn('Notifikasi tidak tersedia di Expo Go. Silakan gunakan development build.');
            return false;
        }
        throw error;
    }
}

async function checkForNewReminders() {
    try {
        const kgbData = await fetchKGBData();
        const waktunyaKGB = kgbData.filter(item => calculateKGBStatus(item) === 'waktunya');

        if (waktunyaKGB.length > 0) {
            // Simpan data untuk notifikasi
            const notificationData = waktunyaKGB.map(item => ({
                nama: item.nama,
                nip: item.nip,
                kgbBerikutnya: item.kgbBerikutnya
            }));

            // Simpan ke AsyncStorage untuk digunakan di notifikasi
            await AsyncStorage.setItem('waktunyaKGB', JSON.stringify(notificationData));
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error checking for reminders:', error);
        return false;
    }
}

async function sendNotification() {
    if (isExpoGo) {
        console.warn('Pengiriman notifikasi tidak tersedia di Expo Go');
        return;
    }

    try {
        const notificationData = await AsyncStorage.getItem('waktunyaKGB');
        if (!notificationData) return;

        const waktunyaKGB = JSON.parse(notificationData);
        const count = waktunyaKGB.length;

        let title = "Pengingat KGB";
        let body = count === 1
            ? `${waktunyaKGB[0].nama} (${waktunyaKGB[0].nip}) waktunya KGB`
            : `Ada ${count} pegawai yang waktunya KGB`;

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: { screen: 'home' },
            },
            trigger: null,
        });
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

export async function setupNotifications() {
    try {
        if (isExpoGo) {
            console.warn('Fitur notifikasi terbatas di Expo Go. Untuk pengalaman lengkap, gunakan development build.');
            return false;
        }

        await requestNotificationPermissions();
        await registerBackgroundFetch();
        return true;
    } catch (error) {
        console.error("Gagal menyiapkan notifikasi:", error);
        return false;
    }
}

// Fungsi untuk memulai background fetch
export async function startBackgroundFetch() {
    try {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
            minimumInterval: 60 * 15, // 15 menit
            stopOnTerminate: false,
            startOnBoot: true,
        });
    } catch (error) {
        console.error('Error starting background fetch:', error);
    }
}

// Fungsi untuk menghentikan background fetch
export async function stopBackgroundFetch() {
    try {
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    } catch (error) {
        console.error('Error stopping background fetch:', error);
    }
} 