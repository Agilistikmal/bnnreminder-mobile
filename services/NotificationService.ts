import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { calculateKGBStatus, fetchKGBData } from './SpreadsheetService';

const BACKGROUND_TASK = 'BACKGROUND_TASK';

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

// Handler untuk klik notifikasi
Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.employeeId) {
        router.push(`/detail/${data.employeeId}`);
    }
});

// Konfigurasi background task
TaskManager.defineTask(BACKGROUND_TASK, async () => {
    try {
        const hasNewReminders = await checkForNewReminders();

        if (hasNewReminders) {
            await sendNotification();
        }

        return true;
    } catch (error) {
        return false;
    }
});

export async function registerBackgroundTask() {
    if (isExpoGo) {
        console.warn('Background task tidak tersedia di Expo Go');
        return;
    }

    try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);

        // Hanya unregister jika task sudah terdaftar
        if (isRegistered) {
            await TaskManager.unregisterTaskAsync(BACKGROUND_TASK);
        }

        // Daftarkan task baru
        await TaskManager.defineTask(BACKGROUND_TASK, async () => {
            try {
                const hasNewReminders = await checkForNewReminders();
                if (hasNewReminders) {
                    await sendNotification();
                }
                return true;
            } catch (error) {
                console.error('Error in background task:', error);
                return false;
            }
        });

        console.log('Background task berhasil didaftarkan');
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
                kgbBerikutnya: item.kgbBerikutnya,
                no: item.no // Tambahkan nomor pegawai
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

        // Jika hanya ada 1 pegawai, tambahkan ID-nya ke data notifikasi
        const data = count === 1
            ? { employeeId: waktunyaKGB[0].no }
            : { screen: 'home' };

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
            },
            trigger: {
                seconds: 60 * 60 * 6, // 6 jam
                repeats: true,
                channelId: 'default'
            },
        });
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

// Fungsi untuk mengirim notifikasi test
export async function sendTestNotification() {
    if (isExpoGo) {
        console.warn('Pengiriman notifikasi tidak tersedia di Expo Go');
        return;
    }

    try {
        // Buat data test
        const testData = {
            nama: "Test User",
            nip: "198501012010011001",
            kgbBerikutnya: "2024-04-01",
            no: "1"
        };

        // Kirim notifikasi test
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Test Notifikasi KGB",
                body: `${testData.nama} (${testData.nip}) waktunya KGB pada ${testData.kgbBerikutnya}`,
                data: { employeeId: testData.no }
            },
            trigger: {
                seconds: 5, // Notifikasi akan muncul dalam 5 detik
                repeats: false,
                channelId: 'default'
            },
        });

        console.log('Notifikasi test berhasil dikirim');
    } catch (error) {
        console.error('Error sending test notification:', error);
    }
}

export async function setupNotifications() {
    try {
        if (isExpoGo) {
            console.warn('Fitur notifikasi terbatas di Expo Go. Untuk pengalaman lengkap, gunakan development build.');
            return false;
        }

        await requestNotificationPermissions();
        await registerBackgroundTask();
        return true;
    } catch (error) {
        console.error("Gagal menyiapkan notifikasi:", error);
        return false;
    }
}

// Fungsi untuk memulai background task
export async function startBackgroundTask() {
    try {
        await registerBackgroundTask();
    } catch (error) {
        console.error('Error starting background task:', error);
    }
}

// Fungsi untuk menghentikan background task
export async function stopBackgroundTask() {
    try {
        await TaskManager.unregisterTaskAsync(BACKGROUND_TASK);
    } catch (error) {
        console.error('Error stopping background task:', error);
    }
} 