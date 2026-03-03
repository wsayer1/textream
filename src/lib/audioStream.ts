let sharedStream: MediaStream | null = null;
let refCount = 0;

export async function acquireMicStream(): Promise<MediaStream> {
  if (sharedStream && sharedStream.active) {
    refCount++;
    return sharedStream;
  }
  sharedStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  refCount = 1;
  return sharedStream;
}

export function releaseMicStream(): void {
  refCount--;
  if (refCount <= 0) {
    if (sharedStream) {
      sharedStream.getTracks().forEach((t) => t.stop());
      sharedStream = null;
    }
    refCount = 0;
  }
}

export function getMicStream(): MediaStream | null {
  return sharedStream;
}
