export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export function parseTime(timeString: string): number {
  const [mins, secsAndMs] = timeString.split(':');
  const [secs, ms] = secsAndMs.split('.');
  return parseInt(mins) * 60 + parseInt(secs) + parseInt(ms || '0') / 100;
}
