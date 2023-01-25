import {
    JsrecoderInterface,
    constraints,
    audioStream,
    audioSource,
    audioContext,
    gainNode,
    analyzser,
    blob,
    mediaRecorder,
    mediaDeviceInfo,
    mediaStream,
    RecordOptions,
} from '~/types';

class Jsrecoder implements JsrecoderInterface {
    private constraints: constraints;
    private audioStream: audioStream;
    private audioSource: audioSource;
    private audioContext: audioContext;
    private gainNode: gainNode;
    private analyzser: analyzser;
    private blob: blob;
    private mediaRecorder!: mediaRecorder;
    private mediaDeviceInfo: mediaDeviceInfo;
    private mediaStream!: mediaStream;
    private recordOptions: RecordOptions | undefined;
    private worker: Worker;

    /**
     * Jsrecoder required audio and video constraints
     * @param constraints
     */

    constructor(constraints: constraints) {
        if (typeof window === 'undefined') {
            throw new Error('window is undefined');
        }

        if (constraints === undefined) {
            throw new Error('constraints is required');
        }

        this.constraints = constraints;

        this.worker = new Worker(new URL('./worker', import.meta.url));
    }

    /**
     * MediaDeviceInfo is a list of available media input and output devices.
     * @returns MediaDeviceInfo
     */
    private async enumarateDevice(): Promise<MediaDeviceInfo[]> {
        return await navigator.mediaDevices.enumerateDevices();
    }
    /**
     * MediaStream represents a stream of media content.
     * @returns MediaStream
     */
    private async getUserMedia(): Promise<any> {
        return await navigator.mediaDevices.getUserMedia(this.constraints);
    }

    /**
     * MediaDeviceInfo list of media inputs are available .
     * @returns MediaDeviceInfo
     */
    public async getMediaDeviceInfo(): Promise<MediaDeviceInfo[] | undefined> {
        try {
            if (this.mediaDeviceInfo === undefined) {
                this.mediaDeviceInfo = await this.enumarateDevice();
            }
            return this.mediaDeviceInfo;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Change audio input device
     * @param deviceId
     */
    public async changeMediaStream(deviceId: string): Promise<void> {
        if (deviceId === '' || deviceId === undefined) {
            throw new Error('deviceId is required');
        }

        if (this.mediaDeviceInfo !== undefined) {
            const index = this.mediaDeviceInfo.findIndex(
                (device: any) => device.deviceId === deviceId
            );

            if (index === -1) {
                throw new Error('deviceId is not found');
            }
        }

        this.constraints.audio = {
            deviceId: deviceId,
        };

        try {
            this.mediaStream = await this.getUserMedia();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Start recording audio and video
     * @param recordOptions mimeType
     * @returns void
     */
    public async startRecording(recordOption?: RecordOptions): Promise<void> {
        try {
            if (recordOption !== undefined) {
                this.recordOptions = recordOption;
            }
            this.mediaStream = await this.getUserMedia();

            const mimeType = this.mediaRecorderingMimeType();

            this.mediaRecorder = new MediaRecorder(this.mediaStream, {
                mimeType: mimeType,
            });
            this.mediaRecorder.ondataavailable = this.dataAvailable;
            this.mediaRecorder.start();
        } catch (error) {
            throw error;
        }
    }

    private mediaRecorderingMimeType(): string {
        let codec: string = '';
        if (
            typeof this.constraints.audio === 'boolean' &&
            typeof this.constraints.video === 'boolean'
        ) {
            if (this.constraints.audio && this.constraints.video) {
                codec = 'video/webm;codecs=vp8';
            } else {
                if (this.constraints.audio) {
                    codec = 'audio/webm;codecs=opus';
                } else if (this.constraints.video) {
                    codec = 'video/webm;codecs=vp8';
                }
            }
        } else {
            if (
                Object.keys(this.constraints.audio).length > 0 &&
                Object.keys(this.constraints.video).length > 0
            ) {
                codec = 'video/webm;codecs=vp8';
            } else {
                if (this.constraints.video) {
                    codec = 'video/webm;codecs=vp8';
                } else if (this.constraints.audio) {
                    codec = 'audio/webm;codecs=opus';
                } else {
                    throw new Error('constraints is required');
                }
            }
        }

        return codec;
    }

    private dataAvailable(event: BlobEvent) {
        if (event.data.size > 0) {
            const worker = new Worker(new URL('./worker', import.meta.url));

            const video = document.createElement('video');
            video.src = URL.createObjectURL(new Blob([event.data]));
            video.controls = true;
            document.body.appendChild(video);
            worker.postMessage({
                blob: event.data,
            });

            worker.onmessage = (event: MessageEvent) => {
                // this.blob = event.data;
                const { blob } = event.data;
                if (blob) {
                    // const url = URL.createObjectURL(blob);
                    // const audio = new Audio(url);
                    // audio.play();
                }
            };
        }
    }

    private convertToWav(blob: any) {
        const buffer = new ArrayBuffer(44 + blob.byteLength);
        const view = new DataView(buffer);

        /* RIFF identifier */
        this.writeString(view, 0, 'RIFF');
        /* file length */
        view.setUint32(4, 32 + blob.byteLength, true);
        /* RIFF type */
        this.writeString(view, 8, 'WAVE');
        /* format chunk identifier */
        this.writeString(view, 12, 'fmt ');
        /* format chunk length */
        view.setUint32(16, 16, true);
        /* sample format (raw) */
        view.setUint16(20, 1, true);
        /* channel count */
        view.setUint16(22, 1, true);
        /* sample rate */
        view.setUint32(24, 44100, true);
        /* byte rate (sample rate * block align) */
        view.setUint32(28, 44100 * 4, true);
        /* block align (channel count * bytes per sample) */
        view.setUint16(32, 4, true);
        /* bits per sample */
        view.setUint16(34, 16, true);
        /* data chunk identifier */
        this.writeString(view, 36, 'data');
        /* data chunk length */
        view.setUint32(40, blob.byteLength, true);

        const audioBuffer = new Uint8Array(blob);
        for (let i = 0; i < audioBuffer.length; i++) {
            view.setUint8(i + 44, audioBuffer[i]);
        }

        return view;
    }

    private writeString(view: DataView, offset: number, string: string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    /**
     * Stop recording audio and video
     */
    public stopRecording(): void {
        try {
            if (this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
                this.mediaStream
                    .getTracks()
                    .forEach((track: any) => track.stop());
            }
        } catch (error) {
            throw error;
        }
    }
}

// module.exports = Jsrecoder;
export default Jsrecoder;
