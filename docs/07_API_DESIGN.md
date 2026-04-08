# 7. API 설계

> Supabase 기반이므로 대부분 Supabase Client SDK로 직접 DB 접근.
> 복잡한 로직은 Supabase Edge Functions (Deno) 사용.

## API 방식 분류

| 방식 | 사용 시점 |
|------|---------|
| **Supabase Client SDK** (직접 쿼리) | 단순 CRUD (조회, 단건 INSERT/UPDATE) |
| **Supabase Edge Function** (서버리스) | 복잡한 비즈니스 로직, 트랜잭션, 외부 API 호출 |
| **Supabase Cron (pg_cron)** | 스케줄 작업 (만료 처리, 알림) |

---

## 7-1. 인증 (Auth)

### POST `/auth/v1/signup` (Supabase Auth 내장)

소셜 로그인은 Supabase Auth가 처리. 앱에서는 SDK 호출만.

```typescript
// 클라이언트 코드 예시
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'kakao', // 'google' | 'apple'
  options: {
    redirectTo: 'praiseapp://auth/callback'
  }
})
```

### Edge Function: `POST /functions/v1/setup-profile`

| 항목 | 내용 |
|------|------|
| **목적** | 첫 로그인 후 프로필 설정 |
| **요청** | `{ nickname: string, profile_image_url?: string }` |
| **응답** | `{ user: User }` |
| **권한** | 인증된 사용자 |
| **로직** | users 테이블에 닉네임 저장. 닉네임 중복 허용 (UUID로 식별). |

---

## 7-2. 관계 연동

### Edge Function: `POST /functions/v1/create-invite`

| 항목 | 내용 |
|------|------|
| **목적** | 초대코드 생성 |
| **요청** | `{}` (인증 토큰만 필요) |
| **응답** | `{ code: "A3K7F2", expires_at: "2024-01-02T00:00:00Z" }` |
| **권한** | 인증된 사용자, 현재 connected 관계가 없는 사용자 |
| **로직** | 6자리 랜덤 코드 생성 → invite_codes INSERT → 기존 active 코드 있으면 만료 처리 |
| **에러** | 이미 연동된 상대가 있음 (409), 코드 생성 실패 (500) |

### Edge Function: `POST /functions/v1/accept-invite`

| 항목 | 내용 |
|------|------|
| **목적** | 초대코드로 관계 연동 |
| **요청** | `{ code: "A3K7F2" }` |
| **응답** | `{ relationship: Relationship, partner: { nickname, profile_image_url } }` |
| **권한** | 인증된 사용자, 현재 connected 관계가 없는 사용자 |
| **로직** | 코드 유효성 검증 → relationships 2개 INSERT (양방향) → invite_code 상태 변경 → 알림 전송 |
| **에러** | 코드 만료 (410), 코드 없음 (404), 자기 자신 코드 (400), 이미 연동됨 (409) |
| **트랜잭션** | 필수 (relationship 2개 INSERT + invite_code UPDATE + notification INSERT) |

### Edge Function: `POST /functions/v1/end-relationship`

| 항목 | 내용 |
|------|------|
| **목적** | 관계 해제 |
| **요청** | `{ relationship_id: UUID }` |
| **응답** | `{ success: true }` |
| **권한** | 해당 relationship의 user_id 본인만 |
| **로직** | 양쪽 relationship → ended. 진행 중 보드 전부 → cancelled. 알림 전송. |
| **경고** | 되돌릴 수 없음. 프론트에서 2중 확인 필수. |

---

## 7-3. 스티커판

### Supabase Client: 스티커판 목록 조회

```typescript
const { data } = await supabase
  .from('sticker_boards')
  .select('*, rewards(*), penalties(*)')
  .or(`collector_id.eq.${userId},giver_id.eq.${userId}`)
  .eq('status', 'active')
  .order('created_at', { ascending: false })
```

### Edge Function: `POST /functions/v1/create-board`

| 항목 | 내용 |
|------|------|
| **목적** | 새 스티커판 생성 |
| **요청** | 아래 참조 |
| **응답** | `{ board: StickerBoard, reward: Reward, penalty?: Penalty }` |
| **권한** | 인증 + connected 관계 필요 |

**요청 바디**:
```json
{
  "title": "지은이 운동 챌린지",
  "collector_id": "uuid-지은",
  "target_count": 20,
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "sticker_preset": "star_gold",
  "sticker_image_url": null,
  "reward_description": "청담 오마카세",
  "reward_type": "promise",
  "has_penalty": true,
  "penalty_description": "치킨 쏘기"
}
```

**로직**:
1. 요청자와 collector_id가 connected 관계인지 확인
2. giver_id = 요청자가 collector가 아닌 쪽 (자동 결정)
3. sticker_boards INSERT (status: draft)
4. rewards INSERT (status: waiting)
5. has_penalty = true면 penalties INSERT (status: inactive)
6. 상대방에게 알림 전송

### Edge Function: `POST /functions/v1/accept-board`

| 항목 | 내용 |
|------|------|
| **목적** | 스티커판 수락 |
| **요청** | `{ board_id: UUID }` |
| **응답** | `{ board: StickerBoard }` |
| **권한** | 스티커판의 상대방 (collector 또는 giver 중 생성자가 아닌 쪽) |
| **로직** | board.status: draft → active. 생성자에게 알림. |

### Edge Function: `POST /functions/v1/cancel-board`

| 항목 | 내용 |
|------|------|
| **목적** | 스티커판 취소 |
| **요청** | `{ board_id: UUID }` |
| **응답** | `{ board: StickerBoard }` |
| **권한** | 해당 board의 collector 또는 giver |
| **로직** | draft/active → cancelled. 상대방에게 알림. |

---

## 7-4. 스티커

### Edge Function: `POST /functions/v1/give-sticker`

| 항목 | 내용 |
|------|------|
| **목적** | 스티커 1개 부여 |
| **요청** | `{ board_id: UUID, memo?: string }` |
| **응답** | `{ sticker: Sticker, board: StickerBoard, goal_achieved: boolean }` |
| **권한** | 해당 board의 giver_id 본인만 |

**로직**:
1. board가 active 상태인지 확인
2. board의 end_date가 지나지 않았는지 확인
3. stickers INSERT (sequence = current_count + 1)
4. sticker_boards.current_count += 1
5. current_count ≥ target_count이면:
   - board.status → success
   - reward.status → pending
   - 축하 알림 전송 (양쪽)
6. 달성 아니면:
   - 스티커 받음 알림 전송 (collector에게)

**주의**: 트랜잭션 필수. 동시 요청 방지를 위해 board row-level lock 또는 unique constraint.

### Supabase Client: 스티커 목록 조회

```typescript
const { data } = await supabase
  .from('stickers')
  .select('*')
  .eq('board_id', boardId)
  .order('sequence', { ascending: true })
```

---

## 7-5. 보상 / 패널티

### Edge Function: `POST /functions/v1/complete-reward`

| 항목 | 내용 |
|------|------|
| **목적** | 보상 이행 완료 처리 |
| **요청** | `{ reward_id: UUID, proof_image_url?: string }` |
| **응답** | `{ reward: Reward }` |
| **권한** | reward.provider_id 본인만 |
| **로직** | reward.status: pending → completed. reward_logs INSERT. 알림. |

### Edge Function: `POST /functions/v1/complete-penalty`

| 항목 | 내용 |
|------|------|
| **목적** | 패널티 이행 완료 처리 |
| **요청** | `{ penalty_id: UUID, proof_image_url?: string }` |
| **응답** | `{ penalty: Penalty }` |
| **권한** | penalty.responsible_id 본인만 |
| **로직** | penalty.status: pending → completed. reward_logs INSERT. 알림. |

---

## 7-6. 알림

### Supabase Client: 알림 목록 조회

```typescript
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .range(0, 19) // 페이지네이션
```

### Supabase Client: 알림 읽음 처리

```typescript
await supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('id', notificationId)
  .eq('user_id', userId)
```

---

## 7-7. 스케줄 작업 (Cron)

### pg_cron: 만료 처리 (매일 00:05 KST)

```sql
-- 만료된 active 보드를 failed로 변경
UPDATE sticker_boards
SET status = 'failed', updated_at = NOW()
WHERE status = 'active'
  AND end_date < CURRENT_DATE;

-- 해당 보드의 패널티 활성화
UPDATE penalties
SET status = 'pending', updated_at = NOW()
WHERE board_id IN (
  SELECT id FROM sticker_boards
  WHERE status = 'failed'
    AND updated_at >= NOW() - INTERVAL '1 minute'
)
AND status = 'inactive';
```

### pg_cron: 만료 임박 알림 (매일 09:00 KST)

```sql
-- 3일 후 만료되는 active 보드 조회 → Edge Function 호출로 알림 전송
SELECT id, collector_id, giver_id, title
FROM sticker_boards
WHERE status = 'active'
  AND end_date = CURRENT_DATE + INTERVAL '3 days';
```

---

## API 요약표

| API | 방식 | Method | 인증 | 트랜잭션 |
|-----|------|--------|------|---------|
| 소셜 로그인 | Supabase Auth | - | N | N |
| 프로필 설정 | Edge Function | POST | Y | N |
| 초대코드 생성 | Edge Function | POST | Y | N |
| 초대 수락 | Edge Function | POST | Y | Y |
| 관계 해제 | Edge Function | POST | Y | Y |
| 보드 목록 조회 | Client SDK | SELECT | Y | N |
| 보드 생성 | Edge Function | POST | Y | Y |
| 보드 수락 | Edge Function | POST | Y | N |
| 보드 취소 | Edge Function | POST | Y | Y |
| 스티커 부여 | Edge Function | POST | Y | Y |
| 스티커 목록 | Client SDK | SELECT | Y | N |
| 보상 완료 | Edge Function | POST | Y | Y |
| 패널티 완료 | Edge Function | POST | Y | Y |
| 알림 목록 | Client SDK | SELECT | Y | N |
| 알림 읽음 | Client SDK | UPDATE | Y | N |
| 만료 처리 | pg_cron | - | - | Y |
| 만료 임박 알림 | pg_cron + Edge Fn | - | - | N |
