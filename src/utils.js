/* @flow */
import type { AudioCodecOption, VideoCodecOption } from './connection';

/* @ignore */
export function randomString(strLength: number) {
  var result = [];
  var charSet = '0123456789';
  while (strLength--) {
    result.push(charSet.charAt(Math.floor(Math.random() * charSet.length)));
  }
  return result.join('');
}

/* @ignore */
export function traceLog(title: string, value: Object | string) {
  let prefix = '';
  if (window.performance) {
    prefix = '[Ayame ' + (window.performance.now() / 1000).toFixed(3) + ']';
  }
  if (browser() === 'edge') {
    console.log(prefix + ' ' + title + '\n', value);
  } else {
    console.info(prefix + ' ' + title + '\n', value);
  }
}

export function getVideoCodecsFromString(codec: VideoCodecOption, codecs: Array<Object>) {
  if (browser() !== 'chrome') {
    throw new Error('codec 指定は chrome canary でのみ利用できます');
  }
  let mimeType = '';
  if (codec === 'VP8') {
    mimeType = 'video/VP8';
  } else if (codec === 'VP9') {
    mimeType = 'video/VP9';
  } else if (codec === 'H264') {
    mimeType = 'video/H264';
  } else {
    mimeType = `video/${codec}`;
  }
  const filteredCodecs: Array<Object> = codecs.filter(c => c.mimeType == mimeType);
  if (filteredCodecs.length < 1) {
    throw new Error('invalid video codec type');
  }
  return filteredCodecs;
}

export function getAudioCodecsFromString(codec: AudioCodecOption, codecs: Array<Object>) {
  if (browser() !== 'chrome') {
    throw new Error('codec 指定は chrome canary でのみ利用できます');
  }
  let mimeType = '';
  if (codec === 'OPUS') {
    mimeType = 'audio/opus';
  } else if (codec === 'G722') {
    mimeType = 'audio/G722';
  } else if (codec === 'PCMU') {
    mimeType = 'audio/PCMU';
  } else if (codec === 'PCMA') {
    mimeType = 'audio/PCMA';
  } else {
    mimeType = `video/${codec}`;
  }
  const filteredCodecs: Array<Object> = codecs.filter(c => c.mimeType == mimeType);
  if (filteredCodecs.length < 1) {
    throw new Error('invalid audio codec type');
  }
  return filteredCodecs;
}
/* @ignore */
function browser() {
  const ua = window.navigator.userAgent.toLocaleLowerCase();
  if (ua.indexOf('edge') !== -1) {
    return 'edge';
  } else if (ua.indexOf('chrome') !== -1 && ua.indexOf('edge') === -1) {
    return 'chrome';
  } else if (ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1) {
    return 'safari';
  } else if (ua.indexOf('opera') !== -1) {
    return 'opera';
  } else if (ua.indexOf('firefox') !== -1) {
    return 'firefox';
  }
  return;
}
