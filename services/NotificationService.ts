import AsyncStorage from '@react-native-async-storage/async-storage';
import { createCanvas } from 'canvas';
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

// Fungsi untuk membuat gambar notifikasi
async function createNotificationImage(data: any) {
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(0, 0, width, height);

    // Header
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Pengingat KGB', width / 2, 60);

    // Content
    ctx.font = '24px Arial';
    if (data.length === 1) {
        const employee = data[0];
        ctx.fillText(`${employee.nama}`, width / 2, 150);
        ctx.fillText(`NIP: ${employee.nip}`, width / 2, 190);
        ctx.fillText(`KGB Berikutnya: ${employee.kgbBerikutnya}`, width / 2, 230);
    } else {
        ctx.fillText(`Ada ${data.length} pegawai yang waktunya KGB`, width / 2, 150);
        ctx.font = '20px Arial';
        data.slice(0, 3).forEach((employee: any, index: number) => {
            ctx.fillText(`${employee.nama} - ${employee.nip}`, width / 2, 200 + (index * 40));
        });
        if (data.length > 3) {
            ctx.fillText(`...dan ${data.length - 3} pegawai lainnya`, width / 2, 320);
        }
    }

    // Footer
    ctx.font = '16px Arial';
    ctx.fillText('BNN Reminder', width / 2, height - 30);

    return canvas.toBuffer('image/png');
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

        // Buat gambar notifikasi
        const imageBuffer = await createNotificationImage(waktunyaKGB);
        const imageBase64 = imageBuffer.toString('base64');

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                attachments: [{
                    url: `data:image/png;base64,${imageBase64}`,
                    thumbnailClipArea: { x: 0, y: 0, width: 1, height: 1 },
                    identifier: 'kgb-reminder',
                    type: 'image/png'
                }]
            },
            trigger: {
                seconds: 60 * 15, // 15 menit
                repeats: true,
                channelId: 'default'
            },
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