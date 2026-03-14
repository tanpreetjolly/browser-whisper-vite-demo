import { useState, useRef, useEffect } from 'react';
import { BrowserWhisper } from 'browser-whisper';
import type { TranscriptSegment, TranscribeProgress } from 'browser-whisper';

const whisper = new BrowserWhisper({ model: 'whisper-tiny' });

interface ProgressState {
  stage: TranscribeProgress['stage'];
  percent: number;
}

export function WhisperTest() {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fileName, setFileName] = useState('');
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [segments]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

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
        setSegments(prev => [...prev, seg]);
      }
      setStatus('done');
    } catch (err) {
      setErrorMsg(String(err));
      setStatus('error');
    } finally {
      setProgress(null);
    }
  }

  const stageLabel: Record<TranscribeProgress['stage'], string> = {
    loading: 'Loading model',
    decoding: 'Decoding audio',
    transcribing: 'Transcribing',
    done: 'Done',
  };

  return (
    <div className="whisper-root">
      {/* Header */}
      <div className="whisper-header">
        <h1 className="whisper-title">Browser Whisper</h1>
        <p className="whisper-subtitle">Local speech-to-text, runs entirely in your browser</p>
      </div>

      {/* Upload zone */}
      <label className={`whisper-dropzone${status === 'busy' ? ' whisper-dropzone--busy' : ''}`}>
        <input
          type="file"
          accept="audio/*,video/*"
          onChange={handleFile}
          disabled={status === 'busy'}
          style={{ display: 'none' }}
        />
        <span className="whisper-dropzone-icon">🎙</span>
        {status === 'busy' ? (
          <span>Processing <strong>{fileName}</strong>…</span>
        ) : (
          <span>
            {fileName ? `Pick a different file` : 'Click to choose an audio or video file'}
          </span>
        )}
      </label>

      {/* Progress bar */}
      {progress && (
        <div className="whisper-progress-wrap">
          <div className="whisper-progress-label">
            <span>{stageLabel[progress.stage]}</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="whisper-progress-track">
            <div
              className="whisper-progress-bar"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Transcript */}
      {segments.length > 0 && (
        <div className="whisper-transcript">
          <div className="whisper-transcript-header">
            <span>Transcript</span>
            {status === 'done' && (
              <button
                className="whisper-copy-btn"
                onClick={() =>
                  navigator.clipboard.writeText(segments.map(s => s.text).join(' '))
                }
              >
                Copy text
              </button>
            )}
          </div>
          <div className="whisper-segments">
            {segments.map((seg, i) => (
              <div key={i} className="whisper-segment">
                <span className="whisper-timestamp">
                  {formatTime(seg.start)}
                </span>
                <span className="whisper-text">{seg.text}</span>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="whisper-error">
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {/* Idle hint */}
      {status === 'idle' && (
        <p className="whisper-hint">
          Supports MP3, WAV, M4A, MP4, WebM and more · Model downloads on first use (~30 MB)
        </p>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
