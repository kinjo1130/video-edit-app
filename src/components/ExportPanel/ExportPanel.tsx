import { useState, useCallback } from 'react';
import { useVideoEditor } from '../../context/VideoEditorContext';
import { useCanvasVideoProcessor } from '../../hooks/useCanvasVideoProcessor';
import { applyMosaicRegions } from '../../utils/videoProcessing';
import styles from './ExportPanel.module.css';

export function ExportPanel() {
  const { state, dispatch } = useVideoEditor();
  const { ready, error: processorError } = useCanvasVideoProcessor();
  const [processedVideo, setProcessedVideo] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    if (!ready || !state.videoFile || !state.videoFile.metadata) {
      setError('動画ファイルが準備できていません');
      return;
    }

    if (state.mosaicRegions.length === 0) {
      setError('モザイク領域が1つも設定されていません');
      return;
    }

    setError(null);
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 0 } });

    try {
      const outputBlob = await applyMosaicRegions(
        state.videoFile.file,
        state.mosaicRegions,
        state.textOverlays,
        state.videoFile.metadata,
        (progress) => {
          dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress } });
        }
      );

      setProcessedVideo(outputBlob);
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, progress: 100 } });
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : '動画の書き出しに失敗しました');
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, progress: 0 } });
    }
  }, [ready, state.videoFile, state.mosaicRegions, state.textOverlays, dispatch]);

  const handleDownload = useCallback(() => {
    if (!processedVideo) return;

    const url = URL.createObjectURL(processedVideo);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mosaic-video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [processedVideo]);

  const handleReset = useCallback(() => {
    setProcessedVideo(null);
    setError(null);
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, progress: 0 } });
  }, [dispatch]);

  if (!state.videoFile) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3>動画の書き出し</h3>
        <p className={styles.description}>
          モザイク処理を適用して動画を書き出します
        </p>
      </div>

      <div className={styles.content}>
        {!ready && (
          <div className={styles.ffmpegStatus}>
            {processorError || 'お使いのブラウザは動画処理をサポートしていません'}
          </div>
        )}

        {ready && !state.isProcessing && !processedVideo && (
          <button
            className={styles.exportButton}
            onClick={handleExport}
            disabled={state.mosaicRegions.length === 0}
          >
            <span>📹</span>
            <span>
              動画を書き出す ({state.mosaicRegions.length}個のモザイク, {state.textOverlays.length}個のテキスト)
            </span>
          </button>
        )}

        {state.isProcessing && (
          <div className={styles.loadingSection}>
            <div className={styles.spinner} />
            <div className={styles.loadingText}>動画を処理中...</div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${state.processingProgress}%` }}
              />
            </div>
            <div className={styles.progressText}>
              {state.processingProgress}%
            </div>
          </div>
        )}

        {processedVideo && (
          <div className={styles.successSection}>
            <div className={styles.successIcon}>✅</div>
            <div className={styles.successText}>
              動画の書き出しが完了しました！
            </div>
            <button className={styles.downloadButton} onClick={handleDownload}>
              ダウンロード
            </button>
            <button className={styles.resetButton} onClick={handleReset}>
              再度書き出し
            </button>
          </div>
        )}

        {error && (
          <div className={styles.errorSection}>
            <h4>エラー</h4>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
