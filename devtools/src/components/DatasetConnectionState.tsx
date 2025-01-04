import { useStore } from '../store/useStore'

const DatasetConnectionState: React.FC = () => {
  const connectionState = useStore((state) => state.connectionState)

  // playwright の E2E テスト用
  return <div data-testid="connection-state" data-connection-state={connectionState} />
}

export default DatasetConnectionState
