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

type constraints = {
    audio: boolean | AudioOptions;
    video: boolean | VideoOptions;
};

interface RecordOptions {
    mimeType?: string;
}

type audioStream = MediaStream | undefined;
type audioSource = MediaStreamAudioSourceNode | undefined;
type audioContext = AudioContext | undefined;
type gainNode = GainNode | undefined;
type analyzser = AnalyserNode | undefined;
type blob = Blob | undefined;
type mediaRecorder = MediaRecorder;
type mediaDeviceInfo = MediaDeviceInfo[] | undefined;
type mediaStream = MediaStream;

interface JsrecoderInterface {
    getMediaDeviceInfo(): Promise<mediaDeviceInfo>;

    startRecording(recordOptions?: RecordOptions): Promise<void>;
}
