# WebRTC Signaling Server Ayame Web SDK

[![npm version](https://badge.fury.io/js/%40open-ayame%2Fayame-web-sdk.svg)](https://badge.fury.io/js/%40open-ayame%2Fayame-web-sdk)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Actions Status](https://github.com/OpenAyame/ayame-web-sdk/workflows/Lint%20And%20Flow%20Test/badge.svg)](https://github.com/OpenAyame/ayame-web-sdk/actions)

## About Shiguredo's open source software

We will not respond to PRs or issues that have not been discussed on Discord. Also, Discord is only available in Japanese.

Please read <https://github.com/shiguredo/oss> before use.

## 時雨堂のオープンソースソフトウェアについて

利用前に <https://github.com/shiguredo/oss> をお読みください。

## 概要

[WebRTC Signaling Server Ayame](https://github.com/OpenAyame/ayame) をブラウザから利用する SDK です。

## 使い方

### npm

```bash
npm install @open-ayame/ayame-web-sdk
```

### pnpm

```bash
pnpm add @open-ayame/ayame-web-sdk
```

## 動作環境

最新のブラウザを利用してください。

- Google Chrome
- Apple Safari
- Mozilla Firefox
- Microsoft Edge

## Ayame DevTools

Ayame Web SDK を利用した、開発ツールです。

- [Ayame Labo](https://ayame-labo.shiguredo.app/) を利用する例です
- `GitHub ログイン名@ayame-devtools` というルーム ID にしていますが、ルーム名の `ayame-devtools` は任意の文字列に変更できます
- シグナリングキーは [Ayame Labo](https://ayame-labo.shiguredo.app/) のダッシュボード上で取得してください

```bash
# cp .env.template .env.local
VITE_AYAME_SIGNALING_URL=wss://ayame-labo.shiguredo.app/signaling
VITE_AYAME_ROOM_ID_PREFIX={GitHubログイン名}@
VITE_AYAME_ROOM_NAME=ayame-devtools
VITE_AYAME_SIGNALING_KEY={シグナリングキー}
```

```bash
pnpm install
pnpm build
pnpm dev
```

<http://localhost:5173/> にアクセスすると、以下のような画面が表示されます。

[![Image from Gyazo](https://i.gyazo.com/69b1e9529f1a0e26bd3bcd3b74c95021.png)](https://gyazo.com/69b1e9529f1a0e26bd3bcd3b74c95021)

この画面を 2 つタブで開いて、 `Connect` ボタンを押して映像が双方向に表示されたら成功です。

### オンライン Ayame DevTools

以下から利用できます。

<https://openayame.github.io/ayame-web-sdk/devtools/index.html>

## 最小限のサンプル

[OpenAyame/ayame-web-sdk-examples](https://github.com/OpenAyame/ayame-web-sdk-examples) に最小限のサンプルコードを用意しています。

## API ドキュメント

API ドキュメントは以下の URL を参照してください。

<https://openayame.github.io/ayame-web-sdk/typedoc/index.html>

## ライセンス

Apache License 2.0

```text
Copyright 2019-2025, Shiguredo Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
