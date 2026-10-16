<p align="center"><a href="README.md">简体中文</a> · <a href="README_EN.md">English</a> · <a href="README_JA.md">日本語</a> · <a href="README_KO.md">한국어</a> · <a href="README_ES.md">Español</a></p>

<div align="center">

# xhs-account-diagnosis

**샤오훙수(RedNote) 프로필 링크 하나로 약 30쪽 분량의 진단 보고서와 90일 개선안 PDF를 받아 보세요**

파일을 읽고 명령을 실행할 수 있는 AI 커맨드라인 도구라면 모두 쓸 수 있습니다: Claude Code, Codex CLI, Gemini CLI

[보고서 샘플](https://xhs.addsum.top/samples) · [제작: Addsum](https://addsum.top/)

</div>

---

또 하나의 데이터 대시보드가 아닙니다. 계정 운영자가 정말 궁금한 질문에 답합니다.

> 내 계정은 어느 단계에서 막혀 있나? 무엇부터 고치고 무엇을 나중에 할까? 앞으로 90일 동안 매주 무엇을 해야 할까?

프로필과 최근 노트 30개(본문, 좋아요·저장·댓글 수, 모든 커버와 본문 이미지)를 자동으로 수집하고, '6단계 퍼널 단절점 진단'으로 가장 크게 새는 단계를 찾습니다. 정해진 순서로 해결책을 제시하고, 고객에게 바로 전달할 수 있는 PDF로 조판합니다.

샤오훙수는 중국어 플랫폼이므로 보고서는 중국어로 작성됩니다.

## 보고서 구성

총 10부, 중국어 기준 약 1만 5천~2만 5천 자:

1. 요약: 진단 결론, 핵심 문제, 우선 수정 항목, 보수적인 90일 예측
2. 현황 분석: 기본 데이터, 콘텐츠 노선 회고, 9개 항목 건강도 평가, 사용자 페르소나
3. 6단계 단절점 진단: 노출→클릭, 클릭→팔로우, 팔로우→DM, DM→전환, 전환→재구매. 단계마다 현황·문제·원인·개선 방향을 작성
4. 분야와 경쟁: 경쟁 구도, 벤치마크 분석, 차별화 기회(에이전트가 웹 검색을 할 수 있으면 플랫폼 규정과 트렌드도 조사)
5. 포지셔닝: 포지셔닝 공식, 계정명과 소개글 후보, 캐릭터 설정, 비주얼 가이드
6. 콘텐츠 전략: 콘텐츠 구성, 주제 목록, 30일 일별 일정, 제작 SOP
7. 수익화: 상품 단계, 전환 경로, DM 응대 문구, 가격 원칙
8. 90일 실행 계획: 3단계별 실행 목록과 판단 기준, 마일스톤 표
9. 리스크: 플랫폼·운영·마인드 세 가지 리스크와 네 가지 비상 체크리스트
10. 부록: 데이터 관리표, 도구 추천, 제목 모음, 자주 묻는 질문

실제 계정 세 곳의 보고서 발췌를 [샘플 페이지](https://xhs.addsum.top/samples)에서 볼 수 있습니다(같은 방법론으로 생성).

## 방법론

- **단절점부터 찾는다**: 단점을 나열하지 않고, 퍼널에서 가장 크게 새는 단계를 찾아 그곳에 힘을 모읍니다.
- **고치는 순서가 있다**: 포지셔닝 통일 → 상품의 콘텐츠화 → 프로필 전환 장치 → 비주얼 통일 → 검색 최적화 → 수익화 테스트. 프로필이 방문자를 붙잡기 전에 커버를 다듬거나 노출을 늘려도 유입이 그대로 빠져나갑니다.
- **문제마다 네 가지를 갖춘다**: 증상, 원인, 영향, 해결 방향. 하나라도 빠지면 진단이 아니라 불평입니다.
- **보이는 데이터만 쓴다**: 보고서의 모든 숫자는 스크립트가 만든 데이터 팩트 표에서 가져옵니다. 백엔드 노출, 프로필 방문, DM, 전환 데이터는 얻을 수 없으므로 이를 명시하고, 예측은 모두 보수적인 범위로 제시합니다.
- **결과를 약속하지 않는다**: '팔로워와 수입은 보장할 수 없다'고 솔직하게 답하는 항목이 있고, 90일 동안 실제로 통제할 수 있는 일을 정리합니다.

전체 규칙은 [`RUN.md`](RUN.md), 보고서 뼈대는 [`references/report-template.md`](references/report-template.md)에 있습니다.

## 준비물

1. Chrome이 설치된 컴퓨터(Mac, Windows, Linux)
2. 평소 쓰는 Chrome에서 샤오훙수 웹(xiaohongshu.com)에 로그인한 상태
3. Node.js 22 이상(`node -v`로 확인)
4. AI 커맨드라인 도구 하나: Claude Code, Codex CLI, Gemini CLI 등

API 키도, 다른 의존성도 필요 없습니다.

## 설치

Claude Code:

```bash
git clone https://github.com/ai-martin-lau/xhs-account-diagnosis ~/.claude/skills/xhs-account-diagnosis
```

다른 도구: 원하는 곳에 클론하고 경로를 기억해 두세요.

```bash
git clone https://github.com/ai-martin-lau/xhs-account-diagnosis
```

## 사용법

먼저 대상 계정의 프로필 링크를 준비합니다. 샤오훙수 앱에서 프로필을 열고 오른쪽 위 공유에서 '링크 복사'를 고르거나, 컴퓨터 브라우저에서 프로필을 열고 주소창을 복사합니다. 형식은 `https://www.xiaohongshu.com/user/profile/xxxx` 입니다.

Claude Code에서는:

```text
诊断这个小红书账号 https://www.xiaohongshu.com/user/profile/xxxx
```

Codex CLI, Gemini CLI 등에서는:

```text
<클론 경로>/RUN.md를 읽고 그대로 실행해 주세요. 대상 계정: https://www.xiaohongshu.com/user/profile/xxxx
```

그다음은 기다리기만 하면 됩니다. 데이터 수집에 약 5분, 보고서 작성에 약 10~20분이 걸리며 따로 조작할 필요가 없습니다.

## 결과물

현재 작업 디렉터리에 `账号诊断/<계정명>/` 폴더가 생깁니다:

- `<계정명>_小红书账号诊断报告与优化方案.pdf`: 전달용 PDF
- 같은 이름의 `.md`: 수정 가능한 원본
- `证据/`(증거 자료): 프로필 스크린샷, 모든 커버와 본문 이미지, 원본 데이터 `data.json`, 데이터 팩트 표

## 진행 중 나올 수 있는 안내

- **Chrome에 '원격 디버깅 허용' 창이 뜬다**: 허용을 누르세요. 스크립트가 사용자의 Chrome에 연결해 로그인 상태로 둘러보기 위한 것입니다.
- **'Chrome을 완전히 종료한 뒤 다시 시도'라고 나온다**: Mac은 Cmd+Q, Windows는 Chrome 창을 모두 닫은 뒤 같은 문장을 다시 보내세요. Chrome이 자동으로 다시 열립니다.
- **로그인 화면이 나온다**: Chrome에서 샤오훙수 웹에 한 번 로그인한 뒤 계속 진행시키세요.
- **느리게 느껴진다**: 일반적인 둘러보기처럼 보이도록 일부러 천천히 접근합니다.

## 자주 묻는 질문

**내 샤오훙수 계정에 무언가를 하나요?**
아니요. 읽기만 합니다. 좋아요, 팔로우, 댓글, DM은 하지 않고 사람처럼 공개 프로필을 둘러볼 뿐입니다. 접근 속도를 조절하지만 자동화된 접근은 플랫폼 리스크 관리에 걸릴 아주 작은 가능성이 있습니다. 걱정된다면 사용하지 마세요.

**다른 사람의 계정도 진단할 수 있나요?**
프로필이 공개되어 있다면 가능합니다. 본인 계정이나 허락받은 고객 계정에만 사용해 주세요.

**보고서가 팔로워 증가를 보장하나요?**
아니요. 보고서 스스로도 그런 약속을 하지 않습니다. 단절점, 고치는 순서, 90일 계획을 제시할 뿐이고 결과는 실행에 달려 있습니다.

**한 번에 몇 개 계정까지 되나요?**
한 번에 하나입니다. 끝나면 다음 링크를 보내면 됩니다.

## 파일 구조

```text
RUN.md                       실행 매뉴얼(모든 CLI 공통의 유일한 원본)
SKILL.md / AGENTS.md / GEMINI.md   Claude Code / Codex / Gemini 진입점, 모두 RUN.md를 가리킴
references/report-template.md      보고서 10부 뼈대
scripts/xhs_fetch.mjs        로컬 Chrome에 연결해 프로필과 노트를 수집
scripts/facts.mjs            데이터 팩트 표와 콘텐츠 노선별 통계 생성
scripts/build_pdf.mjs        Markdown을 인쇄 품질 PDF로 변환(헤드리스 Chrome)
```

## 면책 조항

보고서는 운영 자문이며 성과를 약속하지 않습니다. 샤오훙수 플랫폼 규정을 지키고 괴롭힘, 표절 등 규정 위반 용도로 사용하지 마세요. 사용에 따른 결과는 사용자 본인의 책임입니다.

## 라이선스

[MIT](LICENSE)

제작: [Addsum](https://addsum.top/). 다른 오픈소스: [slide-maker](https://github.com/addsumtech/slides_maker)(AI가 바로 편집 가능한 PowerPoint 생성), [x-account-teardown](https://github.com/ai-martin-lau/x-account-teardown)(X 계정의 성장 과정 분석).

## 스타 히스토리

[![Star History Chart](https://api.star-history.com/svg?repos=ai-martin-lau/xhs-account-diagnosis&type=Date)](https://star-history.com/#ai-martin-lau/xhs-account-diagnosis&Date)
