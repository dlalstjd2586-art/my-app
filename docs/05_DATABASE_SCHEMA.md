# 5. 데이터 구조 설계

## 전체 ERD 관계

```
users ──1:N── relationships (user_id, partner_id)
  │
  └──1:N── sticker_boards
              │
              ├──1:N── stickers
              ├──1:1── rewards
              └──1:1── penalties
                          │
              reward_logs ─┘ (보상/패널티 이행 기록)
  │
  └──1:N── notifications
  
ad_events (광고 노출/클릭 로그)
invite_codes (초대코드 관리)
```

---

## 테이블 상세

### 5-1. users

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | UUID (PK) | Y | Supabase Auth에서 자동 생성 |
| email | VARCHAR(255) | N | OAuth에서 가져옴 (없을 수 있음) |
| nickname | VARCHAR(30) | Y | 사용자 닉네임 |
| profile_image_url | TEXT | N | 프로필 사진 URL |
| auth_provider | VARCHAR(20) | Y | 'kakao' / 'google' / 'apple' |
| push_token | TEXT | N | FCM/APNs 토큰 |
| notification_sticker | BOOLEAN | Y | 스티커 알림 ON/OFF (기본 true) |
| notification_expiry | BOOLEAN | Y | 만료 임박 알림 ON/OFF (기본 true) |
| created_at | TIMESTAMP | Y | 가입일시 |
| updated_at | TIMESTAMP | Y | 수정일시 |
| deleted_at | TIMESTAMP | N | 소프트 삭제 (탈퇴일시) |

---

### 5-2. invite_codes

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | UUID (PK) | Y | |
| code | VARCHAR(6) | Y | 6자리 영숫자 코드 (UNIQUE) |
| creator_id | UUID (FK → users) | Y | 코드 생성자 |
| expires_at | TIMESTAMP | Y | 만료 시간 (생성 후 24시간) |
| used_by | UUID (FK → users) | N | 코드 사용자 (사용 시 업데이트) |
| used_at | TIMESTAMP | N | 코드 사용 시간 |
| status | VARCHAR(20) | Y | 'active' / 'used' / 'expired' |
| created_at | TIMESTAMP | Y | |

**인덱스**: code (UNIQUE), creator_id, status + expires_at

---

### 5-3. relationships

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | UUID (PK) | Y | |
| user_id | UUID (FK → users) | Y | 사용자 A |
| partner_id | UUID (FK → users) | Y | 사용자 B |
| status | VARCHAR(20) | Y | 'pending' / 'connected' / 'ended' |
| nickname_for_partner | VARCHAR(30) | N | 상대방 호칭 (예: "자기야") |
| connected_at | TIMESTAMP | N | 연동 완료 시간 |
| ended_at | TIMESTAMP | N | 관계 해제 시간 |
| created_at | TIMESTAMP | Y | |

**제약조건**: UNIQUE(user_id, partner_id) - 동일 관계 중복 방지
**참고**: 관계는 양방향으로 2개 row 저장. A→B, B→A 각각 1개씩. 이렇게 해야 각자의 호칭 설정 가능.

---

### 5-4. sticker_boards

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | UUID (PK) | Y | |
| relationship_id | UUID (FK → relationships) | Y | 연동 관계 |
| creator_id | UUID (FK → users) | Y | 스티커판 생성자 |
| collector_id | UUID (FK → users) | Y | 스티커를 모으는 사람 |
| giver_id | UUID (FK → users) | Y | 스티커를 주는 사람 |
| title | VARCHAR(50) | Y | 스티커판 이름 |
| target_count | INTEGER | Y | 목표 스티커 수 (5~100) |
| current_count | INTEGER | Y | 현재 모은 스티커 수 (기본 0) |
| sticker_image_url | TEXT | N | 커스텀 스티커 이미지 URL |
| sticker_preset | VARCHAR(20) | N | 기본 스티커 프리셋 ID (커스텀 없으면 이것 사용) |
| start_date | DATE | Y | 시작일 |
| end_date | DATE | Y | 종료일 |
| status | VARCHAR(20) | Y | 'draft' / 'active' / 'success' / 'failed' / 'cancelled' |
| has_penalty | BOOLEAN | Y | 패널티 존재 여부 (기본 false) |
| created_at | TIMESTAMP | Y | |
| updated_at | TIMESTAMP | Y | |

**인덱스**: relationship_id + status, collector_id, giver_id, status + end_date (만료 처리용)

---

### 5-5. stickers

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | UUID (PK) | Y | |
| board_id | UUID (FK → sticker_boards) | Y | 소속 스티커판 |
| giver_id | UUID (FK → users) | Y | 스티커를 준 사람 |
| memo | VARCHAR(100) | N | 짧은 메모 |
| sequence | INTEGER | Y | 몇 번째 스티커인지 (1부터) |
| created_at | TIMESTAMP | Y | 스티커 부여 시간 |

**인덱스**: board_id + sequence, board_id + created_at

---

### 5-6. rewards

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | UUID (PK) | Y | |
| board_id | UUID (FK → sticker_boards) | Y | 소속 스티커판 (UNIQUE) |
| description | VARCHAR(200) | Y | 보상 내용 텍스트 |
| reward_type | VARCHAR(20) | Y | 'promise' / 'link' / 'gifticon_code' |
| reward_data | TEXT | N | URL 또는 기프티콘 코드 등 추가 데이터 |
| status | VARCHAR(20) | Y | 'waiting' / 'pending' / 'completed' / 'skipped' |
| provider_id | UUID (FK → users) | Y | 보상을 제공할 사람 |
| completed_at | TIMESTAMP | N | 보상 완료 시간 |
| proof_image_url | TEXT | N | 보상 인증 사진 URL |
| created_at | TIMESTAMP | Y | |
| updated_at | TIMESTAMP | Y | |

**상태 흐름**: waiting(목표 진행 중) → pending(목표 달성됨, 보상 대기) → completed(보상 이행됨)

---

### 5-7. penalties

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | UUID (PK) | Y | |
| board_id | UUID (FK → sticker_boards) | Y | 소속 스티커판 (UNIQUE) |
| description | VARCHAR(200) | Y | 패널티 내용 텍스트 |
| status | VARCHAR(20) | Y | 'inactive' / 'pending' / 'completed' / 'skipped' |
| responsible_id | UUID (FK → users) | Y | 패널티를 이행할 사람 (스티커 모으는 사람) |
| completed_at | TIMESTAMP | N | 패널티 이행 시간 |
| proof_image_url | TEXT | N | 패널티 인증 사진 URL |
| created_at | TIMESTAMP | Y | |
| updated_at | TIMESTAMP | Y | |

**상태 흐름**: inactive(목표 진행 중) → pending(목표 실패, 패널티 대기) → completed(패널티 이행됨)

---

### 5-8. reward_logs

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | UUID (PK) | Y | |
| board_id | UUID (FK → sticker_boards) | Y | |
| type | VARCHAR(20) | Y | 'reward' / 'penalty' |
| actor_id | UUID (FK → users) | Y | 이행한 사람 |
| description | VARCHAR(200) | Y | 보상/패널티 내용 |
| proof_image_url | TEXT | N | 인증 사진 |
| completed_at | TIMESTAMP | Y | 이행 시간 |
| created_at | TIMESTAMP | Y | |

---

### 5-9. notifications

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | UUID (PK) | Y | |
| user_id | UUID (FK → users) | Y | 알림 수신자 |
| type | VARCHAR(30) | Y | 알림 유형 (아래 enum 참조) |
| title | VARCHAR(100) | Y | 알림 제목 |
| body | VARCHAR(200) | Y | 알림 내용 |
| data | JSONB | N | 추가 데이터 (board_id 등) |
| is_read | BOOLEAN | Y | 읽음 여부 (기본 false) |
| created_at | TIMESTAMP | Y | |

**알림 유형 enum**: 'invite_received', 'relationship_connected', 'board_created', 'board_accepted', 'sticker_received', 'goal_achieved', 'board_expiring_soon', 'board_expired', 'reward_pending', 'penalty_pending'

---

### 5-10. ad_events

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | UUID (PK) | Y | |
| user_id | UUID (FK → users) | Y | |
| ad_type | VARCHAR(20) | Y | 'banner' / 'interstitial' / 'rewarded' |
| ad_unit_id | VARCHAR(50) | Y | 광고 유닛 ID |
| event_type | VARCHAR(20) | Y | 'impression' / 'click' / 'completed' |
| screen | VARCHAR(30) | N | 노출 화면 |
| created_at | TIMESTAMP | Y | |

**참고**: 이 테이블은 자체 분석용. 광고 수익 집계는 AdMob 대시보드에서 확인.

---

## RLS (Row Level Security) 정책 - Supabase

| 테이블 | 정책 |
|--------|------|
| users | 자기 자신의 row만 READ/UPDATE 가능 |
| relationships | 자신이 user_id 또는 partner_id인 row만 접근 |
| sticker_boards | 자신이 collector_id 또는 giver_id인 row만 접근 |
| stickers | 해당 board에 접근 권한이 있는 사용자만 접근 |
| rewards/penalties | 해당 board에 접근 권한이 있는 사용자만 접근 |
| notifications | 자신의 알림만 접근 |
