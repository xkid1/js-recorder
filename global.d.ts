interface AudioOptions {
    deviceId?: string;
    echoCancellation?: boolean;
    autoGainControl?: boolean;
    noiseSuppression?: boolean;
    latency?: number;
    sampleRate?: number;
}

interface VideoOptions {
    deviceId?: string;
    width?: number;
    height?: number;
    frameRate?: number;
    facingMode?: string;
}

export type constraints = {
    audio: boolean | AudioOptions;
    video: boolean | VideoOptions;
};

export type audioStream = MediaStream | undefined;
export type audioSource = MediaStreamAudioSourceNode | undefined;
export type audioContext = AudioContext | undefined;
export type gainNode = GainNode | undefined;
export type analyzser = AnalyserNode | undefined;
export type blob = Blob | undefined;
export type mediaRecorder = MediaRecorder | undefined;
export type mediaDeviceInfo = MediaDeviceInfo[] | undefined;

export type mediaStream = MediaStream | undefined;

export interface JsrecoderInterface {
    getMediaDeviceInfo(): Promise<mediaDeviceInfo>;
}
