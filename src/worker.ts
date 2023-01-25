const worker = self.addEventListener('message', (event: MessageEvent) => {
    const { blob } = event.data;
    //check if blob
    if (blob) {
        const reader = new FileReader();
        reader.readAsArrayBuffer(blob);
        reader.onload = (event: ProgressEvent) => {
            const fr = event.target as FileReader;
            const buffer = fr.result as ArrayBuffer;
            const wav = convertToWav(buffer);

            self.postMessage({
                blob: wav,
            });
        };
    }
});

/**
 * Convert the ArrayBuffer to a wav file
 */
const convertToWav = (buffer: ArrayBuffer): Blob => {
    const viewLen = new DataView(buffer);
    const channels = 2;
    const sampleRate = 44100;
    const bitsPerSample = 16;
    const length = viewLen.byteLength;
    const buff = new ArrayBuffer(44 + length);
    const view = new DataView(buff);
    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* file length */
    view.setUint32(4, 32 + length, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, channels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 4, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 4, true);
    /* bits per sample */
    view.setUint16(34, bitsPerSample, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, length, true);
    const audioBuffer = new Uint8Array(buffer);
    for (let i = 0; i < audioBuffer.length; i++) {
        view.setUint8(i + 44, audioBuffer[i]);
    }
    /**Write the PCM sample */
    for (let i = 0; i < length; i++) {
        view.setUint8(i + 44, viewLen.getUint8(i));
    }

    return new Blob([view], { type: 'audio/wav' });
};

export default worker;
