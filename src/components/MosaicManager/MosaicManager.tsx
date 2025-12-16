import { useCallback, useState } from 'react';
import { useVideoEditor } from '../../context/VideoEditorContext';
import { MosaicRegion } from '../../types/mosaic';
import { formatTime, parseTime } from '../../utils/timeFormatting';
import styles from './MosaicManager.module.css';

export function MosaicManager() {
  const { state, dispatch } = useVideoEditor();
  const [timeErrors, setTimeErrors] = useState<Record<string, string>>({});

  const handleTimeChange = useCallback((regionId: string, field: 'start' | 'end', value: string) => {
    const region = state.mosaicRegions.find(r => r.id === regionId);
    if (!region) return;

    try {
      const newTime = parseTime(value);
      const duration = state.videoFile?.metadata?.duration || 0;

      // バリデーション
      if (field === 'start' && newTime >= region.endTime - 0.1) {
        setTimeErrors(prev => ({...prev, [regionId]: '開始時刻は終了時刻より前である必要があります'}));
        return;
      }
      if (field === 'end' && newTime <= region.startTime + 0.1) {
        setTimeErrors(prev => ({...prev, [regionId]: '終了時刻は開始時刻より後である必要があります'}));
        return;
      }
      if (newTime < 0 || newTime > duration) {
        setTimeErrors(prev => ({...prev, [regionId]: '時刻は動画の範囲内である必要があります'}));
        return;
      }

      // 正常な場合、更新
      const fieldName = field === 'start' ? 'startTime' : 'endTime';
      dispatch({
        type: 'UPDATE_MOSAIC_REGION',
        payload: { id: regionId, updates: { [fieldName]: newTime } }
      });
      setTimeErrors(prev => ({...prev, [regionId]: ''}));
    } catch (error) {
      setTimeErrors(prev => ({...prev, [regionId]: '無効な時刻形式です (MM:SS.MS)'}));
    }
  }, [state.mosaicRegions, state.videoFile?.metadata?.duration, dispatch]);

  const handlePositionChange = useCallback((regionId: string, field: 'x' | 'y' | 'width' | 'height', value: string) => {
    const numValue = parseFloat(value) / 100; // パーセントから0-1に変換

    // バリデーション
    if (isNaN(numValue) || numValue < 0 || numValue > 1) return;

    dispatch({
      type: 'UPDATE_MOSAIC_REGION',
      payload: { id: regionId, updates: { [field]: numValue } }
    });
  }, [dispatch]);

  const handleAddRegion = useCallback(() => {
    if (!state.videoFile?.metadata) return;

    const duration = state.videoFile.metadata.duration;
    const newRegion: MosaicRegion = {
      id: `region-${Date.now()}`,
      x: 0.3,
      y: 0.3,
      width: 0.4,
      height: 0.4,
      startTime: state.currentTime,
      endTime: Math.min(state.currentTime + 5, duration),
    };

    dispatch({ type: 'ADD_MOSAIC_REGION', payload: newRegion });
  }, [state.videoFile?.metadata, state.currentTime, dispatch]);

  const handleSelectRegion = useCallback(
    (regionId: string) => {
      dispatch({ type: 'SELECT_REGION', payload: regionId });
    },
    [dispatch]
  );

  const handleDeleteRegion = useCallback(
    (e: React.MouseEvent, regionId: string) => {
      e.stopPropagation();
      dispatch({ type: 'DELETE_MOSAIC_REGION', payload: regionId });
    },
    [dispatch]
  );

  if (!state.videoFile) return null;

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h3>モザイク領域 ({state.mosaicRegions.length})</h3>
        <button className={styles.addButton} onClick={handleAddRegion}>
          <span>+</span>
          <span>追加</span>
        </button>
      </div>

      {state.mosaicRegions.length === 0 ? (
        <div className={styles.emptyMessage}>
          動画上でドラッグしてモザイク領域を作成するか、
          <br />
          「追加」ボタンをクリックしてください
        </div>
      ) : (
        <div className={styles.list}>
          {state.mosaicRegions.map((region, index) => {
            const isSelected = region.id === state.selectedRegionId;

            return (
              <div
                key={region.id}
                className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                onClick={() => handleSelectRegion(region.id)}
              >
                <div className={styles.itemHeader}>
                  <span className={styles.itemTitle}>Region {index + 1}</span>
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => handleDeleteRegion(e, region.id)}
                  >
                    削除
                  </button>
                </div>

                <div className={styles.itemDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>開始時刻:</span>
                    <input
                      type="text"
                      className={styles.timeInput}
                      value={formatTime(region.startTime)}
                      onBlur={(e) => handleTimeChange(region.id, 'start', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>終了時刻:</span>
                    <input
                      type="text"
                      className={styles.timeInput}
                      value={formatTime(region.endTime)}
                      onBlur={(e) => handleTimeChange(region.id, 'end', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {timeErrors[region.id] && (
                    <div className={styles.errorMessage}>
                      {timeErrors[region.id]}
                    </div>
                  )}
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>X位置(%):</span>
                    <input
                      type="number"
                      className={styles.numberInput}
                      min="0"
                      max="100"
                      step="0.1"
                      value={(region.x * 100).toFixed(1)}
                      onChange={(e) => handlePositionChange(region.id, 'x', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Y位置(%):</span>
                    <input
                      type="number"
                      className={styles.numberInput}
                      min="0"
                      max="100"
                      step="0.1"
                      value={(region.y * 100).toFixed(1)}
                      onChange={(e) => handlePositionChange(region.id, 'y', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>幅(%):</span>
                    <input
                      type="number"
                      className={styles.numberInput}
                      min="0"
                      max="100"
                      step="0.1"
                      value={(region.width * 100).toFixed(1)}
                      onChange={(e) => handlePositionChange(region.id, 'width', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>高さ(%):</span>
                    <input
                      type="number"
                      className={styles.numberInput}
                      min="0"
                      max="100"
                      step="0.1"
                      value={(region.height * 100).toFixed(1)}
                      onChange={(e) => handlePositionChange(region.id, 'height', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
