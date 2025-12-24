import { useStore } from "../store/useStore";

const DatasetConnectionState: React.FC = () => {
  const ayameConnectionState = useStore((state) => state.ayame.connectionState);

  // playwright の E2E テスト用
  return <div data-testid="connection-state" data-connection-state={ayameConnectionState} />;
};

export default DatasetConnectionState;
