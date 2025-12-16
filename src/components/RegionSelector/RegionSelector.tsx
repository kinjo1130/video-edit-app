import { useRef, useEffect, useCallback, useState, MouseEvent } from 'react';
import { useVideoEditor } from '../../context/VideoEditorContext';
import { MosaicRegion } from '../../types/mosaic';
import styles from './RegionSelector.module.css';

interface RegionSelectorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  videoDimensions: { width: number; height: number };
}

export function RegionSelector({ videoRef, videoDimensions }: RegionSelectorProps) {
  const { state, dispatch } = useVideoEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<DOMRect | null>(null);

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
    if (isDragging && dragStart && currentRect) {
      ctx.strokeStyle = '#4CAF50';
      ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
      ctx.lineWidth = 2;
      ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
    }
  }, [state.mosaicRegions, state.textOverlays, state.currentTime, state.selectedRegionId, state.selectedTextOverlayId, isDragging, dragStart, currentRect, videoRef]);

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

      // 選択中のテキストがある場合はクリックで移動（D&Dしない）
      if (state.selectedTextOverlayId) {
        return;
      }

      setIsDragging(true);
      setDragStart(coords);
      setCurrentRect({ x: coords.x, y: coords.y, width: 0, height: 0 });
    },
    [getCanvasCoordinates, state.selectedTextOverlayId]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !dragStart) return;

      const coords = getCanvasCoordinates(e);
      const width = coords.x - dragStart.x;
      const height = coords.y - dragStart.y;

      setCurrentRect({
        x: width < 0 ? coords.x : dragStart.x,
        y: height < 0 ? coords.y : dragStart.y,
        width: Math.abs(width),
        height: Math.abs(height),
      });
    },
    [isDragging, dragStart, getCanvasCoordinates]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !currentRect || currentRect.width < 10 || currentRect.height < 10) {
      setIsDragging(false);
      setDragStart(null);
      setCurrentRect(null);
      return;
    }

    const normalized = normalizeCoordinates(
      currentRect.x,
      currentRect.y,
      currentRect.width,
      currentRect.height
    );

    const duration = state.videoFile?.metadata?.duration || 10;

    // 選択中のモザイク領域がある場合は、その領域を更新
    if (state.selectedRegionId) {
      dispatch({
        type: 'UPDATE_MOSAIC_REGION',
        payload: {
          id: state.selectedRegionId,
          updates: {
            x: normalized.x,
            y: normalized.y,
            width: normalized.width,
            height: normalized.height,
          },
        },
      });
    } else {
      // 新しいモザイク領域を作成
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
    }

    setIsDragging(false);
    setDragStart(null);
    setCurrentRect(null);
  }, [
    isDragging,
    currentRect,
    normalizeCoordinates,
    state.videoFile?.metadata?.duration,
    state.currentTime,
    state.selectedRegionId,
    dispatch,
  ]);

  const handleCanvasClick = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      if (isDragging) return;

      const coords = getCanvasCoordinates(e);
      const canvas = canvasRef.current;
      if (!canvas) return;

      // 選択中のテキストオーバーレイがある場合は、クリックした位置に移動
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
          return;
        }
      }

      // Deselect if clicked outside
      dispatch({ type: 'SELECT_REGION', payload: null });
      dispatch({ type: 'SELECT_TEXT_OVERLAY', payload: null });
    },
    [isDragging, getCanvasCoordinates, state.mosaicRegions, state.textOverlays, state.selectedTextOverlayId, dispatch]
  );

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleCanvasClick}
    />
  );
}
