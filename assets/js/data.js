/* =========================================================
   이 파일만 고치면 페이지 내용이 바뀝니다.
   ========================================================= */

window.SITE = {
  /* 신청 내용을 저장하는 구글 Apps Script 웹앱 주소
     (설정 방법: apps-script/설정방법.md)
     비워두면 '시험 모드'로 동작: 완료 화면은 뜨지만 저장·메일 발송은 안 됨 */
  applyEndpoint: "https://script.google.com/macros/s/AKfycbzNu6oht7t3rr2IfuUjG4ZKE8dyM5tTtYyWBXVyDIjObBMDmP_kB71MaV9kNItkBQVa/exec",

  /* 사전 신청 마감 시각 (한국 시간 기준, 이 시각부터 신청 불가)
     2026-12-16T00:00:00+09:00 = 12월 15일(화) 24시
     ※ 마감 화면 미리보기: 주소 뒤에 ?closed 붙여서 열기 */
  deadline: "2026-12-16T00:00:00+09:00",
  deadlineLabel: "2026년 12월 15일(화) 24시",
  contactPhone: "042-716-7084",

  /* 신청 화면 안내문구 */
  notice: "신청하신 기술의 최종 상담 여부 및 세부 일정은 추후 개별 안내드리겠습니다.",

  /* 개인정보 수집·이용 동의 내용 (보유 기간 등은 내부 기준에 맞게 수정) */
  privacy: "수집 항목: 소속, 이름, 휴대폰 번호, 이메일 / 이용 목적: 기술상담 매칭, 일정 안내 및 연락 / 보유 기간: 행사 종료 후 1년. 동의를 거부할 수 있으나, 거부 시 상담 신청이 제한됩니다.",

  /* 상담 확정 후 true로 바꾸면 확정 기술이 맨 앞으로 정렬됩니다. */
  confirmedFirst: true,
};

/* ---------------------------------------------------------
   출품기술 목록
   id        : 기술 고유번호 (신청 기록에 함께 저장됨, 겹치지 않게)
   category  : "carbon"(탄소복합소재) 또는 "battery"(이차전지소재)
   org       : 추천 기관
   title     : 카드에 들어가는 기술 제목 (최대 2줄)
   image     : 카드 배경 이미지
   doc       : 소개자료(SMK) 파일
               이미지 한 장  → "assets/docs/T01.png"
               이미지 여러 장 → ["assets/docs/T01-1.png", "assets/docs/T01-2.png"]
               PDF          → "assets/docs/T01.pdf"
               준비 전       → ""
   confirmed : 상담 기술로 확정되면 true
   --------------------------------------------------------- */
window.TECHS = [
  { id: "T01", category: "carbon", org: "KIST 전북분원", title: "빈틈 메운 초강력 CNT 복합섬유", image: "assets/img/T01.jpg", doc: "assets/docs/T01_SMK.jpg", confirmed: false },
  { id: "T02", category: "carbon", org: "KIST 전북분원", title: "원료 막힘 없는 CNT 연속합성 장치", image: "assets/img/T02.jpg", doc: "assets/docs/T02_SMK.jpg", confirmed: false },
  { id: "T03", category: "carbon", org: "KIST 전북분원", title: "전도도 3.3배 높인 질소 도핑 탄소", image: "assets/img/T03.jpg", doc: "assets/docs/T03_SMK.jpg", confirmed: false },
  { id: "T04", category: "carbon", org: "KIST 전북분원", title: "폐아라미드로 만든 고방열 복합체", image: "assets/img/T04.jpg", doc: "assets/docs/T04_SMK.jpg", confirmed: false },
  { id: "T05", category: "carbon", org: "KIST 전북분원", title: "BNNT 불순물 잡는 초간단 정제법", image: "assets/img/T05.jpg", doc: "assets/docs/T05_SMK.jpg", confirmed: false },
  { id: "T06", category: "carbon", org: "KIST 전북분원", title: "구리보다 가볍고 전류 큰 섬유 전선", image: "assets/img/T06.jpg", doc: "assets/docs/T06_SMK.jpg", confirmed: false },
  { id: "T07", category: "carbon", org: "KIST 전북분원", title: "열처리로 강도 4배 높인 CNT 섬유", image: "assets/img/T07.jpg", doc: "assets/docs/T07_SMK.jpg", confirmed: false },
  { id: "T08", category: "carbon", org: "전북대학교", title: "제철소 부생가스로 바로 발전하는 SOFC", image: "assets/img/T08.jpg", doc: "assets/docs/T08_SMK.jpg", confirmed: false },
  { id: "T09", category: "carbon", org: "KIST 전북분원", title: "붕소·질소 동시도핑 고전도 CNT 섬유", image: "assets/img/T09.jpg", doc: "assets/docs/T09_SMK.jpg", confirmed: false },
  { id: "T10", category: "carbon", org: "KIST 전북분원", title: "산화그래핀이 메운 고강도 CNT 섬유", image: "assets/img/T10.jpg", doc: "assets/docs/T10_SMK.jpg", confirmed: false },
  { id: "T11", category: "carbon", org: "전북대학교", title: "메탄에서 수소 뽑고 담는 Mg 합금", image: "assets/img/T11.jpg", doc: "assets/docs/T11_SMK.jpg", confirmed: false },
  { id: "T12", category: "carbon", org: "전북대학교", title: "100% PP 초경량 자기강화복합재", image: "assets/img/T12.jpg", doc: "assets/docs/T12_SMK.jpg", confirmed: false },
  { id: "T13", category: "carbon", org: "전북대학교", title: "곡면까지 감싸는 BNNT 중성자 차폐막", image: "assets/img/T13.jpg", doc: "assets/docs/T13_SMK.jpg", confirmed: false },
  { id: "T14", category: "battery", org: "전북대학교", title: "분산제 없이 방사선으로 푸는 CNT", image: "assets/img/T14.jpg", doc: "assets/docs/T14_SMK.jpg", confirmed: false },
  { id: "T15", category: "battery", org: "전북대학교", title: "296% 늘어나는 신축성 분리막", image: "assets/img/T15.jpg", doc: "assets/docs/T15_SMK.jpg", confirmed: false },
  { id: "T16", category: "battery", org: "KIST 전북분원", title: "10만 번 충전에도 끄떡없는 섬유 전극", image: "assets/img/T16.jpg", doc: "assets/docs/T16_SMK.jpg", confirmed: false },
  { id: "T17", category: "battery", org: "전북대학교", title: "폐배터리 가루로 새 양극재 직행", image: "assets/img/T17.jpg", doc: "assets/docs/T17_SMK.jpg", confirmed: false },
  { id: "T18", category: "carbon", org: "전북대학교", title: "400℃도 견디는 CNT 편광필름", image: "assets/img/T18.jpg", doc: "assets/docs/T18_SMK.jpg", confirmed: false },
  { id: "T19", category: "carbon", org: "전북대학교", title: "50배 싼 카본블랙 스마트 광셔터", image: "assets/img/T19.jpg", doc: "assets/docs/T19_SMK.jpg", confirmed: false },
  { id: "T20", category: "battery", org: "전북대학교", title: "불길 늦추는 에어로겔 배터리 케이스", image: "assets/img/T20.jpg", doc: "assets/docs/T20_SMK.jpg", confirmed: false },
];
