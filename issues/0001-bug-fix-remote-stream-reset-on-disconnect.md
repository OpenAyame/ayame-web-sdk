# disconnect 時に remoteStream をリセットする

- Priority: High
- Created: 2026-05-19
- Model: Composer
- Branch: feature/fix-remote-stream-reset-on-disconnect

## 目的

同一 `Connection` インスタンス、または disconnect 後に再接続した利用者でリモート映像が届かなくなるバグを修正する。

## 優先度根拠

再接続は Ayame の基本利用パターンであり、症状がサイレント（`addstream` が二度と発火しない）なため、利用者が原因を特定しにくい。SDK コアの正しさに直結する High とする。

## 現状

`src/ayame.ts` の `disconnect()` は `authzMetadata` / `isOffer` / `dataChannels` 等は初期化するが、`remoteStream` をクリアしない。

```421:425:src/ayame.ts
    pc.ontrack = (event: RTCTrackEvent): void => {
      if (this.remoteStream) {
        return;
      }
```

2 回目以降の `connect()` で `ontrack` が早期 return し、`addstream` コールバックが呼ばれない。

## 設計方針

- `disconnect()` で `this.remoteStream = null` にする
- glare 時に `createPeerConnection()` で PeerConnection を差し替える経路（`have-local-offer` 時）でも、再ネゴ用に `remoteStream` をリセットする
- 必要に応じて `this.stream` の扱いも見直す（ローカル側の再利用方針をコードコメントで明示）

## 完了条件

- disconnect → connect の手順で、2 回目以降も `addstream` が発火する
- 手動または自動テストで上記を検証できる（モック・スタブは AGENTS.md に従い使用しない。E2E または実ブラウザ API を用いる）

## 解決方法

- `Connection.disconnect()` に `this.remoteStream = null` を追加
- `createPeerConnection()` の PC 差し替え前後で `remoteStream` の整合を確認
- 再接続シナリオのテストを追加する
