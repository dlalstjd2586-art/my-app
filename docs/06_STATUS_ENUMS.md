# 6. 상태값(Status Enum) 설계

## 6-1. 초대코드 상태 (invite_code_status)

| 값 | 설명 | 전이 조건 |
|----|------|----------|
| `active` | 코드 생성됨, 사용 가능 | 초기 상태 |
| `used` | 누군가 코드를 사용하여 연동 완료 | active → used (코드 사용 시) |
| `expired` | 24시간 경과하여 만료 | active → expired (Cron 또는 조회 시 체크) |

```
active → used
active → expired
```

---

## 6-2. 관계 상태 (relationship_status)

| 값 | 설명 | 전이 조건 |
|----|------|----------|
| `pending` | 초대 보냈지만 아직 수락 전 | 초기 상태 (초대코드 사용 시) |
| `connected` | 양쪽 모두 수락, 연동 활성 | pending → connected (상대방 수락) |
| `ended` | 관계 해제됨 | connected → ended (한쪽이 해제) |

```
pending → connected → ended
pending → ended (거절/만료)
```

**주의**: `ended` 후 동일인과 재연동하려면 새 relationship row 생성 (기존 row는 히스토리로 보존)

---

## 6-3. 스티커판 상태 (board_status)

| 값 | 설명 | 전이 조건 |
|----|------|----------|
| `draft` | 생성되었으나 상대방이 아직 수락 안 함 | 초기 상태 |
| `active` | 상대방 수락, 진행 중 | draft → active (수락) |
| `success` | 기간 내 목표 달성 | active → success (current_count ≥ target_count) |
| `failed` | 기간 만료, 목표 미달성 | active → failed (end_date 초과 && current_count < target_count) |
| `cancelled` | 양쪽 합의 또는 관계 해제로 취소 | draft/active → cancelled |

```
draft → active → success
                → failed
                → cancelled
draft → cancelled (수락 전 취소)
```

**자동 전이 트리거**:
- `success`: 스티커 INSERT 시 current_count 체크
- `failed`: 서버 Cron Job (매일 00:00 UTC+9)
- `cancelled`: 사용자 액션 또는 관계 해제 이벤트

---

## 6-4. 보상 상태 (reward_status)

| 값 | 설명 | 전이 조건 |
|----|------|----------|
| `waiting` | 목표 진행 중, 보상 아직 해당 없음 | 초기 상태 |
| `pending` | 목표 달성됨, 보상 이행 대기 | waiting → pending (board → success) |
| `completed` | 보상 이행 완료 | pending → completed (제공자가 완료 버튼) |
| `skipped` | 보상 건너뜀 (양쪽 합의) | pending → skipped |

```
waiting → pending → completed
                  → skipped
waiting → (board cancelled/failed: 보상 row 상태 변화 없이 비활성화)
```

---

## 6-5. 패널티 상태 (penalty_status)

| 값 | 설명 | 전이 조건 |
|----|------|----------|
| `inactive` | 목표 진행 중, 패널티 아직 발동 안 됨 | 초기 상태 |
| `pending` | 목표 실패, 패널티 이행 대기 | inactive → pending (board → failed) |
| `completed` | 패널티 이행 완료 | pending → completed (이행자가 완료 버튼) |
| `skipped` | 패널티 면제 (양쪽 합의) | pending → skipped |

```
inactive → pending → completed
                   → skipped
inactive → (board success/cancelled: 패널티 발동 안 됨)
```

---

## 6-6. 알림 유형 (notification_type)

| 값 | 트리거 시점 | 수신자 |
|----|-----------|--------|
| `invite_received` | 초대코드 사용됨 | 코드 생성자 |
| `relationship_connected` | 관계 연동 완료 | 양쪽 모두 |
| `board_created` | 새 스티커판 생성 (수락 요청) | 상대방 |
| `board_accepted` | 스티커판 수락됨 | 생성자 |
| `sticker_received` | 스티커 받음 | 스티커 모으는 사람 |
| `goal_achieved` | 목표 달성! | 양쪽 모두 |
| `board_expiring_soon` | 만료 3일 전 | 양쪽 모두 |
| `board_expired` | 기간 만료 (실패) | 양쪽 모두 |
| `reward_pending` | 보상 이행 대기 | 보상 제공자 |
| `penalty_pending` | 패널티 이행 대기 | 패널티 이행자 |

---

## 6-7. 광고 이벤트 유형 (ad_event_type)

| 값 | 설명 |
|----|------|
| `impression` | 광고 노출 |
| `click` | 광고 클릭 |
| `completed` | 리워드형 광고 시청 완료 |

---

## 6-8. 보상 유형 (reward_type)

| 값 | 설명 | 사용 예시 |
|----|------|---------|
| `promise` | 약속형 (텍스트만) | "청담 오마카세 사주기" |
| `link` | 외부 링크 | 카카오 선물하기 URL 등 |
| `gifticon_code` | 기프티콘 코드 저장 | 바코드 번호 또는 이미지 |

---

## 전체 상태 전이 다이어그램

```
[사용자 가입]
     │
     ▼
[초대코드 생성] ──active──→ used/expired
     │
     ▼
[관계 연동] ──pending──→ connected──→ ended
     │
     ▼
[스티커판 생성] ──draft──→ active──→ success ──→ [reward: pending→completed]
                    │         │
                    │         └──→ failed ──→ [penalty: pending→completed]
                    │         │
                    │         └──→ cancelled
                    └──→ cancelled
```
