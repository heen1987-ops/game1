# 개발 일지 (자동 사이클 기록)

최신 항목이 맨 위. 같은 이슈를 반복해서 다시 "발견"하지 않으려면, 새 사이클은 이 파일과
docs/ISSUES.md의 "처리 완료" 섹션을 먼저 확인한다.

---
### 2026-07-24 (git 저장소 연결)
- https://github.com/heen1987-ops/game1 (main 브랜치)에 연결, 초기 커밋 push 완료
- 스테이징 전 확인: prisma/dev.db, .env, scripts/queue.db 모두 .gitignore로 정상 제외됨
- 자동 실행 규칙에 git commit+push 단계 추가 (매 사이클 민감 파일 스테이징 여부 확인 포함)

---
### 2026-07-24 (수동 실행, PWA + AdSense 자리표시자 추가)
- "앱"은 PWA로 결정 (Capacitor/React Native 아님) → public/manifest.json, public/sw.js,
  아이콘(icon-192/512.png) 추가, layout.tsx에서 manifest 연결 + RegisterSW로 서비스워커 등록
- components/AdSlot.tsx 추가 — NEXT_PUBLIC_ADSENSE_CLIENT_ID 없으면 자리표시자, 있으면
  실제 adsbygoogle 스크립트/슬롯 렌더링. /discover 페이지에 배치
- 브라우저 검증: 서버 렌더 HTML에 manifest/title/theme-color 정상 포함 확인(라이브 DOM
  head 조회는 이 프리뷰 툴 특유의 표시 문제로 비어보이는 현상 있었으나 실제 응답은 정상),
  서비스워커 등록 확인, 광고 자리표시자 렌더 확인
- AdSense는 계정 가입/사이트 심사가 필요해 자동화 불가 + 배포된 사이트여야 승인 가능 →
  TASKS.md에 Phase 3.2(배포) 추가
- git: 사용자가 heen1987-ops/pppp와 별도로 trip-platform용 새 GitHub 저장소를 만들기로 결정,
  URL 전달 대기 중 (Phase 3.1)

---
### 2026-07-24 (수동 실행, trip-platform으로 통합)
- Desktop\travel-platform에서 진행하던 콘텐츠 수집/API 연동 작업을 이 프로젝트(기존
  Prisma 기반 trip-platform)로 이관 완료
- lib/duffel.ts, lib/agoda.ts, lib/googleMaps.ts 이식
- 수집된 여행지 9건(0건 신규, 9건 기존 Place와 매칭), 코스 2건 → GuideContent(tip) 변환
- app/discover 페이지 + app/api/discover 라우트 신설, 브라우저에서 검색 → 결과 표시 →
  "여행에 추가" 전체 플로우 확인 완료
- scripts/collect.mjs 신설 (큐 관리 + Prisma 적재 CLI), 기존 큐 진행상황(완료 2건, 대기
  13건) 이관
- git 저장소는 아직 미초기화 — 원격 연결/push 여부는 사용자 확인 후 진행 예정 (TASKS.md
  Phase 3.1)
