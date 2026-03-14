import { useState } from 'react';
import { BrowserWhisper } from 'browser-whisper';
import type { TranscriptSegment, TranscribeProgress } from 'browser-whisper';

export type Status = 'idle' | 'busy' | 'done' | 'error';

export interface ProgressState {
  stage: TranscribeProgress['stage'];
  percent: number;
}

export interface UseWhisperReturn {
  /** Transcribed segments, appended in real-time as they arrive. */
  segments: TranscriptSegment[];
  /** Current transcription status. */
  status: Status;
  /** Live progress info while busy, null otherwise. */
  progress: ProgressState | null;
  /** Error message when status === 'error'. */
  errorMsg: string;
  /** Name of the last file picked by the user. */
  fileName: string;
  /** Pass this to an <input type="file"> onChange handler. */
  transcribeFile: (file: File) => Promise<void>;
}

const whisper = new BrowserWhisper({ model: 'whisper-tiny' });

export function useWhisper(): UseWhisperReturn {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [fileName, setFileName] = useState('');

  async function transcribeFile(file: File) {
    setSegments([]);
    setErrorMsg('');
    setProgress(null);
    setFileName(file.name);
    setStatus('busy');

    try {
      for await (const seg of whisper.transcribe(file, {
        onProgress: (evt) =>
          setProgress({ stage: evt.stage, percent: Math.round(evt.progress * 100) }),
      })) {
        setSegments((prev) => [...prev, seg]);
      }
      setStatus('done');
    } catch (err) {
      setErrorMsg(String(err));
      setStatus('error');
    } finally {
      setProgress(null);
    }
  }

  return { segments, status, progress, errorMsg, fileName, transcribeFile };
}
