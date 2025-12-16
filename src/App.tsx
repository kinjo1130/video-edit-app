import { VideoEditorProvider, useVideoEditor } from './context/VideoEditorContext';
import { VideoUploader } from './components/VideoUploader/VideoUploader';
import { VideoPlayer } from './components/VideoPlayer/VideoPlayer';
import { Timeline } from './components/Timeline/Timeline';
import { MosaicManager } from './components/MosaicManager/MosaicManager';
import { TextOverlayManager } from './components/TextOverlayManager/TextOverlayManager';
import { ExportPanel } from './components/ExportPanel/ExportPanel';
import styles from './App.module.css';

function AppContent() {
  const { state } = useVideoEditor();

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>動画モザイク編集アプリ</h1>
          <p>MP4動画にモザイクをかけて書き出せます</p>
        </header>

        <div className={styles.content}>
          <VideoUploader />

          {state.videoFile && (
            <div className={styles.grid}>
              <div className={styles.leftColumn}>
                <VideoPlayer />
                <Timeline />
              </div>
              <div className={styles.rightColumn}>
                <MosaicManager />
                <TextOverlayManager />
                <ExportPanel />
              </div>
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <p>ブラウザ内でFFmpeg.wasmを使用して動画処理を行います</p>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <VideoEditorProvider>
      <AppContent />
    </VideoEditorProvider>
  );
}

export default App;
