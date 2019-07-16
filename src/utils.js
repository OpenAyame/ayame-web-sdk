/* @flow */

export function randomString(strLength: number) {
  var result = [];
  var charSet = '0123456789';
  while (strLength--) {
    result.push(charSet.charAt(Math.floor(Math.random() * charSet.length)));
  }
  return result.join('');
}

export function traceLog(title: string, value: Object | string) {
  let prefix = '';
  if (window.performance) {
    prefix = '[Ayame ' + (window.performance.now() / 1000).toFixed(3) + ']';
  }
  if (browser() === 'edge') {
    console.log(prefix + ' ' + title + '\n', value);
  }
  else {
    console.info(prefix + ' ' + title + '\n', value);
  }
}

function browser() {
  const ua = window.navigator.userAgent.toLocaleLowerCase();
  if (ua.indexOf('edge') !== -1) {
    return 'edge';
  }
  else if (ua.indexOf('chrome')  !== -1 && ua.indexOf('edge') === -1) {
    return 'chrome';
  }
  else if (ua.indexOf('safari')  !== -1 && ua.indexOf('chrome') === -1) {
    return 'safari';
  }
  else if (ua.indexOf('opera')   !== -1) {
    return 'opera';
  }
  else if (ua.indexOf('firefox') !== -1) {
    return 'firefox';
  }
  return;
}
