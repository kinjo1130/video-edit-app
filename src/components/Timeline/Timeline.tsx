import { useCallback, useRef, useState, MouseEvent } from 'react';
import { useVideoEditor } from '../../context/VideoEditorContext';
import { formatTime } from '../../utils/timeFormatting';
import styles from './Timeline.module.css';

export function Timeline() {
  const { state, dispatch } = useVideoEditor();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggingHandle, setDraggingHandle] = useState<{
    id: string;
    type: 'start' | 'end' | 'move';
    category: 'mosaic' | 'text';
    initialTime?: number;
    initialStartTime?: number;
    initialEndTime?: number;
  } | null>(null);

  const duration = state.videoFile?.metadata?.duration || 0;

  const getTimeFromX = useCallback(
    (x: number) => {
      const timeline = timelineRef.current;
      if (!timeline) return 0;

      const rect = timeline.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      return percentage * duration;
    },
    [duration]
  );

  const handleRulerClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newTime = getTimeFromX(x);
      dispatch({ type: 'SET_CURRENT_TIME', payload: newTime });
    },
    [getTimeFromX, dispatch]
  );

  const handleHandleMouseDown = useCallback(
    (e: MouseEvent, id: string, type: 'start' | 'end' | 'move', category: 'mosaic' | 'text') => {
      e.stopPropagation();

      if (type === 'move') {
        const rect = timelineRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const initialTime = getTimeFromX(x);

        if (category === 'mosaic') {
          const region = state.mosaicRegions.find((r) => r.id === id);
          if (region) {
            setDraggingHandle({
              id,
              type,
              category,
              initialTime,
              initialStartTime: region.startTime,
              initialEndTime: region.endTime
            });
          }
        } else {
          const overlay = state.textOverlays.find((t) => t.id === id);
          if (overlay) {
            setDraggingHandle({
              id,
              type,
              category,
              initialTime,
              initialStartTime: overlay.startTime,
              initialEndTime: overlay.endTime
            });
          }
        }
      } else {
        setDraggingHandle({ id, type, category });
      }
    },
    [getTimeFromX, state.mosaicRegions, state.textOverlays]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!draggingHandle || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newTime = getTimeFromX(x);

      if (draggingHandle.category === 'mosaic') {
        const region = state.mosaicRegions.find((r) => r.id === draggingHandle.id);
        if (!region) return;

        if (draggingHandle.type === 'start') {
          const clampedTime = Math.max(0, Math.min(newTime, region.endTime - 0.1));
          dispatch({
            type: 'UPDATE_MOSAIC_REGION',
            payload: {
              id: region.id,
              updates: { startTime: clampedTime },
            },
          });
        } else if (draggingHandle.type === 'end') {
          const clampedTime = Math.max(region.startTime + 0.1, Math.min(newTime, duration));
          dispatch({
            type: 'UPDATE_MOSAIC_REGION',
            payload: {
              id: region.id,
              updates: { endTime: clampedTime },
            },
          });
        } else if (draggingHandle.type === 'move' && draggingHandle.initialTime !== undefined) {
          const delta = newTime - draggingHandle.initialTime;
          const regionDuration = (draggingHandle.initialEndTime || 0) - (draggingHandle.initialStartTime || 0);
          let newStart = (draggingHandle.initialStartTime || 0) + delta;
          let newEnd = (draggingHandle.initialEndTime || 0) + delta;

          // 範囲内に収める
          if (newStart < 0) {
            newStart = 0;
            newEnd = regionDuration;
          }
          if (newEnd > duration) {
            newEnd = duration;
            newStart = duration - regionDuration;
          }

          dispatch({
            type: 'UPDATE_MOSAIC_REGION',
            payload: {
              id: region.id,
              updates: { startTime: newStart, endTime: newEnd },
            },
          });
        }
      } else {
        const overlay = state.textOverlays.find((t) => t.id === draggingHandle.id);
        if (!overlay) return;

        if (draggingHandle.type === 'start') {
          const clampedTime = Math.max(0, Math.min(newTime, overlay.endTime - 0.1));
          dispatch({
            type: 'UPDATE_TEXT_OVERLAY',
            payload: {
              id: overlay.id,
              updates: { startTime: clampedTime },
            },
          });
        } else if (draggingHandle.type === 'end') {
          const clampedTime = Math.max(overlay.startTime + 0.1, Math.min(newTime, duration));
          dispatch({
            type: 'UPDATE_TEXT_OVERLAY',
            payload: {
              id: overlay.id,
              updates: { endTime: clampedTime },
            },
          });
        } else if (draggingHandle.type === 'move' && draggingHandle.initialTime !== undefined) {
          const delta = newTime - draggingHandle.initialTime;
          const overlayDuration = (draggingHandle.initialEndTime || 0) - (draggingHandle.initialStartTime || 0);
          let newStart = (draggingHandle.initialStartTime || 0) + delta;
          let newEnd = (draggingHandle.initialEndTime || 0) + delta;

          // 範囲内に収める
          if (newStart < 0) {
            newStart = 0;
            newEnd = overlayDuration;
          }
          if (newEnd > duration) {
            newEnd = duration;
            newStart = duration - overlayDuration;
          }

          dispatch({
            type: 'UPDATE_TEXT_OVERLAY',
            payload: {
              id: overlay.id,
              updates: { startTime: newStart, endTime: newEnd },
            },
          });
        }
      }
    },
    [draggingHandle, getTimeFromX, state.mosaicRegions, state.textOverlays, duration, dispatch]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingHandle(null);
  }, []);

  const handleMosaicTrackClick = useCallback(
    (regionId: string) => {
      dispatch({ type: 'SELECT_REGION', payload: regionId });
    },
    [dispatch]
  );

  const handleTextTrackClick = useCallback(
    (overlayId: string) => {
      dispatch({ type: 'SELECT_TEXT_OVERLAY', payload: overlayId });
    },
    [dispatch]
  );

  const renderRuler = () => {
    const ticks = [];
    const majorTickInterval = duration > 60 ? 10 : 5;
    const minorTickInterval = duration > 60 ? 2 : 1;

    for (let i = 0; i <= duration; i += minorTickInterval) {
      const isMajor = i % majorTickInterval === 0;
      const left = `${(i / duration) * 100}%`;

      ticks.push(
        <div
          key={i}
          className={`${styles.tick} ${isMajor ? styles.major : styles.minor}`}
          style={{ left }}
        >
          {isMajor && (
            <div className={styles.tickLabel}>{formatTime(i).split('.')[0]}</div>
          )}
        </div>
      );
    }

    return ticks;
  };

  if (!state.videoFile) return null;

  const playheadPosition = (state.currentTime / duration) * 100;

  return (
    <div className={styles.timeline}>
      <div
        ref={timelineRef}
        className={styles.ruler}
        onClick={handleRulerClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {renderRuler()}
        <div className={styles.playhead} style={{ left: `${playheadPosition}%` }}>
          <div className={styles.playheadHandle} />
        </div>
      </div>

      <div
        className={styles.tracks}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {state.mosaicRegions.length === 0 && state.textOverlays.length === 0 ? (
          <div className={styles.emptyMessage}>
            モザイク領域やテキストを追加すると、ここにタイムラインが表示されます
          </div>
        ) : (
          <>
            {state.mosaicRegions.length > 0 && (
              <div className={styles.trackSection}>
                <div className={styles.sectionLabel}>モザイク</div>
                {state.mosaicRegions.map((region, index) => {
                  const startPercent = (region.startTime / duration) * 100;
                  const widthPercent =
                    ((region.endTime - region.startTime) / duration) * 100;
                  const isSelected = region.id === state.selectedRegionId;

                  return (
                    <div
                      key={region.id}
                      className={`${styles.track} ${isSelected ? styles.selected : ''}`}
                      onClick={() => handleMosaicTrackClick(region.id)}
                    >
                      <span className={styles.trackLabel}>Mosaic {index + 1}</span>
                      <div
                        className={`${styles.trackBar} ${isSelected ? styles.selected : ''}`}
                        style={{
                          left: `${startPercent}%`,
                          width: `${widthPercent}%`,
                          cursor: 'grab',
                        }}
                        onMouseDown={(e) => handleHandleMouseDown(e, region.id, 'move', 'mosaic')}
                      >
                        <div
                          className={`${styles.handle} ${styles.left} ${isSelected ? styles.selected : ''}`}
                          onMouseDown={(e) => handleHandleMouseDown(e, region.id, 'start', 'mosaic')}
                        />
                        <div
                          className={`${styles.handle} ${styles.right} ${isSelected ? styles.selected : ''}`}
                          onMouseDown={(e) => handleHandleMouseDown(e, region.id, 'end', 'mosaic')}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {state.textOverlays.length > 0 && (
              <div className={styles.trackSection}>
                <div className={styles.sectionLabel}>テキスト</div>
                {state.textOverlays.map((overlay, index) => {
                  const startPercent = (overlay.startTime / duration) * 100;
                  const widthPercent =
                    ((overlay.endTime - overlay.startTime) / duration) * 100;
                  const isSelected = overlay.id === state.selectedTextOverlayId;

                  return (
                    <div
                      key={overlay.id}
                      className={`${styles.track} ${styles.textTrack} ${isSelected ? styles.selected : ''}`}
                      onClick={() => handleTextTrackClick(overlay.id)}
                    >
                      <span className={styles.trackLabel}>Text {index + 1}</span>
                      <div
                        className={`${styles.trackBar} ${styles.textBar} ${isSelected ? styles.selected : ''}`}
                        style={{
                          left: `${startPercent}%`,
                          width: `${widthPercent}%`,
                          cursor: 'grab',
                        }}
                        onMouseDown={(e) => handleHandleMouseDown(e, overlay.id, 'move', 'text')}
                      >
                        <div
                          className={`${styles.handle} ${styles.left} ${isSelected ? styles.selected : ''}`}
                          onMouseDown={(e) => handleHandleMouseDown(e, overlay.id, 'start', 'text')}
                        />
                        <div
                          className={`${styles.handle} ${styles.right} ${isSelected ? styles.selected : ''}`}
                          onMouseDown={(e) => handleHandleMouseDown(e, overlay.id, 'end', 'text')}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
