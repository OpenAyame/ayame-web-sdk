import { VideoCodecOption } from './connection/options';
/**
 * @ignore
 */
export declare function randomString(strLength: number): string;
/**
 * @ignore
 */
export declare function browser(): string;
/**
 * @ignore
 */
export declare function traceLog(title: string, value?: string | Record<string, any>): void;
/** @private */
export declare function getVideoCodecsFromString(codec: VideoCodecOption, codecs: Array<any>): Array<any>;
/**
 * @ignore
 */
export declare function removeCodec(sdp: string, codec: VideoCodecOption): string;
