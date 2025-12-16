/**
 * 動画ファイルから音声トラックを抽出
 */

export async function extractAudioTrack(
  videoElement: HTMLVideoElement
): Promise<MediaStreamTrack | null> {
  try {
    // AudioContextを作成
    const audioCtx = new AudioContext();

    // video要素から音声ソースを作成
    const source = audioCtx.createMediaElementSource(videoElement);

    // MediaStreamDestinationを作成
    const destination = audioCtx.createMediaStreamDestination();

    // 接続
    source.connect(destination);
    source.connect(audioCtx.destination);

    // 音声トラックを取得
    const audioTracks = destination.stream.getAudioTracks();

    if (audioTracks.length === 0) {
      console.warn('No audio track found in video');
      return null;
    }

    console.log('Audio track extracted successfully');
    return audioTracks[0];
  } catch (error) {
    console.error('Error extracting audio track:', error);
    return null;
  }
}

export async function createVideoElement(videoFile: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = false;
    video.crossOrigin = 'anonymous';

    video.onloadedmetadata = () => {
      console.log('Video metadata loaded:', {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
      resolve(video);
    };

    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };

    video.src = URL.createObjectURL(videoFile);
  });
}
