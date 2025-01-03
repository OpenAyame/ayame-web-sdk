import { useAyameStore } from '../store/useAyameStore'

const DatasetConnectionState: React.FC = () => {
  const connectionState = useAyameStore((state) => state.connectionState)

  // playwright の E2E テスト用
  return <div data-testid="connection-state" data-connection-state={connectionState} />
}

export default DatasetConnectionState
