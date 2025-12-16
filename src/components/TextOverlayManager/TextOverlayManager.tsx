import { useCallback, useState } from 'react';
import { useVideoEditor } from '../../context/VideoEditorContext';
import { TextOverlay } from '../../types/textOverlay';
import { formatTime, parseTime } from '../../utils/timeFormatting';
import styles from './TextOverlayManager.module.css';

export function TextOverlayManager() {
  const { state, dispatch } = useVideoEditor();
  const [timeErrors, setTimeErrors] = useState<Record<string, string>>({});

  const handleAddText = useCallback(() => {
    if (!state.videoFile?.metadata) return;

    const duration = state.videoFile.metadata.duration;
    const newOverlay: TextOverlay = {
      id: `text-${Date.now()}`,
      text: '',
      x: 0.1,
      y: 0.1,
      startTime: state.currentTime,
      endTime: Math.min(state.currentTime + 5, duration),
      fontSize: 32,
      fontColor: '#FFFFFF',
    };

    dispatch({ type: 'ADD_TEXT_OVERLAY', payload: newOverlay });
  }, [state.videoFile?.metadata, state.currentTime, dispatch]);

  const handleUpdateText = useCallback((id: string, updates: Partial<TextOverlay>) => {
    dispatch({ type: 'UPDATE_TEXT_OVERLAY', payload: { id, updates } });
  }, [dispatch]);

  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch({ type: 'DELETE_TEXT_OVERLAY', payload: id });
  }, [dispatch]);

  const handleSelectText = useCallback((id: string) => {
    dispatch({ type: 'SELECT_TEXT_OVERLAY', payload: id });
  }, [dispatch]);

  const handleTimeChange = useCallback((overlayId: string, field: 'start' | 'end', value: string) => {
    const overlay = state.textOverlays.find(o => o.id === overlayId);
    if (!overlay) return;

    try {
      const newTime = parseTime(value);
      const duration = state.videoFile?.metadata?.duration || 0;

      // バリデーション
      if (field === 'start' && newTime >= overlay.endTime - 0.1) {
        setTimeErrors(prev => ({...prev, [overlayId]: '開始時刻は終了時刻より前である必要があります'}));
        return;
      }
      if (field === 'end' && newTime <= overlay.startTime + 0.1) {
        setTimeErrors(prev => ({...prev, [overlayId]: '終了時刻は開始時刻より後である必要があります'}));
        return;
      }
      if (newTime < 0 || newTime > duration) {
        setTimeErrors(prev => ({...prev, [overlayId]: '時刻は動画の範囲内である必要があります'}));
        return;
      }

      // 正常な場合、更新
      const fieldName = field === 'start' ? 'startTime' : 'endTime';
      dispatch({
        type: 'UPDATE_TEXT_OVERLAY',
        payload: { id: overlayId, updates: { [fieldName]: newTime } }
      });
      setTimeErrors(prev => ({...prev, [overlayId]: ''}));
    } catch (error) {
      setTimeErrors(prev => ({...prev, [overlayId]: '無効な時刻形式です (MM:SS.MS)'}));
    }
  }, [state.textOverlays, state.videoFile?.metadata?.duration, dispatch]);

  const handlePositionChange = useCallback((overlayId: string, field: 'x' | 'y', value: string) => {
    const numValue = parseFloat(value) / 100;

    if (isNaN(numValue) || numValue < 0 || numValue > 1) return;

    dispatch({
      type: 'UPDATE_TEXT_OVERLAY',
      payload: { id: overlayId, updates: { [field]: numValue } }
    });
  }, [dispatch]);

  if (!state.videoFile) return null;

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h3>テキストオーバーレイ ({state.textOverlays.length})</h3>
        <button className={styles.addButton} onClick={handleAddText}>
          <span>+</span>
          <span>追加</span>
        </button>
      </div>

      {state.textOverlays.length === 0 ? (
        <div className={styles.emptyMessage}>
          「追加」ボタンをクリックしてテキストを追加してください
        </div>
      ) : (
        <div className={styles.list}>
          {state.textOverlays.map((overlay, index) => {
            const isSelected = overlay.id === state.selectedTextOverlayId;

            return (
              <div
                key={overlay.id}
                className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                onClick={() => handleSelectText(overlay.id)}
              >
                <div className={styles.itemHeader}>
                  <span className={styles.itemTitle}>Text {index + 1}</span>
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => handleDelete(e, overlay.id)}
                  >
                    削除
                  </button>
                </div>

                <div className={styles.itemDetails}>
                  <div className={styles.textRow}>
                    <span className={styles.detailLabel}>テキスト:</span>
                    <textarea
                      className={styles.textArea}
                      value={overlay.text}
                      onChange={(e) => handleUpdateText(overlay.id, { text: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="ここにテキストを入力してください"
                      rows={4}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>開始時刻:</span>
                    <input
                      type="text"
                      className={styles.timeInput}
                      value={formatTime(overlay.startTime)}
                      onBlur={(e) => handleTimeChange(overlay.id, 'start', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>終了時刻:</span>
                    <input
                      type="text"
                      className={styles.timeInput}
                      value={formatTime(overlay.endTime)}
                      onBlur={(e) => handleTimeChange(overlay.id, 'end', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {timeErrors[overlay.id] && (
                    <div className={styles.errorMessage}>
                      {timeErrors[overlay.id]}
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
                      value={(overlay.x * 100).toFixed(1)}
                      onChange={(e) => handlePositionChange(overlay.id, 'x', e.target.value)}
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
                      value={(overlay.y * 100).toFixed(1)}
                      onChange={(e) => handlePositionChange(overlay.id, 'y', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>フォントサイズ:</span>
                    <input
                      type="range"
                      className={styles.rangeInput}
                      min="12"
                      max="72"
                      value={overlay.fontSize}
                      onChange={(e) => handleUpdateText(overlay.id, { fontSize: Number(e.target.value) })}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={styles.rangeValue}>{overlay.fontSize}px</span>
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>色:</span>
                    <input
                      type="color"
                      className={styles.colorInput}
                      value={overlay.fontColor}
                      onChange={(e) => handleUpdateText(overlay.id, { fontColor: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={styles.colorValue}>{overlay.fontColor}</span>
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
