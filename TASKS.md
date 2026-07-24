# TASKS

범례: `[ ]` 미완료 · `[x]` 완료 · `[!]` 사용자 액션 필요 (자동 진행 불가)

이 프로젝트(trip-platform)는 2026-07-24부로 "초개인화 여행 플랫폼" 작업의 본진이 되었다.
Desktop\travel-platform(별도 실험 프로젝트, GitHub heen1987-ops/pppp)에서 만든 콘텐츠 수집
파이프라인과 Duffel/Agoda/Google Maps 연동을 이 프로젝트로 이식 완료했다.

## Phase 1 — API/계정 준비
- [!] Duffel 계정 가입 및 샌드박스 API 키 발급 (https://duffel.com) → .env의 DUFFEL_API_KEY
- [!] Agoda Partner 신청 및 승인 대기 (https://partners.agoda.com) → .env의 AGODA_API_KEY
- [!] Google Cloud 프로젝트 생성 + 결제 카드 등록 + Maps Platform API 키 발급 → .env의 GOOGLE_MAPS_API_KEY
- [!] Google AdSense 게시자 계정 가입 (배포 후 신청) → .env의 NEXT_PUBLIC_ADSENSE_CLIENT_ID

## Phase 2 — 플랫폼 통합 (완료)
- [x] lib/duffel.ts, lib/agoda.ts, lib/googleMaps.ts 이식 (키 없으면 샌드박스 mock)
- [x] Desktop\travel-platform 수집 데이터(여행지 9건, 코스 2건) → Prisma Place/GuideContent 이관
- [x] app/discover 페이지 + app/api/discover 라우트 (검색 → 큐레이션 장소 → "여행에 추가")
- [x] 브라우저 실동작 검증 (검색, 여행에 추가 플로우 확인)

## Phase 2.5 — PWA + 광고 수익화 기반 (완료)
- [x] PWA 전환: public/manifest.json, public/sw.js(캐시 우선 서비스워커), 아이콘(icon-192/512.png)
- [x] layout.tsx에 manifest 연결, theme-color, RegisterSW 컴포넌트로 서비스워커 등록
- [x] components/AdSlot.tsx (Google AdSense) — NEXT_PUBLIC_ADSENSE_CLIENT_ID 없으면 자리표시자,
      있으면 실제 광고 스크립트/슬롯 렌더링. /discover 페이지에 1개 배치
- [x] 브라우저 검증: manifest 200 응답, 서비스워커 등록 확인, 광고 자리표시자 렌더 확인
- [!] Google AdSense 게시자 계정 가입 + 사이트 심사 통과 필요 (계정 생성/약관 동의라 자동화
      불가). **AdSense는 실제 배포되어 트래픽이 있는 사이트를 심사하므로, 로컬 상태로는 승인
      불가 — Phase 3.1(배포) 이후 신청 가능**
- 참고: "앱"은 PWA로 결정됨 (Capacitor/React Native 아님) → Google AdMob은 해당 없음, 웹 광고는
  AdSense만 사용

## Phase 3 — 지속적 콘텐츠 수집/보완 루프 (진행 중)
- [ ] scripts/collect.mjs 큐 계속 처리 (매 사이클 1~3건) — 대기 13건 (2026-07-24 기준)
- [ ] 새로 발견한 하위 지역/코스는 큐에 추가 (`queue:add`)
- [ ] docs/ISSUES.md 열린 이슈 계속 처리, docs/DEVLOG.md 누적 기록
- [!] git 원격 저장소 연결 — 개인 여행 데이터(prisma/dev.db)는 .gitignore로 제외했지만,
      실제 remote 연결/push 여부는 사용자 확인 후 진행 (Phase 3.1 참고)

### Phase 3.1 — git/원격 저장소 (진행 중 — 사용자가 새 저장소 생성 요청받음)
- [x] 사용자 확인: heen1987-ops/pppp(Desktop 실험용)와 별도로, trip-platform용 **새 GitHub
      저장소**를 만들기로 결정 (2026-07-24)
- [!] 사용자가 GitHub에서 새 저장소(제안: `trip-platform`, private 권장)를 만들고 URL을
      알려주는 것을 기다리는 중. URL을 받으면 git init + remote add + push 진행

### Phase 3.2 — 배포 (Phase 1의 AdSense 신청 전제조건)
- **배포 타깃 도메인: `travel.hs-lab.site` (서브도메인)** — hs-lab.site 루트는 별도 앱
  (MEETFLOW/AI-PMS)이 이미 운영 중이므로, 그것을 덮어쓰지 않도록 반드시 별도 서브도메인으로
  분리한다. (Next.js는 서브도메인 배포 시 별도 basePath 설정 불필요 — DNS/리버스프록시 설정만
  다르면 됨)
- [!] hs-lab.site가 현재 어떤 방식으로 호스팅되고 있는지(VPS+Docker/PM2/Nginx 등, 아니면
  Vercel/기타 PaaS) 확인 필요 — 기존 인프라와 동일한 방식으로 맞추는 게 자연스러움. 전혀
  다른 방식(예: Vercel)을 새로 쓸지도 사용자 결정 사항.
- [ ] 위 확인 후 배포 진행 (계정 로그인/DNS 설정/결제는 자동화 대상 아님 — "배포 가능한 앱과
      설정 파일 준비"까지만 자동 진행)

## 미결정 사항
- Duffel/Agoda/Google Maps 실 키 발급 완료 시점 (Phase 1)
- "코스 템플릿"을 위한 별도 Prisma 모델 신설 여부 (현재는 GuideContent contentType='tip'으로
  임시 표현 — docs/ISSUES.md 참고)

---
## 자동 실행 규칙 (스케줄 작업용 — 30분 주기)

**1. 콘텐츠 수집**
  1. `node scripts/collect.mjs queue:next 3` 으로 대기 항목 확인
  2. 각 항목 WebSearch(+필요시 WebFetch)로 조사
  3. 여행지 3~5개를 추출해 `node scripts/collect.mjs place:add '{"name":"...","country":"...","city":"...","category":"...","summary":"...","source_url":"..."}'`
     로 Place+GuideContent(overview)에 반영 (원문 전체 복사 금지, paraphrase)
  4. 코스/팁성 정보는 `node scripts/collect.mjs tip:add '{"title":"...","region":"...","country":"...","content":"...","source_url":"..."}'`
  5. 처리한 큐 항목은 `queue:done <id>`, 새로 발견된 하위 지역/코스는 `queue:add`로 큐에 추가
  6. `queue:stats`로 잔량 확인 — 5건 미만이면 신규 쿼리 추가 등록

**2. 보완/피드백 반영**
  1. docs/DEVLOG.md 최근 기록과 docs/ISSUES.md "처리 완료"를 먼저 읽어 중복 작업 방지
  2. docs/ISSUES.md "열린 이슈"에서 1개를 골라 실제로 조치 (코드/스크립트/문서 수정)
  3. 조치 완료 시 "처리 완료"로 이동, 새로 발견한 문제는 "열린 이슈"에 추가
  4. docs/DEVLOG.md 맨 위에 이번 사이클 요약 2~3줄 추가

**공통**
- `[!]` 항목(계정 가입, 결제, git 원격 연결 등 사용자 액션/결정 필요)은 절대 건드리지 않는다
- **git commit/push는 하지 않는다** — Phase 3.1의 사용자 결정 전까지 로컬 파일 변경만 수행
