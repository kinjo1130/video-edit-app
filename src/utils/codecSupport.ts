/**
 * ブラウザがサポートするMediaRecorderのMIMEタイプを検出
 */

export function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log(`Using MIME type: ${type}`);
      return type;
    }
  }

  console.warn('No supported MIME type found, falling back to video/webm');
  return 'video/webm';
}

export function checkMediaRecorderSupport(): {
  supported: boolean;
  message?: string;
} {
  if (typeof MediaRecorder === 'undefined') {
    return {
      supported: false,
      message: 'お使いのブラウザはMediaRecorderをサポートしていません。Chrome、Firefox、またはSafari 14.1以降をご使用ください。',
    };
  }

  const mimeType = getSupportedMimeType();
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    return {
      supported: false,
      message: 'お使いのブラウザは動画録画に必要なコーデックをサポートしていません。',
    };
  }

  return { supported: true };
}
