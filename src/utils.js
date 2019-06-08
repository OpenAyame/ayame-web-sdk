/* @flow */

export function randomString(strLength: number) {
  var result = [];
  var charSet = '0123456789';
  while (strLength--) {
    result.push(charSet.charAt(Math.floor(Math.random() * charSet.length)));
  }
  return result.join('');
}

export function isUnifiedPlan(peer: window.RTCPeerConnection) {
  const config = peer.getConfiguration();
  return 'addTransceiver' in peer && (!('sdpSemantics' in config) || config.sdpSemantics === 'unified-plan');
}
