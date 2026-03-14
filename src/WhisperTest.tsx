import { useRef, useEffect } from 'react';
import type { TranscribeProgress } from 'browser-whisper';
import { useWhisper } from './hooks/useWhisper';
import { formatTime } from './utils/formatTime';

const STAGE_LABEL: Record<TranscribeProgress['stage'], string> = {
  loading: 'Loading model',
  decoding: 'Decoding audio',
  transcribing: 'Transcribing',
  done: 'Done',
};

export function WhisperTest() {
  const { segments, status, progress, errorMsg, fileName, transcribeFile } = useWhisper();
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest segment as it arrives
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [segments]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) transcribeFile(file);
  }

  function copyTranscript() {
    navigator.clipboard.writeText(segments.map((s) => s.text).join(' '));
  }

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
          onChange={handleFileChange}
          disabled={status === 'busy'}
          style={{ display: 'none' }}
        />
        <span className="whisper-dropzone-icon">🎙</span>
        {status === 'busy' ? (
          <span>Processing <strong>{fileName}</strong>…</span>
        ) : (
          <span>{fileName ? 'Pick a different file' : 'Click to choose an audio or video file'}</span>
        )}
      </label>

      {/* Progress bar */}
      {progress && (
        <div className="whisper-progress-wrap">
          <div className="whisper-progress-label">
            <span>{STAGE_LABEL[progress.stage]}</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="whisper-progress-track">
            <div className="whisper-progress-bar" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      )}

      {/* Transcript */}
      {segments.length > 0 && (
        <div className="whisper-transcript">
          <div className="whisper-transcript-header">
            <span>Transcript</span>
            {status === 'done' && (
              <button className="whisper-copy-btn" onClick={copyTranscript}>
                Copy text
              </button>
            )}
          </div>
          <div className="whisper-segments">
            {segments.map((seg, i) => (
              <div key={i} className="whisper-segment">
                <span className="whisper-timestamp">{formatTime(seg.start)}</span>
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
