import { useRef, useEffect, useCallback, useState, MouseEvent } from 'react';
import { useVideoEditor } from '../../context/VideoEditorContext';
import { MosaicRegion } from '../../types/mosaic';
import styles from './RegionSelector.module.css';

type DragMode = 'none' | 'create' | 'move' | 'resize';
type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | null;

const HANDLE_SIZE = 8;

interface RegionSelectorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function RegionSelector({ videoRef }: RegionSelectorProps) {
  const { state, dispatch } = useVideoEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [draggedRegionId, setDraggedRegionId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [cursorStyle, setCursorStyle] = useState<string>('crosshair');

  const getCanvasCoordinates = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const normalizeCoordinates = useCallback(
    (x: number, y: number, width: number, height: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0, width: 0, height: 0 };

      return {
        x: x / canvas.width,
        y: y / canvas.height,
        width: width / canvas.width,
        height: height / canvas.height,
      };
    },
    []
  );

  // 領域のピクセル座標を取得
  const getRegionPixelCoords = useCallback(
    (region: MosaicRegion) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0, width: 0, height: 0 };
      return {
        x: region.x * canvas.width,
        y: region.y * canvas.height,
        width: region.width * canvas.width,
        height: region.height * canvas.height,
      };
    },
    []
  );

  // 座標がリサイズハンドル上にあるかチェック
  const getResizeHandle = useCallback(
    (coords: { x: number; y: number }, region: MosaicRegion): ResizeHandle => {
      const rect = getRegionPixelCoords(region);
      const halfHandle = HANDLE_SIZE / 2;

      // 北西 (左上)
      if (
        coords.x >= rect.x - halfHandle &&
        coords.x <= rect.x + halfHandle &&
        coords.y >= rect.y - halfHandle &&
        coords.y <= rect.y + halfHandle
      ) {
        return 'nw';
      }
      // 北東 (右上)
      if (
        coords.x >= rect.x + rect.width - halfHandle &&
        coords.x <= rect.x + rect.width + halfHandle &&
        coords.y >= rect.y - halfHandle &&
        coords.y <= rect.y + halfHandle
      ) {
        return 'ne';
      }
      // 南西 (左下)
      if (
        coords.x >= rect.x - halfHandle &&
        coords.x <= rect.x + halfHandle &&
        coords.y >= rect.y + rect.height - halfHandle &&
        coords.y <= rect.y + rect.height + halfHandle
      ) {
        return 'sw';
      }
      // 南東 (右下)
      if (
        coords.x >= rect.x + rect.width - halfHandle &&
        coords.x <= rect.x + rect.width + halfHandle &&
        coords.y >= rect.y + rect.height - halfHandle &&
        coords.y <= rect.y + rect.height + halfHandle
      ) {
        return 'se';
      }
      return null;
    },
    [getRegionPixelCoords]
  );

  // 座標が領域内部にあるかチェック
  const isInsideRegion = useCallback(
    (coords: { x: number; y: number }, region: MosaicRegion): boolean => {
      const rect = getRegionPixelCoords(region);
      return (
        coords.x >= rect.x &&
        coords.x <= rect.x + rect.width &&
        coords.y >= rect.y &&
        coords.y <= rect.y + rect.height
      );
    },
    [getRegionPixelCoords]
  );

  // 座標にある領域を見つける
  const findRegionAtCoords = useCallback(
    (coords: { x: number; y: number }): MosaicRegion | null => {
      for (const region of state.mosaicRegions) {
        if (isInsideRegion(coords, region)) {
          return region;
        }
      }
      return null;
    },
    [state.mosaicRegions, isInsideRegion]
  );

  const drawRegions = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing mosaic regions
    state.mosaicRegions.forEach((region) => {
      const x = region.x * canvas.width;
      const y = region.y * canvas.height;
      const width = region.width * canvas.width;
      const height = region.height * canvas.height;

      // Check if region is active at current time
      const isActive =
        state.currentTime >= region.startTime && state.currentTime <= region.endTime;
      const isSelected = region.id === state.selectedRegionId;

      // Set styles based on state
      if (isSelected) {
        ctx.strokeStyle = '#FF9800';
        ctx.fillStyle = 'rgba(255, 152, 0, 0.2)';
      } else if (isActive) {
        ctx.strokeStyle = '#2196F3';
        ctx.fillStyle = 'rgba(33, 150, 243, 0.2)';
      } else {
        ctx.strokeStyle = '#999';
        ctx.fillStyle = 'rgba(153, 153, 153, 0.1)';
      }

      ctx.lineWidth = 2;
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);

      // Draw region label
      ctx.fillStyle = isSelected ? '#FF9800' : '#2196F3';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Mosaic ${state.mosaicRegions.indexOf(region) + 1}`, x + 4, y + 16);

      // Draw resize handles for selected region
      if (isSelected) {
        const halfHandle = HANDLE_SIZE / 2;
        ctx.fillStyle = '#FF9800';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;

        // 四隅にハンドルを描画
        const handles = [
          { x: x - halfHandle, y: y - halfHandle }, // nw
          { x: x + width - halfHandle, y: y - halfHandle }, // ne
          { x: x - halfHandle, y: y + height - halfHandle }, // sw
          { x: x + width - halfHandle, y: y + height - halfHandle }, // se
        ];

        handles.forEach((handle) => {
          ctx.fillRect(handle.x, handle.y, HANDLE_SIZE, HANDLE_SIZE);
          ctx.strokeRect(handle.x, handle.y, HANDLE_SIZE, HANDLE_SIZE);
        });
      }
    });

    // Draw text overlays
    state.textOverlays.forEach((overlay) => {
      const x = overlay.x * canvas.width;
      const y = overlay.y * canvas.height;
      const isActive =
        state.currentTime >= overlay.startTime && state.currentTime <= overlay.endTime;
      const isSelected = overlay.id === state.selectedTextOverlayId;

      // Draw text position marker
      const markerSize = 40;
      if (isSelected) {
        ctx.strokeStyle = '#FF9800';
        ctx.fillStyle = 'rgba(255, 152, 0, 0.3)';
      } else if (isActive) {
        ctx.strokeStyle = '#4CAF50';
        ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
      } else {
        ctx.strokeStyle = '#999';
        ctx.fillStyle = 'rgba(153, 153, 153, 0.1)';
      }

      ctx.lineWidth = 2;
      ctx.fillRect(x - markerSize / 2, y - markerSize / 2, markerSize, markerSize);
      ctx.strokeRect(x - markerSize / 2, y - markerSize / 2, markerSize, markerSize);

      // Draw T icon
      ctx.fillStyle = isSelected ? '#FF9800' : '#4CAF50';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('T', x, y);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'top';

      // Draw text preview
      if (overlay.text && isActive) {
        ctx.fillStyle = overlay.fontColor || '#FFFFFF';
        ctx.font = `${overlay.fontSize}px sans-serif`;
        ctx.fillText(overlay.text.substring(0, 20), x, y + markerSize / 2 + 5);
      }
    });

    // Draw current dragging rectangle
    if (dragMode !== 'none' && currentRect) {
      ctx.strokeStyle = '#4CAF50';
      ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
      ctx.lineWidth = 2;
      ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
    }
  }, [state.mosaicRegions, state.textOverlays, state.currentTime, state.selectedRegionId, state.selectedTextOverlayId, dragMode, currentRect, videoRef]);

  useEffect(() => {
    drawRegions();
  }, [drawRegions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const resizeCanvas = () => {
      const rect = video.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      drawRegions();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [videoRef, drawRegions]);

  const handleMouseDown = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const coords = getCanvasCoordinates(e);

      // 1. 選択中の領域のリサイズハンドルをチェック
      if (state.selectedRegionId) {
        const selectedRegion = state.mosaicRegions.find(r => r.id === state.selectedRegionId);
        if (selectedRegion) {
          const handle = getResizeHandle(coords, selectedRegion);
          if (handle) {
            setDragMode('resize');
            setDraggedRegionId(selectedRegion.id);
            setResizeHandle(handle);
            setDragStart(coords);
            const rect = getRegionPixelCoords(selectedRegion);
            setCurrentRect(rect);
            return;
          }
        }
      }

      // 2. 既存領域の内部をチェック（移動モード）
      const regionAtCoords = findRegionAtCoords(coords);
      if (regionAtCoords) {
        dispatch({ type: 'SELECT_REGION', payload: regionAtCoords.id });
        dispatch({ type: 'SELECT_TEXT_OVERLAY', payload: null });
        setDragMode('move');
        setDraggedRegionId(regionAtCoords.id);
        setDragStart(coords);
        const rect = getRegionPixelCoords(regionAtCoords);
        setCurrentRect(rect);
        return;
      }

      // 3. 選択中のテキストがある場合は新規作成しない（クリックで移動するため）
      if (state.selectedTextOverlayId) {
        return;
      }

      // 4. 空白領域の場合は新規作成モード
      setDragMode('create');
      setDragStart(coords);
      setCurrentRect({ x: coords.x, y: coords.y, width: 0, height: 0 });
    },
    [getCanvasCoordinates, state.selectedTextOverlayId, state.selectedRegionId, state.mosaicRegions, getResizeHandle, getRegionPixelCoords, findRegionAtCoords, dispatch]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const coords = getCanvasCoordinates(e);

      // カーソル更新（ドラッグ中でないとき）
      if (dragMode === 'none') {
        // 選択中の領域のリサイズハンドルをチェック
        if (state.selectedRegionId) {
          const selectedRegion = state.mosaicRegions.find(r => r.id === state.selectedRegionId);
          if (selectedRegion) {
            const handle = getResizeHandle(coords, selectedRegion);
            if (handle) {
              const cursorMap: Record<string, string> = {
                nw: 'nw-resize',
                ne: 'ne-resize',
                sw: 'sw-resize',
                se: 'se-resize',
              };
              setCursorStyle(cursorMap[handle]);
              return;
            }
          }
        }

        // 領域内部ならmoveカーソル
        const regionAtCoords = findRegionAtCoords(coords);
        if (regionAtCoords) {
          setCursorStyle('move');
          return;
        }

        setCursorStyle('crosshair');
        return;
      }

      if (!dragStart || !currentRect) return;

      const deltaX = coords.x - dragStart.x;
      const deltaY = coords.y - dragStart.y;

      if (dragMode === 'create') {
        // 新規作成モード：矩形を描画
        setCurrentRect({
          x: deltaX < 0 ? coords.x : dragStart.x,
          y: deltaY < 0 ? coords.y : dragStart.y,
          width: Math.abs(deltaX),
          height: Math.abs(deltaY),
        });
      } else if (dragMode === 'move' && draggedRegionId) {
        // 移動モード：領域全体を移動
        const region = state.mosaicRegions.find(r => r.id === draggedRegionId);
        if (region) {
          const origRect = getRegionPixelCoords(region);
          setCurrentRect({
            x: origRect.x + deltaX,
            y: origRect.y + deltaY,
            width: origRect.width,
            height: origRect.height,
          });
        }
      } else if (dragMode === 'resize' && draggedRegionId && resizeHandle) {
        // リサイズモード：ハンドルに応じてサイズ変更
        const region = state.mosaicRegions.find(r => r.id === draggedRegionId);
        if (region) {
          const origRect = getRegionPixelCoords(region);
          let newRect = { ...origRect };

          switch (resizeHandle) {
            case 'nw':
              newRect.x = origRect.x + deltaX;
              newRect.y = origRect.y + deltaY;
              newRect.width = origRect.width - deltaX;
              newRect.height = origRect.height - deltaY;
              break;
            case 'ne':
              newRect.y = origRect.y + deltaY;
              newRect.width = origRect.width + deltaX;
              newRect.height = origRect.height - deltaY;
              break;
            case 'sw':
              newRect.x = origRect.x + deltaX;
              newRect.width = origRect.width - deltaX;
              newRect.height = origRect.height + deltaY;
              break;
            case 'se':
              newRect.width = origRect.width + deltaX;
              newRect.height = origRect.height + deltaY;
              break;
          }

          // 最小サイズを保証
          if (newRect.width < 20) {
            newRect.width = 20;
            if (resizeHandle === 'nw' || resizeHandle === 'sw') {
              newRect.x = origRect.x + origRect.width - 20;
            }
          }
          if (newRect.height < 20) {
            newRect.height = 20;
            if (resizeHandle === 'nw' || resizeHandle === 'ne') {
              newRect.y = origRect.y + origRect.height - 20;
            }
          }

          setCurrentRect(newRect);
        }
      }
    },
    [dragMode, dragStart, currentRect, draggedRegionId, resizeHandle, getCanvasCoordinates, state.selectedRegionId, state.mosaicRegions, getResizeHandle, getRegionPixelCoords, findRegionAtCoords]
  );

  const handleMouseUp = useCallback(() => {
    if (dragMode === 'none') return;

    // 新規作成モードで小さすぎる場合はキャンセル
    if (dragMode === 'create' && (!currentRect || currentRect.width < 10 || currentRect.height < 10)) {
      setDragMode('none');
      setDragStart(null);
      setCurrentRect(null);
      setDraggedRegionId(null);
      setResizeHandle(null);
      return;
    }

    if (!currentRect) {
      setDragMode('none');
      setDragStart(null);
      setCurrentRect(null);
      setDraggedRegionId(null);
      setResizeHandle(null);
      return;
    }

    const normalized = normalizeCoordinates(
      currentRect.x,
      currentRect.y,
      currentRect.width,
      currentRect.height
    );

    if (dragMode === 'create') {
      // 新しいモザイク領域を作成
      const duration = state.videoFile?.metadata?.duration || 10;
      const newRegion: MosaicRegion = {
        id: `region-${Date.now()}`,
        x: normalized.x,
        y: normalized.y,
        width: normalized.width,
        height: normalized.height,
        startTime: state.currentTime,
        endTime: Math.min(state.currentTime + 5, duration),
      };
      dispatch({ type: 'ADD_MOSAIC_REGION', payload: newRegion });
    } else if ((dragMode === 'move' || dragMode === 'resize') && draggedRegionId) {
      // 移動またはリサイズの場合は領域を更新
      dispatch({
        type: 'UPDATE_MOSAIC_REGION',
        payload: {
          id: draggedRegionId,
          updates: {
            x: normalized.x,
            y: normalized.y,
            width: normalized.width,
            height: normalized.height,
          },
        },
      });
    }

    setDragMode('none');
    setDragStart(null);
    setCurrentRect(null);
    setDraggedRegionId(null);
    setResizeHandle(null);
  }, [
    dragMode,
    currentRect,
    draggedRegionId,
    normalizeCoordinates,
    state.videoFile?.metadata?.duration,
    state.currentTime,
    dispatch,
  ]);

  const handleCanvasClick = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      if (dragMode !== 'none') return;

      const coords = getCanvasCoordinates(e);
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Find clicked mosaic region
      for (const region of state.mosaicRegions) {
        const x = region.x * canvas.width;
        const y = region.y * canvas.height;
        const width = region.width * canvas.width;
        const height = region.height * canvas.height;

        if (
          coords.x >= x &&
          coords.x <= x + width &&
          coords.y >= y &&
          coords.y <= y + height
        ) {
          dispatch({ type: 'SELECT_REGION', payload: region.id });
          dispatch({ type: 'SELECT_TEXT_OVERLAY', payload: null });
          return;
        }
      }

      // Find clicked text overlay
      const markerSize = 40;
      for (const overlay of state.textOverlays) {
        const x = overlay.x * canvas.width;
        const y = overlay.y * canvas.height;

        if (
          coords.x >= x - markerSize / 2 &&
          coords.x <= x + markerSize / 2 &&
          coords.y >= y - markerSize / 2 &&
          coords.y <= y + markerSize / 2
        ) {
          dispatch({ type: 'SELECT_TEXT_OVERLAY', payload: overlay.id });
          dispatch({ type: 'SELECT_REGION', payload: null });
          return;
        }
      }

      // 選択中のテキストオーバーレイがある場合は、空白領域クリックでテキストを移動
      if (state.selectedTextOverlayId) {
        const normalizedX = coords.x / canvas.width;
        const normalizedY = coords.y / canvas.height;

        dispatch({
          type: 'UPDATE_TEXT_OVERLAY',
          payload: {
            id: state.selectedTextOverlayId,
            updates: {
              x: normalizedX,
              y: normalizedY,
            },
          },
        });
        return;
      }

      // Deselect if clicked outside
      dispatch({ type: 'SELECT_REGION', payload: null });
      dispatch({ type: 'SELECT_TEXT_OVERLAY', payload: null });
    },
    [dragMode, getCanvasCoordinates, state.mosaicRegions, state.textOverlays, state.selectedTextOverlayId, dispatch]
  );

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      style={{ cursor: cursorStyle }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleCanvasClick}
    />
  );
}
