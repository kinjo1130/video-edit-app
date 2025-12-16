import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { MosaicRegion } from '../types/mosaic';
import { VideoFile } from '../types/video';
import { TextOverlay } from '../types/textOverlay';

interface VideoEditorState {
  videoFile: VideoFile | null;
  mosaicRegions: MosaicRegion[];
  textOverlays: TextOverlay[];
  currentTime: number;
  isPlaying: boolean;
  selectedRegionId: string | null;
  selectedTextOverlayId: string | null;
  isProcessing: boolean;
  processingProgress: number;
}

type VideoEditorAction =
  | { type: 'SET_VIDEO_FILE'; payload: VideoFile | null }
  | { type: 'ADD_MOSAIC_REGION'; payload: MosaicRegion }
  | { type: 'UPDATE_MOSAIC_REGION'; payload: { id: string; updates: Partial<MosaicRegion> } }
  | { type: 'DELETE_MOSAIC_REGION'; payload: string }
  | { type: 'SELECT_REGION'; payload: string | null }
  | { type: 'ADD_TEXT_OVERLAY'; payload: TextOverlay }
  | { type: 'UPDATE_TEXT_OVERLAY'; payload: { id: string; updates: Partial<TextOverlay> } }
  | { type: 'DELETE_TEXT_OVERLAY'; payload: string }
  | { type: 'SELECT_TEXT_OVERLAY'; payload: string | null }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_PROCESSING'; payload: { isProcessing: boolean; progress?: number } };

const initialState: VideoEditorState = {
  videoFile: null,
  mosaicRegions: [],
  textOverlays: [],
  currentTime: 0,
  isPlaying: false,
  selectedRegionId: null,
  selectedTextOverlayId: null,
  isProcessing: false,
  processingProgress: 0,
};

function videoEditorReducer(
  state: VideoEditorState,
  action: VideoEditorAction
): VideoEditorState {
  switch (action.type) {
    case 'SET_VIDEO_FILE':
      return {
        ...state,
        videoFile: action.payload,
        mosaicRegions: [],
        textOverlays: [],
        currentTime: 0,
        selectedRegionId: null,
        selectedTextOverlayId: null,
      };

    case 'ADD_MOSAIC_REGION':
      return {
        ...state,
        mosaicRegions: [...state.mosaicRegions, action.payload],
        selectedRegionId: action.payload.id,
      };

    case 'UPDATE_MOSAIC_REGION':
      return {
        ...state,
        mosaicRegions: state.mosaicRegions.map((region) =>
          region.id === action.payload.id
            ? { ...region, ...action.payload.updates }
            : region
        ),
      };

    case 'DELETE_MOSAIC_REGION':
      return {
        ...state,
        mosaicRegions: state.mosaicRegions.filter(
          (region) => region.id !== action.payload
        ),
        selectedRegionId:
          state.selectedRegionId === action.payload ? null : state.selectedRegionId,
      };

    case 'SELECT_REGION':
      return {
        ...state,
        selectedRegionId: action.payload,
      };

    case 'ADD_TEXT_OVERLAY':
      return {
        ...state,
        textOverlays: [...state.textOverlays, action.payload],
        selectedTextOverlayId: action.payload.id,
      };

    case 'UPDATE_TEXT_OVERLAY':
      return {
        ...state,
        textOverlays: state.textOverlays.map((overlay) =>
          overlay.id === action.payload.id
            ? { ...overlay, ...action.payload.updates }
            : overlay
        ),
      };

    case 'DELETE_TEXT_OVERLAY':
      return {
        ...state,
        textOverlays: state.textOverlays.filter(
          (overlay) => overlay.id !== action.payload
        ),
        selectedTextOverlayId:
          state.selectedTextOverlayId === action.payload ? null : state.selectedTextOverlayId,
      };

    case 'SELECT_TEXT_OVERLAY':
      return {
        ...state,
        selectedTextOverlayId: action.payload,
      };

    case 'SET_CURRENT_TIME':
      return {
        ...state,
        currentTime: action.payload,
      };

    case 'SET_PLAYING':
      return {
        ...state,
        isPlaying: action.payload,
      };

    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload.isProcessing,
        processingProgress: action.payload.progress ?? state.processingProgress,
      };

    default:
      return state;
  }
}

interface VideoEditorContextType {
  state: VideoEditorState;
  dispatch: React.Dispatch<VideoEditorAction>;
}

const VideoEditorContext = createContext<VideoEditorContextType | undefined>(undefined);

export function VideoEditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(videoEditorReducer, initialState);

  return (
    <VideoEditorContext.Provider value={{ state, dispatch }}>
      {children}
    </VideoEditorContext.Provider>
  );
}

export function useVideoEditor() {
  const context = useContext(VideoEditorContext);
  if (context === undefined) {
    throw new Error('useVideoEditor must be used within a VideoEditorProvider');
  }
  return context;
}
