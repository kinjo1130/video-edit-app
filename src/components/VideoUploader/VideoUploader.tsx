import { useCallback, useState, DragEvent, ChangeEvent } from 'react';
import { useVideoEditor } from '../../context/VideoEditorContext';
import { useVideoMetadata } from '../../hooks/useVideoMetadata';
import { formatTime } from '../../utils/timeFormatting';
import styles from './VideoUploader.module.css';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function VideoUploader() {
  const { state, dispatch } = useVideoEditor();
  const { extractMetadata } = useVideoMetadata();
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file type
      if (!file.type.startsWith('video/mp4')) {
        setError('MP4形式の動画のみアップロード可能です');
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError('ファイルサイズは100MB以下にしてください');
        return;
      }

      try {
        const metadata = await extractMetadata(file);
        const url = URL.createObjectURL(file);

        dispatch({
          type: 'SET_VIDEO_FILE',
          payload: {
            file,
            url,
            metadata,
          },
        });
      } catch (err) {
        setError('動画のメタデータ取得に失敗しました');
        console.error(err);
      }
    },
    [dispatch, extractMetadata]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleReplaceClick = useCallback(() => {
    dispatch({ type: 'SET_VIDEO_FILE', payload: null });
    setError(null);
  }, [dispatch]);

  if (state.videoFile) {
    const { file, metadata } = state.videoFile;

    return (
      <div className={styles.uploader}>
        <div className={styles.videoInfo}>
          <h3>動画情報</h3>
          <div className={styles.infoRow}>
            <span className={styles.label}>ファイル名:</span>
            <span className={styles.value}>{file.name}</span>
          </div>
          {metadata && (
            <>
              <div className={styles.infoRow}>
                <span className={styles.label}>長さ:</span>
                <span className={styles.value}>{formatTime(metadata.duration)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>解像度:</span>
                <span className={styles.value}>
                  {metadata.width} × {metadata.height}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>サイズ:</span>
                <span className={styles.value}>
                  {(metadata.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </>
          )}
          <button className={styles.replaceButton} onClick={handleReplaceClick}>
            別の動画を選択
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.uploader}>
      <div
        className={`${styles.dropZone} ${isDragActive ? styles.dragActive : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <div className={styles.icon}>📹</div>
        <div className={styles.text}>
          動画をドラッグ&ドロップ、またはクリックして選択
        </div>
        <div className={styles.subtext}>MP4形式、最大100MB</div>
        <input
          id="fileInput"
          type="file"
          accept="video/mp4"
          onChange={handleChange}
        />
      </div>
      {error && (
        <div style={{ marginTop: '12px', color: '#f44336', fontSize: '14px' }}>
          {error}
        </div>
      )}
    </div>
  );
}
