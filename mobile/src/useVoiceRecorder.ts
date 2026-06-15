import { useRef } from 'react'
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio'
import * as FileSystem from 'expo-file-system/legacy'

// Обгортка над expo-audio: запис голосової нотатки у форматі .m4a.
export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const state = useAudioRecorderState(recorder)
  const startedAt = useRef(0)

  const start = async (): Promise<boolean> => {
    const perm = await requestRecordingPermissionsAsync()
    if (!perm.granted) return false
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
    await recorder.prepareToRecordAsync()
    recorder.record()
    startedAt.current = Date.now()
    return true
  }

  const stop = async (): Promise<{ uri: string; durationSec: number } | null> => {
    await recorder.stop()
    const uri = recorder.uri
    if (!uri) return null
    const durationSec = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000))
    return { uri, durationSec }
  }

  return { isRecording: state.isRecording, durationMillis: state.durationMillis, start, stop }
}

// Зчитує файл запису у base64 для відправки на сервер.
export async function readBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, { encoding: 'base64' })
}

export const formatClock = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
