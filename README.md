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

WebRTC Signaling Server Ayame をブラウザから利用する SDK です。

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

## サンプル

[OpenAyame/ayame-web-sdk-examples](https://github.com/OpenAyame/ayame-web-sdk-examples) にサンプルコードを用意しています。

## DevTools

```bash
# cp .env.template .env.local
VITE_AYAME_SIGNALING_URL=wss://ayame.example.com/signaling
VITE_AYAME_ROOM_ID={ayame-room-id}
VITE_AYAME_SIGNALING_KEY={ayame-signaling-key}
```

```bash
pnpm install
pnpm run dev
```

## API ドキュメント

API ドキュメントは以下の URL を参照してください。

<https://openayame.github.io/ayame-web-sdk/index.html>

## ライセンス

Apache License 2.0

```text
Copyright 2019-2024, Shiguredo Inc.

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
