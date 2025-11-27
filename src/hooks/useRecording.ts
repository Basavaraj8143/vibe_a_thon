import { useState, useRef } from 'react';
import { Audio } from 'expo-av';

export default function useRecording() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  async function start() {
    try {
      // Request permissions first
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') throw new Error('Audio permission not granted');

      // Stop any existing recording
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) { /* ignore already unloaded errors */ }
        recordingRef.current = null;
        setRecording(null);
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();

      recordingRef.current = rec;
      setRecording(rec);
      setIsRecording(true);
      return rec;
    } catch (err) {
      console.warn('Failed to start recording', err);
      setIsRecording(false);
      return null;
    }
  }

  async function stop() {
    const rec = recordingRef.current;
    if (!rec) {
      console.log('No recording ref found in stop()');
      return null;
    }

    try {
      await rec.stopAndUnloadAsync();
    } catch (err) {
      // Ignore "already unloaded" errors, but log others
      console.log('Stop recording cleanup:', err);
    }

    const uri = rec.getURI();
    recordingRef.current = null;
    setRecording(null);
    setIsRecording(false);
    return uri;
  }

  return { recording, isRecording, start, stop };
}
