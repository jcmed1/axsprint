window.INITIAL_DATA = {
  "project": {
    "name": "AX Sprint 성과·실행 관제",
    "subtitle": "생애주기별 심리케어 지원을 위한 발화데이터 기반 다채널 AI 플랫폼 개발 및 실증",
    "leadInstitution": "정션메드",
    "periodStart": "2026-06-01",
    "periodEnd": "2026-12-31",
    "asOf": "2026-08-31",
    "version": "MVP v21",
    "completionCriteriaBasis": "사업수행계획서 성과지표·평가기준·산출물과 제공된 마일스톤 자료 기준"
  },
  "institutions": [
    {
      "name": "경복대학교",
      "role": "참여기관"
    },
    {
      "name": "돌봄과 미래",
      "role": "참여기관"
    },
    {
      "name": "에임랩",
      "role": "참여기관"
    },
    {
      "name": "정션메드",
      "role": "주관기관"
    }
  ],
  "kpis": [
    {
      "id": "KPI-01",
      "name": "음성·생체 데이터 수집 및 비식별 처리 체계 구축",
      "category": "데이터 수집·가공·품질관리·갱신 체계",
      "logic": "과정, 산출",
      "planInstitutions": [
        "돌봄과 미래",
        "정션메드"
      ],
      "owner": "",
      "collaborators": [
        "돌봄과 미래",
        "정션메드"
      ],
      "target": "수집 데이터 1000건 이상, 비식별 처리율 95%이상",
      "deliverable": "(내용) 음성·생체 데이터 수집 체계 구축 및 비식별화 처리\n(산출물) 수집 데이터셋 목록 및 비식별 처리 결과 보고서 제출, 데이터셋 확인",
      "cycle": "반기, 프로젝트기간",
      "evaluation": "수집 데이터셋 목록 및 비식별 처리 결과 보고서 제출",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-02",
      "name": "표준 척도 기반 학습데이터셋 구축",
      "category": "데이터 수집·가공·품질관리·갱신 체계",
      "logic": "과정, 산출",
      "planInstitutions": [
        "정션메드"
      ],
      "owner": "정션메드",
      "collaborators": [],
      "target": "척도별 수집 건수 300건 이상, 데이터 정합성 오류율 10% 이하",
      "deliverable": "(내용) PHQ-9·GAD-7·RSES·CBI-6 검사 결과 및 감정 일기 데이터 수집·정제하여 학습데이터셋 구축\n(산출물) 학습데이터셋 파일 제출 및 정합성 검증 보고서 내 오류율 수치 확인",
      "cycle": "반기, 프로젝트기간",
      "evaluation": "학습데이터셋 파일 제출 및 정합성 검증 보고서 내 오류율 수치 확인",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-03",
      "name": "데이터 갱신 체계 수립",
      "category": "데이터 수집·가공·품질관리·갱신 체계",
      "logic": "과정, 산출",
      "planInstitutions": [
        "돌봄과 미래",
        "정션메드"
      ],
      "owner": "",
      "collaborators": [
        "돌봄과 미래",
        "정션메드"
      ],
      "target": "갱신 주기 3개월 이내, 갱신 이력 1회 이상",
      "deliverable": "(내용) 검사·일기 데이터 연계 갱신 구조 설계 및 운영\n(산출물) 데이터 갱신 이력 문서 내 갱신 일자·건수 수치 확인",
      "cycle": "분기, 프로젝트기간",
      "evaluation": "데이터 갱신 이력 문서 내 갱신 일자·건수 수치 확인",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-04",
      "name": "도구 타당도/신뢰도",
      "category": "과학적 검증",
      "logic": "결과, 산출",
      "planInstitutions": [
        "경복대학교"
      ],
      "owner": "경복대학교",
      "collaborators": [],
      "target": "표준 척도 간 상관관계 r ≥ 0.8, 내적 일치도 확보",
      "deliverable": "o (내용) 대학 개발 진단 도구와 표준 척도 간 상관관계 분석 및 내적 일치도 검증\no (산출물) 타당도·신뢰도 검증 보고서 (상관계수 r ≥ 0.8, 내적 일치도 수치 확인)",
      "cycle": "반기, 프로젝트기간",
      "evaluation": "타당도·신뢰도 검증 보고서 내 상관계수 및 내적 일치도 수치 확인",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-05",
      "name": "진단 일치도/정확도",
      "category": "과학적 검증",
      "logic": "결과, 산출",
      "planInstitutions": [
        "경복대학교"
      ],
      "owner": "경복대학교",
      "collaborators": [],
      "target": "전문가-AI 진단 일치율 80% 이상",
      "deliverable": "o (내용) 전문가(복지사·의사)의 판단과 AI 분석 결과 간 일치율 비교 분석\no (산출물) 진단 일치도 분석 보고서 (전문가-AI 일치율(%) 수치 확인)",
      "cycle": "반기, 프로젝트기간",
      "evaluation": "진단 일치도 분석 보고서 내 일치율(%) 수치 확인",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-06",
      "name": "복지 AI 현장 최적화 통합 지수 (WAOI)",
      "category": "과학적 검증",
      "logic": "결과, 산출",
      "planInstitutions": [
        "경복대학교"
      ],
      "owner": "경복대학교",
      "collaborators": [],
      "target": "WAOI 75점 이상",
      "deliverable": "o (내용) 과학적 타당성(40%)·플랫폼 유용성(30%)·현장 정착성(30%) 합산 점수 산출 및 목표값 달성 여부 확인\no (산출물) WAOI 측정 결과 보고서 (목표: 80점 이상 달성, 1차년도 말 수치 확인)",
      "cycle": "년, 프로젝트기간",
      "evaluation": "과학적 타당성(40%) + 플랫폼 유용성(30%) + 현장 정착성(30%) 합산 점수 산출, 1차년도 말 측정 결과 보고서 제출 및 수치 확인",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-07",
      "name": "B2C대상 실증",
      "category": "AI서비스 개발·실증",
      "logic": "결과, 과정",
      "planInstitutions": [
        "경복대학교"
      ],
      "owner": "경복대학교",
      "collaborators": [],
      "target": "기관 11개 이상, 인원 1000명 이상, 사용건수 3000건 이상, 위험군 감지 90%이상",
      "deliverable": "o (내용) 마음로그 앱 기반 개인 사용자 대상 감정 일기·표준 척도 검사·위험 키워드 감지 서비스 실증 운영\no (산출물) 개인 사용자 세션 로그, 감정 분석 결과 데이터, 위험군 감지·대응 이력",
      "cycle": "프로젝트기간",
      "evaluation": "세션 로그 데이터 내 건수 수치 확인, 위험군 감지 이력 확인",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-08",
      "name": "B2B/B2G대상 실증",
      "category": "AI서비스 개발·실증",
      "logic": "결과, 과정",
      "planInstitutions": [
        "경복대학교",
        "에임랩"
      ],
      "owner": "",
      "collaborators": [
        "경복대학교",
        "에임랩"
      ],
      "target": "기관 11개 이상, 사용 건수 1000회 이상, 자동보고서 생성 1000건 이상",
      "deliverable": "o (내용) 케어원 기반 기관 실무자 대상 키오스크 사용 자동 보고서 생성 및 대시보드 서비스 실증 운영, 기관별 서비스 사용횟수 추적\no (산출물) 기관 사용 횟수, 자동 보고서 생성 건수",
      "cycle": "프로젝트기간",
      "evaluation": "기관별 사용 횟수 확인, 자동 보고서 생성 건수 로그 확인",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-09",
      "name": "케어콜 자동 특이사항(모니터링,관심사) 입력",
      "category": "AI서비스 개발·실증",
      "logic": "결과, 과정",
      "planInstitutions": [
        "정션메드"
      ],
      "owner": "정션메드",
      "collaborators": [],
      "target": "자동 입력 300건 이상",
      "deliverable": "o (내용) 케어원 상담 녹음 기반 케어콜 대상자 정보(모니터링·관심사) 자동 입력 기능 현장 운영\no (산출물) 케어콜 자동 입력 횟수 집계",
      "cycle": "프로젝트기간",
      "evaluation": "케어콜 자동 특이사항 입력 횟수 로그 제출, 건수 수치 확인",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-10",
      "name": "DB 응답속도 측정 및 성능 관리",
      "category": "AI서비스 개발·실증",
      "logic": "과정, 산출",
      "planInstitutions": [
        "정션메드"
      ],
      "owner": "정션메드",
      "collaborators": [],
      "target": "평균 응답속도 500ms 이내, 사업기간 1회 이상 측정",
      "deliverable": "o (내용) 서비스 운영 중 DB 응답속도 상시 모니터링 및 기준치 달성 여부 측정\no (산출물) DB 응답속도 측정 보고서",
      "cycle": "년",
      "evaluation": "DB 응답속도 측정 보고서 내 회차별 측정값 수치 확인, 공인 시험기관 성능평가(KOLAS)",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-11",
      "name": "(가중치)AI 감정 분석 성능 검증",
      "category": "AI서비스 개발·실증",
      "logic": "과정, 산출",
      "planInstitutions": [
        "정션메드"
      ],
      "owner": "정션메드",
      "collaborators": [],
      "target": "감정 분류 정확도 70% 이상",
      "deliverable": "o (내용) 감정 분류 감지 정확도 공인 시험 진행, 접근성 설계 반영\no (산출물) KOLAS 성능 시험 결과서",
      "cycle": "년",
      "evaluation": "KOLAS 공인 시험기관 성능 시험 결과서",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-12",
      "name": "리빙랩 운영 규모",
      "category": "AI서비스 개발·실증",
      "logic": "과정, 산출",
      "planInstitutions": [
        "경복대학교"
      ],
      "owner": "경복대학교",
      "collaborators": [],
      "target": "참여 기관 11개소 이상, 수혜 대상자 1,000명 이상, 누적 실증 데이터 3,000건 이상",
      "deliverable": "o (내용) 실증 참여 기관 및 수혜 대상자 모집·운영, 누적 실증 데이터 수집\no (산출물) 리빙랩 운영 결과 보고서 (참여 기관 수, 대상자 수, 누적 데이터 건수 확인)",
      "cycle": "프로젝트기간",
      "evaluation": "리빙랩 운영 결과 보고서 내 기관 수·대상자 수·데이터 건수 수치 확인",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-13",
      "name": "실증 전후 변화",
      "category": "AI서비스 개발·실증",
      "logic": "산출",
      "planInstitutions": [
        "경복대학교"
      ],
      "owner": "경복대학교",
      "collaborators": [],
      "target": "AI 도구 도입 전후 고독감·위기지수 유의미한 감소 (T-test p < 0.05)",
      "deliverable": "o (내용) AI 도구 도입 전후 대상자의 고독감·위기지수 변화 측정 및 통계 검증\no (산출물) 실증 효과성 분석 보고서 (T-test 기반 전후 변화 수치 확인)",
      "cycle": "프로젝트기간",
      "evaluation": "실증 효과성 분석 보고서 내 전후 비교 수치 및 통계 검증 결과 확인",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-14",
      "name": "(가중치)사용자 수용성",
      "category": "AI서비스 개발·실증",
      "logic": "결과, 산출",
      "planInstitutions": [
        "경복대학교"
      ],
      "owner": "경복대학교",
      "collaborators": [],
      "target": "현장 종사자 및 수혜자 조작 용이성 점수 5점 척도 중 4점 이상",
      "deliverable": "o (내용) 현장 종사자 및 수혜자 대상 지각된 유용성·조작 용이성 설문 조사 실시\no (산출물) 사용자 수용성 조사 결과 보고서 (5점 척도 점수 및 T-test 결과 수치 확인)",
      "cycle": "프로젝트기간",
      "evaluation": "사용자 수용성 조사 결과 보고서 내 항목별 점수 수치 확인",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-15",
      "name": "(가중치)현장 적용성",
      "category": "AI서비스 개발·실증",
      "logic": "결과, 산출",
      "planInstitutions": [
        "경복대학교"
      ],
      "owner": "경복대학교",
      "collaborators": [],
      "target": "AI 도입 후 기존 복지 업무 프로세스 시간 20% 이상 단축",
      "deliverable": "o (내용) AI 도입 전후 기존 복지 업무 프로세스 시간 단축 및 효율화 정도 측정\no (산출물) 현장 적용성 평가 보고서 (업무 처리 시간 단축률(%) 수치 확인)",
      "cycle": "프로젝트기간",
      "evaluation": "현장 적용성 평가 보고서 내 업무 처리 시간 단축률(%) 수치 확인",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-16",
      "name": "지속 활용 의향",
      "category": "지속 가능성",
      "logic": "결과",
      "planInstitutions": [
        "경복대학교"
      ],
      "owner": "경복대학교",
      "collaborators": [],
      "target": "정식 도입 및 재이용 의사 비율 70% 이상",
      "deliverable": "o (내용) AI 도입 전후 기존 복지 업무 프로세스 시간 단축 및 효율화 정도 측정\no (산출물) 현장 적용성 평가 보고서 (업무 처리 시간 단축률(%) 수치 확인)",
      "cycle": "프로젝트기간",
      "evaluation": "지속 활용 의향 조사 결과 보고서 내 도입·재이용 의사 비율(%) 수치 확인",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-17",
      "name": "표준화 가능성",
      "category": "지속 가능성",
      "logic": "산출",
      "planInstitutions": [
        "경복대학교",
        "돌봄과 미래"
      ],
      "owner": "",
      "collaborators": [
        "경복대학교",
        "돌봄과 미래"
      ],
      "target": "복지 현장용 AI 데이터 레이블링 표준 지침 및 매뉴얼 1건 이상 제작",
      "deliverable": "o (내용) 복지 현장용 AI 데이터 레이블링 표준 지침 및 운영 매뉴얼 개발\no (산출물) 표준 지침서 및 매뉴얼 (제작 건수 확인)",
      "cycle": "프로젝트기간",
      "evaluation": "표준 지침서 및 매뉴얼 문서 제출 후 내용 확인",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-18",
      "name": "SOP(표준운영절차) 수립",
      "category": "기타",
      "logic": "산출",
      "planInstitutions": [
        "에임랩",
        "정션메드"
      ],
      "owner": "",
      "collaborators": [
        "에임랩",
        "정션메드"
      ],
      "target": "SOP 문서 1건",
      "deliverable": "SOP(표준운영절차) 수립",
      "cycle": "프로젝트기간",
      "evaluation": "SOP 문서 제출 및 내용 확인",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-19",
      "name": "개인정보보호 관리 체계 운영",
      "category": "기타",
      "logic": "과정",
      "planInstitutions": [
        "정션메드"
      ],
      "owner": "정션메드",
      "collaborators": [],
      "target": "개인정보보호 점검 1회 이상",
      "deliverable": "개인정보보호 관리 체계 운영",
      "cycle": "반기",
      "evaluation": "개인정보보호 점검 결과 보고서 제출, 점검 횟수 확인",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-20",
      "name": "서비스 상용화 템플릿 완성",
      "category": "기타",
      "logic": "결과, 산출",
      "planInstitutions": [
        "에임랩",
        "정션메드"
      ],
      "owner": "",
      "collaborators": [
        "에임랩",
        "정션메드"
      ],
      "target": "상용화 템플릿 1건 이상",
      "deliverable": "서비스 상용화 템플릿 완성",
      "cycle": "프로젝트기간",
      "evaluation": "서비스 상용화 템플릿 문서 확인",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    },
    {
      "id": "KPI-21",
      "name": "오류·긴급 알림 대응 절차 구축",
      "category": "기타",
      "logic": "과정, 산출",
      "planInstitutions": [
        "정션메드"
      ],
      "owner": "정션메드",
      "collaborators": [],
      "target": "대응 절차 문서 1건 완성, 오류 대응 시간 48시간 이내",
      "deliverable": "오류·긴급 알림 대응 절차 구축",
      "cycle": "프로젝트기간",
      "evaluation": "오류·긴급 알림 대응 절차 문서 제출 및 대응 이력 확인",
      "currentValue": "",
      "progress": null,
      "status": "미측정",
      "nextStep": "",
      "pmNote": "",
      "evidenceStatus": "미등록"
    }
  ],
  "actions": [
    {
      "id": "ACT-001",
      "name": "슈프리마 기기 테스트 및 스펙 확정",
      "planInstitutions": [
        "에임랩",
        "정션메드"
      ],
      "owner": "",
      "collaborators": [
        "에임랩",
        "정션메드"
      ],
      "start": "2026-08-20",
      "end": "2026-08-25",
      "status": "진행 중",
      "priority": "보통",
      "completionCriteria": "슈프리마 기기 테스트 결과를 정리하고 키오스크 적용 기기와 주요 사양을 확정한 상태",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "",
      "note": "",
      "sourceStatus": "진행 중"
    },
    {
      "id": "ACT-002",
      "name": "최종 데이터 표준화 완료 및 보고",
      "planInstitutions": [
        "돌봄과 미래",
        "정션메드"
      ],
      "owner": "",
      "collaborators": [
        "돌봄과 미래",
        "정션메드"
      ],
      "start": "2026-11-18",
      "end": "2026-12-09",
      "status": "예정",
      "priority": "보통",
      "completionCriteria": "기관별 실증 데이터 형식과 수집 기준을 최종 통합하고, 복지 현장용 AI 데이터 레이블링 표준 지침 및 운영 매뉴얼 1건 이상을 최종본으로 정리·보고한 상태",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "표준화 가능성",
      "note": "",
      "sourceStatus": "시작 전"
    },
    {
      "id": "ACT-003",
      "name": "실증기관 세부 협의 진행",
      "planInstitutions": [
        "경복대학교",
        "정션메드"
      ],
      "owner": "",
      "collaborators": [
        "경복대학교",
        "정션메드"
      ],
      "start": "2026-06-01",
      "end": "2026-06-30",
      "status": "완료 승인",
      "priority": "보통",
      "completionCriteria": "실증기관별 참여 채널, 담당자, 운영 일정과 협조사항을 협의하고 기관별 실증 착수 조건을 확인한 상태",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "",
      "note": "",
      "sourceStatus": "완료"
    },
    {
      "id": "ACT-004",
      "name": "전담기관 협약체결 및 사업 착수",
      "planInstitutions": [
        "정션메드"
      ],
      "owner": "정션메드",
      "collaborators": [],
      "start": "2026-06-01",
      "end": "2026-06-30",
      "status": "완료 승인",
      "priority": "보통",
      "completionCriteria": "전담기관 협약 체결을 완료하고 협약 기준 사업 수행체계와 착수 일정을 확정한 상태",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "",
      "note": "",
      "sourceStatus": "완료"
    },
    {
      "id": "ACT-005",
      "name": "AI 서비스 2차 고도화 (실증 피드백 반영)",
      "planInstitutions": [
        "정션메드"
      ],
      "owner": "정션메드",
      "collaborators": [],
      "start": "2026-11-04",
      "end": "2026-11-18",
      "status": "예정",
      "priority": "보통",
      "completionCriteria": "실증 피드백을 반영한 AI 서비스 2차 고도화 사항을 적용하고 주요 기능 내부 점검을 완료한 상태",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "(가중치)AI 감정 분석 성능 검증",
      "note": "",
      "sourceStatus": "시작 전"
    },
    {
      "id": "ACT-006",
      "name": "키오스크 실증 기관 설치 및 운영 개시",
      "planInstitutions": [
        "경복대학교",
        "에임랩"
      ],
      "owner": "",
      "collaborators": [
        "경복대학교",
        "에임랩"
      ],
      "start": "2026-09-01",
      "end": "2026-11-30",
      "status": "진행 중",
      "priority": "보통",
      "completionCriteria": "대상 실증기관에 상담 키오스크를 설치하고 현장 운영을 개시하며, 기관별 사용횟수와 자동보고서 생성 건수를 집계할 수 있는 상태. 최종 실증목표는 참여기관 11개 이상, 사용 1,000회 이상, 자동보고서 1,000건 이상 기준으로 관리",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "B2B/B2G대상 실증",
      "note": "",
      "sourceStatus": "진행 중"
    },
    {
      "id": "ACT-007",
      "name": "키오스크 기반 실증 운영 지속",
      "planInstitutions": [
        "경복대학교",
        "에임랩"
      ],
      "owner": "",
      "collaborators": [
        "경복대학교",
        "에임랩"
      ],
      "start": "2026-10-01",
      "end": "2026-11-30",
      "status": "예정",
      "priority": "보통",
      "completionCriteria": "키오스크 실증 운영 로그를 지속 수집하고 기관별 사용횟수와 자동보고서 생성 건수를 집계한 상태. 최종 실증목표인 참여기관 11개 이상, 사용 1,000회 이상, 자동보고서 1,000건 이상 달성 여부를 확인할 수 있도록 실적표를 유지",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "B2B/B2G대상 실증",
      "note": "",
      "sourceStatus": "시작 전"
    },
    {
      "id": "ACT-008",
      "name": "초기 데이터 수집 및 현황 점검",
      "planInstitutions": [
        "경복대학교",
        "돌봄과 미래",
        "정션메드"
      ],
      "owner": "",
      "collaborators": [
        "경복대학교",
        "돌봄과 미래",
        "정션메드"
      ],
      "start": "2026-06-01",
      "end": "2026-07-31",
      "status": "진행 중",
      "priority": "보통",
      "completionCriteria": "실증 초기 데이터의 기관·대상자·데이터 건수를 집계하고 누락·형식·품질 이슈를 점검한 상태. 최종 성과목표인 음성·생체 데이터 1,000건 이상 및 비식별 처리율 95% 이상 대비 현재 실적을 확인할 수 있는 집계자료 확보",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "리빙랩 운영 규모",
      "note": "",
      "sourceStatus": "진행 중"
    },
    {
      "id": "ACT-009",
      "name": "사용자 만족도 조사 참여 지원",
      "planInstitutions": [
        "경복대학교"
      ],
      "owner": "경복대학교",
      "collaborators": [],
      "start": "2026-11-01",
      "end": "2026-12-31",
      "status": "예정",
      "priority": "보통",
      "completionCriteria": "현장 종사자 및 수혜자 대상 만족도·수용성 조사 참여를 지원하고 조사자료 회수 현황을 집계한 상태. 최종 평가 시 조작 용이성 5점 척도 4점 이상 및 정식 도입·재이용 의사 70% 이상을 산출할 수 있는 응답자료 확보",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "(가중치)사용자 수용성",
      "note": "",
      "sourceStatus": "시작 전"
    },
    {
      "id": "ACT-010",
      "name": "참여기관 킥오프 회의 주관",
      "planInstitutions": [
        "정션메드"
      ],
      "owner": "정션메드",
      "collaborators": [],
      "start": "2026-06-01",
      "end": "2026-06-30",
      "status": "완료 승인",
      "priority": "보통",
      "completionCriteria": "컨소시엄 킥오프 회의를 개최하고 기관별 역할, 주요 일정, 실증 및 협업사항을 확인하여 회의 결과를 공유한 상태",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "",
      "note": "",
      "sourceStatus": "완료"
    },
    {
      "id": "ACT-011",
      "name": "KOLAS 공인 성능 평가 수행",
      "planInstitutions": [
        "정션메드"
      ],
      "owner": "정션메드",
      "collaborators": [],
      "start": "2026-11-18",
      "end": "2026-11-30",
      "status": "예정",
      "priority": "보통",
      "completionCriteria": "KOLAS 공인 시험기관 성능시험을 완료하고 공식 시험결과서를 확보한 상태. 성과관리 기준에 따라 AI 감정 분류 정확도 70% 이상 달성 여부를 시험결과서에서 확인",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "(가중치)AI 감정 분석 성능 검증",
      "note": "",
      "sourceStatus": "시작 전"
    },
    {
      "id": "ACT-012",
      "name": "2차 자문회의 진행",
      "planInstitutions": [
        "경복대학교",
        "돌봄과 미래"
      ],
      "owner": "",
      "collaborators": [
        "경복대학교",
        "돌봄과 미래"
      ],
      "start": "2026-08-19",
      "end": "2026-08-19",
      "status": "완료 승인",
      "priority": "보통",
      "completionCriteria": "2차 자문회의를 개최하고 주요 자문의견과 후속 반영사항을 정리한 상태",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "",
      "note": "",
      "sourceStatus": "완료"
    },
    {
      "id": "ACT-013",
      "name": "사업 수행 계획 확정",
      "planInstitutions": [
        "정션메드"
      ],
      "owner": "정션메드",
      "collaborators": [],
      "start": "2026-06-01",
      "end": "2026-06-30",
      "status": "완료 승인",
      "priority": "보통",
      "completionCriteria": "협약 사업수행계획을 기준으로 기관별 역할, 세부 추진계획, 일정 및 성과관리 기준을 확정한 상태",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "",
      "note": "",
      "sourceStatus": "완료"
    },
    {
      "id": "ACT-014",
      "name": "상담센터 연계 실증 운영 개시 (키오스크 포함)",
      "planInstitutions": [
        "경복대학교",
        "정션메드"
      ],
      "owner": "",
      "collaborators": [
        "경복대학교",
        "정션메드"
      ],
      "start": "2026-09-01",
      "end": "2026-09-30",
      "status": "진행 중",
      "priority": "보통",
      "completionCriteria": "상담센터 연계 실증기관에서 키오스크를 포함한 서비스 운영을 시작하고 실사용 데이터 수집 체계를 가동한 상태",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "B2B/B2G대상 실증",
      "note": "",
      "sourceStatus": "진행 중"
    },
    {
      "id": "ACT-015",
      "name": "최종 보고서 작성 및 제출",
      "planInstitutions": [
        "정션메드"
      ],
      "owner": "정션메드",
      "collaborators": [],
      "start": "2026-12-01",
      "end": "2026-12-31",
      "status": "예정",
      "priority": "보통",
      "completionCriteria": "21개 성과지표의 최종 실적, 기관별 수행내용, 필수 산출물과 증빙자료를 취합하여 최종보고서를 작성·제출한 상태. 각 정량지표는 목표치 대비 최종값과 확인 증빙을 함께 정리",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "",
      "note": "",
      "sourceStatus": "시작 전"
    },
    {
      "id": "ACT-016",
      "name": "키오스크 디자인/규격 논의",
      "planInstitutions": [
        "에임랩"
      ],
      "owner": "에임랩",
      "collaborators": [],
      "start": "2026-08-26",
      "end": "2026-09-09",
      "status": "진행 중",
      "priority": "보통",
      "completionCriteria": "상담센터용 AI 키오스크의 외형 디자인, 하드웨어 구성, 적용 기기 및 주요 규격안을 확정한 상태",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "",
      "note": "",
      "sourceStatus": "진행 중"
    },
    {
      "id": "ACT-017",
      "name": "기관별 수집 데이터 형식 통합 및 품질 관리",
      "planInstitutions": [
        "돌봄과 미래",
        "정션메드"
      ],
      "owner": "",
      "collaborators": [
        "돌봄과 미래",
        "정션메드"
      ],
      "start": "2026-07-01",
      "end": "2026-07-31",
      "status": "진행 중",
      "priority": "보통",
      "completionCriteria": "기관별 수집 데이터의 항목·형식·레이블 기준을 통합하고 정합성 및 품질 점검 기준을 적용한 상태. 표준 척도 학습데이터셋은 척도별 300건 이상, 데이터 정합성 오류율 10% 이하 여부를 확인할 수 있도록 관리",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "음성·생체 데이터 수집 및 비식별 처리 체계 구축",
      "note": "",
      "sourceStatus": "진행 중"
    },
    {
      "id": "ACT-018",
      "name": "실증 대상자 모집 및 기관 온보딩",
      "planInstitutions": [
        "경복대학교",
        "정션메드"
      ],
      "owner": "",
      "collaborators": [
        "경복대학교",
        "정션메드"
      ],
      "start": "2026-06-01",
      "end": "2026-06-30",
      "status": "진행 중",
      "priority": "보통",
      "completionCriteria": "실증 참여기관과 대상자 모집·온보딩을 진행하고 기관별 담당자, 적용 채널 및 운영 준비상태를 확인한 상태. 리빙랩 최종목표인 참여기관 11개소 이상, 수혜 대상자 1,000명 이상 대비 모집·온보딩 현황을 집계",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "리빙랩 운영 규모",
      "note": "",
      "sourceStatus": "진행 중"
    },
    {
      "id": "ACT-019",
      "name": "표준 척도 기반 타당도·신뢰도 중간 검증",
      "planInstitutions": [
        "경복대학교"
      ],
      "owner": "경복대학교",
      "collaborators": [],
      "start": "2026-10-14",
      "end": "2026-10-31",
      "status": "예정",
      "priority": "보통",
      "completionCriteria": "표준 척도와 AI 결과의 중간 데이터를 확보하여 상관관계와 내적 일치도 분석을 수행하고 중간 검증 결과를 정리한 상태. 최종 타당도 기준인 표준 척도 간 상관관계 r ≥ 0.8 달성 가능 여부를 중간 결과에서 확인",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "도구 타당도/신뢰도",
      "note": "",
      "sourceStatus": "시작 전"
    },
    {
      "id": "ACT-020",
      "name": "실증 운영 지속 (케어원·상담센터·키오스크·케어콜)",
      "planInstitutions": [
        "경복대학교",
        "정션메드"
      ],
      "owner": "",
      "collaborators": [
        "경복대학교",
        "정션메드"
      ],
      "start": "2026-06-01",
      "end": "2026-11-30",
      "status": "진행 중",
      "priority": "보통",
      "completionCriteria": "케어원·상담센터·키오스크·케어콜 채널의 실증을 계획 기간 동안 운영하고 기관·대상자·사용·데이터 실적을 누적 관리한 상태. 리빙랩 기준 참여기관 11개소 이상, 수혜 대상자 1,000명 이상, 누적 실증 데이터 3,000건 이상을 포함한 주요 정량지표를 상시 집계",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "리빙랩 운영 규모",
      "note": "",
      "sourceStatus": "진행 중"
    },
    {
      "id": "ACT-021",
      "name": "신규 기능 개발 및 키오스크 연동 모듈 개발",
      "planInstitutions": [
        "에임랩",
        "정션메드"
      ],
      "owner": "",
      "collaborators": [
        "에임랩",
        "정션메드"
      ],
      "start": "2026-06-01",
      "end": "2026-08-31",
      "status": "진행 중",
      "priority": "보통",
      "completionCriteria": "키오스크 연동에 필요한 신규 기능과 소프트웨어 연동 모듈을 구현하고 주요 데이터 송수신 및 서비스 연동을 내부 확인한 상태",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "B2B/B2G대상 실증",
      "note": "",
      "sourceStatus": "진행 중"
    },
    {
      "id": "ACT-022",
      "name": "실증 운영 마무리 및 결과 보고",
      "planInstitutions": [
        "정션메드"
      ],
      "owner": "정션메드",
      "collaborators": [],
      "start": "2026-11-01",
      "end": "2026-11-30",
      "status": "예정",
      "priority": "보통",
      "completionCriteria": "실증 운영을 종료하고 기관별 운영실적, 대상자, 사용건수, 누적 데이터, 주요 이슈와 후속조치를 결과자료로 정리한 상태. 기관 11개 이상, 수혜자 1,000명 이상, 누적 데이터 3,000건 이상 등 실증 정량목표의 최종 실적을 확인 가능하게 정리",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "리빙랩 운영 규모",
      "note": "",
      "sourceStatus": "시작 전"
    },
    {
      "id": "ACT-023",
      "name": "실증 운영 현황 모니터링 및 총괄 관리",
      "planInstitutions": [
        "경복대학교",
        "정션메드"
      ],
      "owner": "",
      "collaborators": [
        "경복대학교",
        "정션메드"
      ],
      "start": "2026-07-01",
      "end": "2026-11-30",
      "status": "진행 중",
      "priority": "보통",
      "completionCriteria": "기관별 실증 일정, 대상자, 서비스 사용, 데이터 수집 및 주요 이슈를 정기적으로 확인하고 미진사항 조치현황을 관리한 상태",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "리빙랩 운영 규모",
      "note": "",
      "sourceStatus": "진행 중"
    },
    {
      "id": "ACT-024",
      "name": "중간 데이터 표준화 결과 점검",
      "planInstitutions": [
        "돌봄과 미래",
        "정션메드"
      ],
      "owner": "",
      "collaborators": [
        "돌봄과 미래",
        "정션메드"
      ],
      "start": "2026-08-31",
      "end": "2026-09-16",
      "status": "진행 중",
      "priority": "보통",
      "completionCriteria": "중간 시점의 기관별 수집 데이터 형식·레이블·정합성 상태를 점검하고 표준화 보완사항 및 조치계획을 정리한 상태. 학습데이터셋 정합성 오류율 10% 이하 목표 대비 품질점검 결과를 확인 가능하게 관리",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "표준화 가능성",
      "note": "",
      "sourceStatus": "진행 중"
    },
    {
      "id": "ACT-025",
      "name": "사용자·실무자 만족도 조사 실시",
      "planInstitutions": [
        "경복대학교"
      ],
      "owner": "경복대학교",
      "collaborators": [],
      "start": "2026-11-18",
      "end": "2026-12-16",
      "status": "예정",
      "priority": "보통",
      "completionCriteria": "현장 종사자와 수혜자 대상 사용자 수용성·조작 용이성·지속 활용 의향 조사를 실시하고 유효 응답자료를 확보한 상태. 조작 용이성 5점 척도 4점 이상, 정식 도입·재이용 의사 70% 이상 여부를 산출할 수 있도록 결과를 집계",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "(가중치)사용자 수용성",
      "note": "",
      "sourceStatus": "시작 전"
    },
    {
      "id": "ACT-026",
      "name": "데이터 수집 체계 구축",
      "planInstitutions": [
        "돌봄과 미래",
        "정션메드"
      ],
      "owner": "",
      "collaborators": [
        "돌봄과 미래",
        "정션메드"
      ],
      "start": "2026-06-01",
      "end": "2026-06-30",
      "status": "진행 중",
      "priority": "보통",
      "completionCriteria": "마음로그·케어원·키오스크·케어콜의 수집 항목과 비식별 처리 기준을 정의하고 음성·생체·검사·일기 데이터 수집 체계를 구축한 상태. 음성·생체 데이터 1,000건 이상, 비식별 처리율 95% 이상 성과목표를 집계·검증할 수 있는 구조 확보",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "음성·생체 데이터 수집 및 비식별 처리 체계 구축",
      "note": "",
      "sourceStatus": "진행 중"
    },
    {
      "id": "ACT-027",
      "name": "실증 결과 취합 및 성과 분석",
      "planInstitutions": [
        "경복대학교",
        "정션메드"
      ],
      "owner": "",
      "collaborators": [
        "경복대학교",
        "정션메드"
      ],
      "start": "2026-11-01",
      "end": "2026-11-30",
      "status": "예정",
      "priority": "보통",
      "completionCriteria": "실증기관별 운영결과와 성과지표 측정자료를 취합하고 성과분석 결과를 정리한 상태. 실증 전후 변화 p < 0.05, 사용자 수용성 4점 이상, 업무 프로세스 시간 20% 이상 단축, 지속 활용 의향 70% 이상 등 결과지표의 산출값과 근거자료를 확인 가능하게 정리",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "실증 전후 변화",
      "note": "",
      "sourceStatus": "시작 전"
    },
    {
      "id": "ACT-028",
      "name": "성과보고회 개최",
      "planInstitutions": [
        "정션메드"
      ],
      "owner": "정션메드",
      "collaborators": [],
      "start": "2026-12-01",
      "end": "2026-12-31",
      "status": "예정",
      "priority": "보통",
      "completionCriteria": "성과보고회를 개최하고 21개 성과지표의 달성현황, 주요 산출물, 실증 정량실적 및 향후 확산계획을 공유한 상태",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "",
      "note": "",
      "sourceStatus": "시작 전"
    },
    {
      "id": "ACT-029",
      "name": "케어콜 기반 실증 운영 개시",
      "planInstitutions": [
        "경복대학교",
        "정션메드"
      ],
      "owner": "",
      "collaborators": [
        "경복대학교",
        "정션메드"
      ],
      "start": "2026-06-01",
      "end": "2026-06-30",
      "status": "진행 중",
      "priority": "보통",
      "completionCriteria": "케어콜 기반 고령자 실증을 개시하고 상담·특이사항 자동입력 서비스 사용 이력을 수집하기 시작한 상태. 자동 특이사항 입력 300건 이상 목표 대비 누적 건수를 확인할 수 있는 로그 집계 구조 확보",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "케어콜 자동 특이사항(모니터링,관심사) 입력",
      "note": "",
      "sourceStatus": "진행 중"
    },
    {
      "id": "ACT-030",
      "name": "실증 데이터 수집 기준 및 표준화 체계 수립",
      "planInstitutions": [
        "경복대학교",
        "돌봄과 미래"
      ],
      "owner": "",
      "collaborators": [
        "경복대학교",
        "돌봄과 미래"
      ],
      "start": "2026-06-01",
      "end": "2026-07-31",
      "status": "진행 중",
      "priority": "보통",
      "completionCriteria": "실증 데이터의 수집 항목, 형식, 레이블, 비식별 처리 및 품질관리 기준을 문서화하고 기관 공통 적용기준을 수립한 상태. 복지 현장용 AI 데이터 레이블링 표준 지침 및 운영 매뉴얼 1건 이상 제작으로 연결 가능한 문서체계 확보",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "표준화 가능성",
      "note": "",
      "sourceStatus": "진행 중"
    },
    {
      "id": "ACT-031",
      "name": "AI 서비스 1차 고도화 완료 및 내부 테스트",
      "planInstitutions": [
        "정션메드"
      ],
      "owner": "정션메드",
      "collaborators": [],
      "start": "2026-09-16",
      "end": "2026-09-30",
      "status": "예정",
      "priority": "보통",
      "completionCriteria": "AI 서비스 1차 고도화 기능을 적용하고 감정분석·음성인식·위험신호·보고서 등 주요 기능의 내부 테스트를 완료한 상태. 공인 성능평가 전 AI 감정 분류 정확도 70% 이상 목표를 점검할 수 있는 내부 시험결과 확보",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "(가중치)AI 감정 분석 성능 검증",
      "note": "",
      "sourceStatus": "시작 전"
    },
    {
      "id": "ACT-032",
      "name": "키오스크 하드웨어 설계",
      "planInstitutions": [
        "에임랩"
      ],
      "owner": "에임랩",
      "collaborators": [],
      "start": "2026-09-10",
      "end": "2026-09-30",
      "status": "예정",
      "priority": "보통",
      "completionCriteria": "상담센터용 키오스크의 하드웨어 구성과 구조·부품·적용 기기 사양을 설계하고 제작 가능한 설계안을 확정한 상태",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "",
      "note": "",
      "sourceStatus": "시작 전"
    },
    {
      "id": "ACT-033",
      "name": "키오스크 완성품 제작",
      "planInstitutions": [
        "에임랩"
      ],
      "owner": "에임랩",
      "collaborators": [],
      "start": "2026-11-02",
      "end": "2026-11-30",
      "status": "예정",
      "priority": "보통",
      "completionCriteria": "확정된 설계·규격에 따라 상담센터용 키오스크 완성품을 제작하고 현장 설치가 가능한 상태로 점검을 완료한 상태",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "",
      "note": "",
      "sourceStatus": "시작 전"
    },
    {
      "id": "ACT-034",
      "name": "4차 자문회의",
      "planInstitutions": [
        "경복대학교",
        "돌봄과 미래"
      ],
      "owner": "",
      "collaborators": [
        "경복대학교",
        "돌봄과 미래"
      ],
      "start": "2026-10-28",
      "end": "2026-10-28",
      "status": "예정",
      "priority": "보통",
      "completionCriteria": "4차 자문회의를 개최하고 실증·데이터·서비스 운영에 대한 자문의견과 후속 반영사항을 정리한 상태",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "",
      "note": "",
      "sourceStatus": "시작 전"
    },
    {
      "id": "ACT-035",
      "name": "3차 자문회의",
      "planInstitutions": [
        "경복대학교",
        "돌봄과 미래"
      ],
      "owner": "",
      "collaborators": [
        "경복대학교",
        "돌봄과 미래"
      ],
      "start": "2026-09-16",
      "end": "2026-09-16",
      "status": "예정",
      "priority": "보통",
      "completionCriteria": "3차 자문회의를 개최하고 실증·데이터 표준화 진행상황에 대한 자문의견과 후속 반영사항을 정리한 상태",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "",
      "note": "",
      "sourceStatus": "시작 전"
    },
    {
      "id": "ACT-036",
      "name": "전후 설문지 최종안 수정/검토",
      "planInstitutions": [
        "경복대학교",
        "돌봄과 미래",
        "정션메드"
      ],
      "owner": "",
      "collaborators": [
        "경복대학교",
        "돌봄과 미래",
        "정션메드"
      ],
      "start": "2026-08-19",
      "end": "2026-08-26",
      "status": "진행 중",
      "priority": "보통",
      "completionCriteria": "실증 전후 변화, 사용자 수용성, 현장 적용성 및 지속 활용 의향을 측정할 수 있도록 설문 문항과 조사방식을 확정한 상태. p < 0.05 검증, 조작 용이성 4점 이상, 업무시간 20% 이상 단축, 재이용 의사 70% 이상 산출에 필요한 측정항목 포함",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "실증 전후 변화",
      "note": "",
      "sourceStatus": "진행 중"
    },
    {
      "id": "ACT-037",
      "name": "IRB 신청",
      "planInstitutions": [
        "경복대학교"
      ],
      "owner": "경복대학교",
      "collaborators": [],
      "start": "2026-08-27",
      "end": "2026-09-09",
      "status": "진행 중",
      "priority": "보통",
      "completionCriteria": "실증 및 조사 수행에 필요한 IRB 신청서류를 제출하고 접수 확인자료를 확보한 상태",
      "evidence": "",
      "blocker": "",
      "pmCheck": false,
      "relatedKpi": "",
      "note": "",
      "sourceStatus": "진행 중"
    }
  ],
  "requests": [],
  "memos": [],
  "meetings": [
    {
      "id": "MTG-01",
      "name": "8월 1주차_정기 회의",
      "date": "2026-08-05",
      "location": "",
      "participants": "컨소시엄 전체",
      "link": ""
    },
    {
      "id": "MTG-02",
      "name": "8월 3주차_대면 회의",
      "date": "2026-08-19",
      "location": "서울시 마포구 삼개로 16, 근신빌딩 신관 303호 정션메드 (소울한우 건물 3층)\nhttps://naver.me/5sspDsJr",
      "participants": "경복대학교",
      "link": ""
    },
    {
      "id": "MTG-03",
      "name": "정기 회의",
      "date": "2026-09-02",
      "location": "",
      "participants": "",
      "link": ""
    },
    {
      "id": "MTG-04",
      "name": "정기 회의",
      "date": "2026-09-16",
      "location": "",
      "participants": "",
      "link": ""
    },
    {
      "id": "MTG-05",
      "name": "8월 2주차_서면 회의록",
      "date": "2026-08-12",
      "location": "비대면 진행",
      "participants": "컨소시엄 전체",
      "link": ""
    },
    {
      "id": "MTG-06",
      "name": "자문회의",
      "date": "2026-08-19",
      "location": "정션메드",
      "participants": "컨소시엄 전체",
      "link": ""
    },
    {
      "id": "MTG-07",
      "name": "8월 4주차_회의록",
      "date": "2026-08-26",
      "location": "",
      "participants": "컨소시엄 전체",
      "link": ""
    },
    {
      "id": "MTG-08",
      "name": "AX 2차 상황점검회의",
      "date": "2026-08-25",
      "location": "서울역 스페이스원 에메랄드룸",
      "participants": "정션메드",
      "link": ""
    },
    {
      "id": "MTG-09",
      "name": "AX 주관기관 현장방문",
      "date": "2026-08-26",
      "location": "",
      "participants": "정션메드",
      "link": ""
    }
  ],
  "documents": [
    {
      "id": "DOC-01",
      "name": "전/후 설문조사 1차_0706",
      "date": "2026-07-06",
      "source": "AX%20Sprint%20%EC%BB%A8%EC%86%8C%EC%8B%9C%EC%9B%80%20%EA%B3%B5%EC%9C%A0/%EC%A0%9C%EB%AA%A9%20%EC%97%86%EC%9D%8C/%EC%A0%84%20%ED%9B%84%20%EC%84%A4%EB%AC%B8%EC%A1%B0%EC%82%AC%201%EC%B0%A8_0706/AX_%E1%84%89%E1%85%B3%E1%84%91%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%90%E1%85%B3_%E1%84%8C%E1%85%A5%E1%86%AB%E1%84%92%E1%85%AE_%E1%84%89%E1%85%A5%E1%86%AF%E1%84%86%E1%85%AE%E1%86%AB_%E1%84%8E%E1%85%A9%E1%84%8B%E1%85%A1%E1%86%AB.zip",
      "type": "문서"
    },
    {
      "id": "DOC-02",
      "name": "전/후 설문조사지 피드백 반영_2차_0715",
      "date": "2026-07-15",
      "source": "AX%20Sprint%20%EC%BB%A8%EC%86%8C%EC%8B%9C%EC%9B%80%20%EA%B3%B5%EC%9C%A0/%EC%A0%9C%EB%AA%A9%20%EC%97%86%EC%9D%8C/%EC%A0%84%20%ED%9B%84%20%EC%84%A4%EB%AC%B8%EC%A1%B0%EC%82%AC%EC%A7%80%20%ED%94%BC%EB%93%9C%EB%B0%B1%20%EB%B0%98%EC%98%81_2%EC%B0%A8_0715/%E1%84%89%E1%85%A5%E1%86%AF%E1%84%86%E1%85%AE%E1%86%AB%E1%84%8C%E1%85%B5.zip",
      "type": "문서"
    },
    {
      "id": "DOC-03",
      "name": "상황점검회의(1차 안내사항)",
      "date": "2026-07-30",
      "source": "AX%20Sprint%20%EC%BB%A8%EC%86%8C%EC%8B%9C%EC%9B%80%20%EA%B3%B5%EC%9C%A0/%EC%A0%9C%EB%AA%A9%20%EC%97%86%EC%9D%8C/%EC%83%81%ED%99%A9%EC%A0%90%EA%B2%80%ED%9A%8C%EC%9D%98(1%EC%B0%A8%20%EC%95%88%EB%82%B4%EC%82%AC%ED%95%AD)/%E1%84%87%E1%85%A9%E1%86%A8%E1%84%8C%E1%85%B5%E1%84%87%E1%85%AE%E1%86%AB%E1%84%8B%E1%85%A3_AX-Sprint_%E1%84%8C%E1%85%B5%E1%84%8B%E1%85%AF%E1%86%AB%E1%84%89%E1%85%A1%E1%84%8B%E1%85%A5%E1%86%B8_%E1%84%89%E1%85%A1%E1%86%BC%E1%84%92%E1%85%AA%E1%86%BC%E1%84%8C%E1%85%A5%E1%86%B7%E1%84%80%E1%85%A5%E1%86%B7%E1%84%92%E1%85%AC%E1%84%8B%E1%85%B4(1%E1%84%8E%E1%85%A1)_%E1%84%8B%E1%85%A1%E1%86%AB%E1%84%82%E1%85%A2%E1%84%89%E1%85%A1%E1%84%92%E1%85%A1%E1%86%BC_260730.pdf",
      "type": "문서"
    }
  ]
};
