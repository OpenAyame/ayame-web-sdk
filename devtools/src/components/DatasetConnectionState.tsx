import type { VNode } from "preact";
import { ayameConnectionState } from "../signals";

const DatasetConnectionState = (): VNode => (
  <div data-testid="connection-state" data-connection-state={ayameConnectionState.value} />
);

export default DatasetConnectionState;
