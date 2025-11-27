import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Pressable, StatusBar } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SMS from 'expo-sms';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';
import SOSButton from '../components/SOSButton';
import { sendTwilioSMS, makeTwilioCall } from '../utils/twilio';
import useRecording from '../hooks/useRecording';
import useShake from '../hooks/useShake';

export default function HomeScreen({ navigation }: any) {
    const { start: startRecording, stop: stopRecording, isRecording } = useRecording();
    const [tapCount, setTapCount] = useState(0);
    const [contactCount, setContactCount] = useState(0);
    const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isProcessingRef = useRef(false);

    // Load contact count on focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', async () => {
            const raw = await AsyncStorage.getItem('contacts');
            const contacts = raw ? JSON.parse(raw) : [];
            setContactCount(contacts.length);
        });
        return unsubscribe;
    }, [navigation]);

    // Shake Listener (Custom Hook)
    useShake(() => {
        console.log('Shake detected!');
        triggerSOS();
    });

    // Reset tap count if no tap for 1 second
    useEffect(() => {
        if (tapCount > 0) {
            if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
            tapTimeoutRef.current = setTimeout(() => {
                setTapCount(0);
            }, 1000);
        }

        if (tapCount >= 3) {
            triggerSOS();
            setTapCount(0);
            if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
        }
    }, [tapCount]);

    const handleScreenTap = () => {
        setTapCount(prev => prev + 1);
    };

    async function triggerSOS() {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        Alert.alert('SOS Triggered!', 'Sending alerts & Starting Recording...');

        try {
            // 1) get location
            const { status } = await Location.requestForegroundPermissionsAsync();
            let location: Location.LocationObject | null = null;
            if (status === 'granted') {
                location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
            }

            // 2) start audio recording
            const rec = await startRecording();
            if (!rec) {
                Alert.alert('Recording Failed', 'Could not start audio recording. Check permissions.');
                isProcessingRef.current = false;
                return;
            }

            // 3) load emergency contacts from AsyncStorage
            const raw = await AsyncStorage.getItem('contacts');
            const contacts = raw ? JSON.parse(raw) : [];

            // 4) build SMS body
            const lat = location?.coords.latitude?.toFixed(6);
            const lon = location?.coords.longitude?.toFixed(6);
            const bodyParts = [
                'SilentSOS Alert!',
                lat && lon ? `Location: https://www.google.com/maps/search/?api=1&query=${lat},${lon}` : 'Location: unavailable',
                'I may need help. This is an automated alert.',
                `Time: ${new Date().toLocaleString()}`
            ];
            const body = bodyParts.filter(Boolean).join('\n');

            // 5) Send SMS & Make Calls using Twilio
            if (contacts.length === 0) {
                Alert.alert('No contacts set', 'Please add emergency contacts first.');
            } else {
                let sentCount = 0;
                let callCount = 0;

                for (const contact of contacts) {
                    if (contact.phone) {
                        // Send SMS
                        const smsSuccess = await sendTwilioSMS(contact.phone, body);
                        if (smsSuccess) sentCount++;

                        // Make Call
                        const callSuccess = await makeTwilioCall(contact.phone, 'This is a Silent SOS Alert. I need help. Please check your messages for my location.');
                        if (callSuccess) callCount++;
                    }
                }

                if (sentCount > 0 || callCount > 0) {
                    Alert.alert('Success', `SOS sent to ${sentCount} contacts. Initiated ${callCount} calls.`);
                } else {
                    // Fallback to expo-sms if Twilio fails (Text only)
                    const numbers = contacts.map((c: any) => c.phone);
                    const isAvailable = await SMS.isAvailableAsync();
                    if (isAvailable && numbers.length > 0) {
                        await SMS.sendSMSAsync(numbers, body);
                    }
                }
            }

            // Stop recording after 10s and Open SMS App with Audio
            setTimeout(async () => {
                try {
                    const uri = await stopRecording();
                    if (uri) {
                        // Convert file:// to content:// for Android security
                        const contentUri = await FileSystem.getContentUriAsync(uri);

                        // Get contacts again
                        const raw = await AsyncStorage.getItem('contacts');
                        const contacts = raw ? JSON.parse(raw) : [];
                        const numbers = contacts.map((c: any) => c.phone);

                        const isAvailable = await SMS.isAvailableAsync();
                        if (isAvailable && numbers.length > 0) {
                            await SMS.sendSMSAsync(numbers, 'Here is the audio evidence.', {
                                attachments: {
                                    uri: contentUri,
                                    mimeType: 'audio/m4a',
                                    filename: 'evidence.m4a',
                                },
                            });
                        } else {
                            // Fallback to Share Sheet if no contacts or SMS not available
                            const canShare = await Sharing.isAvailableAsync();
                            if (canShare) {
                                await Sharing.shareAsync(uri, {
                                    mimeType: 'audio/m4a',
                                    dialogTitle: 'Share Audio Evidence',
                                    UTI: 'public.mpeg-4-audio'
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error in recording timeout:", e);
                    Alert.alert("Error sharing audio", "Could not attach audio file.");
                } finally {
                    isProcessingRef.current = false;
                }
            }, 10_000);

        } catch (err) {
            console.error(err);
            Alert.alert('Error triggering SOS', String(err));
            isProcessingRef.current = false;
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <Pressable style={styles.container} onPress={handleScreenTap}>

                <View style={styles.header}>
                    <Text style={styles.title}>SILENT<Text style={{ color: '#FF3B30' }}>SOS</Text></Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>ARMED</Text>
                    </View>
                </View>

                <View style={styles.statusRow}>
                    <View style={styles.statusCard}>
                        <Text style={styles.label}>CONTACTS</Text>
                        <Text style={styles.value}>{contactCount}</Text>
                    </View>
                    <View style={styles.statusCard}>
                        <Text style={styles.label}>LOCATION</Text>
                        <Text style={styles.value}>ACTIVE</Text>
                    </View>
                </View>

                <View style={styles.centerContent}>
                    <SOSButton onPress={() => triggerSOS()} />

                    <Text style={styles.instruction}>
                        {tapCount > 0 ? `TAPS DETECTED: ${tapCount}/3` : 'TRIPLE TAP OR SHAKE'}
                    </Text>

                    {isRecording && (
                        <View style={styles.recordingIndicator}>
                            <View style={styles.recordingDot} />
                            <Text style={styles.recordingText}>RECORDING AUDIO...</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate('Contacts')}>
                    <Text style={styles.footerButtonText}>MANAGE EMERGENCY CONTACTS</Text>
                </TouchableOpacity>

            </Pressable>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    container: { flex: 1, padding: 24, justifyContent: 'space-between' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    title: { fontSize: 28, fontWeight: '900', color: '#000000', letterSpacing: 1 },
    badge: { backgroundColor: 'rgba(255, 59, 48, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 59, 48, 0.3)' },
    badgeText: { color: '#FF3B30', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },

    statusRow: { flexDirection: 'row', gap: 12, marginTop: 30 },
    statusCard: { flex: 1, backgroundColor: '#F5F5F5', padding: 16, borderRadius: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    label: { color: '#666', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
    value: { color: '#000', fontSize: 18, fontWeight: 'bold' },

    centerContent: { alignItems: 'center', justifyContent: 'center', flex: 1 },
    instruction: { color: '#888', fontSize: 14, letterSpacing: 2, marginTop: 20, fontWeight: '600' },

    recordingIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 16, backgroundColor: '#FFE5E5', padding: 8, borderRadius: 8, paddingHorizontal: 16 },
    recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30', marginRight: 8 },
    recordingText: { color: '#FF3B30', fontSize: 12, fontWeight: 'bold' },

    footerButton: { backgroundColor: '#F5F5F5', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
    footerButtonText: { color: '#333', fontWeight: '700', fontSize: 14, letterSpacing: 1 },
});
