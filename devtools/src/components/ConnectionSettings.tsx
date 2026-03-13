import type { VNode } from "preact";
import ClientId from "./ClientId";
import DebugToggle from "./DebugToggle";
import RoomId from "./RoomId";
import SignalingKey from "./SignalingKey";
import SignalingUrl from "./SignalingUrl";
import StandaloneToggle from "./StandaloneToggle";

const ConnectionSettings = (): VNode => (
  <fieldset class="mb-4 p-4 border border-gray-300 rounded max-w-lg">
    <legend class="px-2 font-semibold">Connection settings</legend>
    <div class="space-y-2">
      <div class="flex items-center gap-2">
        <label class="w-28">Signaling URL:</label>
        <SignalingUrl />
      </div>
      <div class="flex items-center gap-2">
        <label class="w-28">Room ID:</label>
        <RoomId />
      </div>
      <div class="flex items-center gap-2">
        <label class="w-28">Client ID:</label>
        <ClientId />
      </div>
      <div class="flex items-center gap-2">
        <label class="w-28">Signaling Key:</label>
        <SignalingKey />
      </div>
      <div class="flex items-center gap-2">
        <label class="w-28">Debug:</label>
        <DebugToggle />
      </div>
      <div class="flex items-center gap-2">
        <label class="w-28">Standalone:</label>
        <StandaloneToggle />
      </div>
    </div>
  </fieldset>
);

export default ConnectionSettings;
