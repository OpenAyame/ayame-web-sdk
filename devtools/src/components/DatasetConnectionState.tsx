import { ayameConnectionState } from "../store/signals";

const DatasetConnectionState = () => {
  // playwright の E2E テスト用
  return <div data-testid="connection-state" data-connection-state={ayameConnectionState.value} />;
};

export default DatasetConnectionState;
