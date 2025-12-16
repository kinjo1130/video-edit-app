import { useRef, useEffect, useCallback } from 'react';
import { useVideoEditor } from '../../context/VideoEditorContext';
import { RegionSelector } from '../RegionSelector/RegionSelector';
import { formatTime } from '../../utils/timeFormatting';
import styles from './VideoPlayer.module.css';

export function VideoPlayer() {
  const { state, dispatch } = useVideoEditor();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      dispatch({ type: 'SET_CURRENT_TIME', payload: video.currentTime });
    };

    const handlePlay = () => {
      dispatch({ type: 'SET_PLAYING', payload: true });
    };

    const handlePause = () => {
      dispatch({ type: 'SET_PLAYING', payload: false });
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [dispatch]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (state.isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  }, [state.isPlaying]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video || !state.videoFile?.metadata) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * state.videoFile.metadata.duration;

      video.currentTime = newTime;
      dispatch({ type: 'SET_CURRENT_TIME', payload: newTime });
    },
    [state.videoFile?.metadata, dispatch]
  );

  if (!state.videoFile) {
    return null;
  }

  const duration = state.videoFile.metadata?.duration || 0;
  const progress = duration > 0 ? (state.currentTime / duration) * 100 : 0;

  return (
    <div className={styles.container}>
      <div className={styles.videoWrapper}>
        <video ref={videoRef} src={state.videoFile.url} className={styles.video} />
        <RegionSelector videoRef={videoRef} />
      </div>

      <div className={styles.controls}>
        <button className={styles.playButton} onClick={togglePlay}>
          {state.isPlaying ? '⏸' : '▶'}
        </button>

        <span className={styles.timeDisplay}>
          {formatTime(state.currentTime)} / {formatTime(duration)}
        </span>

        <div className={styles.seekBar} onClick={handleSeek}>
          <div className={styles.seekProgress} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={styles.instructions}>
        {state.selectedTextOverlayId
          ? 'クリックでテキストの位置を変更できます'
          : state.selectedRegionId
          ? 'ドラッグでモザイク領域のサイズを変更できます'
          : 'ドラッグで新しいモザイク領域を作成できます'}
      </div>
    </div>
  );
}
