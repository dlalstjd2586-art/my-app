// MOVE app — client-side router with 5 views. All content original; thumbnails are CSS gradients.

const won = (n) => Number(n).toLocaleString("ko-KR") + "원";
const grad = (h, i = 0) =>
  `linear-gradient(150deg, hsl(${h} 55% ${40 + (i % 3) * 5}%), hsl(${h + 24} 60% ${24 + (i % 2) * 6}%))`;

/* ===================== DATA ===================== */
const CATS = ["전체", "발레", "필라테스", "요가", "스트레칭", "근력", "다이어트", "명상"];

const CLASSES = [
  { name: "아침을 여는 모닝 스트레칭", min: 12, level: "초급", cat: "스트레칭", badge: "LIVE", hue: 200 },
  { name: "코어 집중 필라테스", min: 20, level: "중급", cat: "필라테스", hue: 215 },
  { name: "전신 순환 근력 트레이닝", min: 25, level: "중급", cat: "근력", hue: 225 },
  { name: "딥 릴랙스 저녁 요가", min: 18, level: "초급", cat: "요가", hue: 160 },
  { name: "발레핏 베이직", min: 15, level: "초급", cat: "발레", badge: "NEW", hue: 320 },
  { name: "하체 집중 번 아웃", min: 22, level: "고급", cat: "근력", hue: 245 },
  { name: "굿모닝 플로우 요가", min: 16, level: "초급", cat: "요가", hue: 150 },
  { name: "탄탄 코어 필라테스", min: 24, level: "중급", cat: "필라테스", hue: 205 },
  { name: "다이어트 HIIT 번지", min: 18, level: "고급", cat: "다이어트", badge: "HOT", hue: 12 },
  { name: "마음을 비우는 명상", min: 10, level: "초급", cat: "명상", hue: 175 },
  { name: "우아한 발레 스트레칭", min: 14, level: "초급", cat: "발레", hue: 300 },
  { name: "잠들기 전 이완 스트레칭", min: 12, level: "초급", cat: "스트레칭", hue: 190 },
];

const PROGRAMS = [
  { name: "4주 체형 교정 챌린지", level: "프로그램", badge: "추천", hue: 150 },
  { name: "초보자 홈트 스타터", level: "프로그램", hue: 160 },
  { name: "코어 & 자세 바로잡기", level: "프로그램", hue: 170 },
  { name: "릴랙스 & 수면 루틴", level: "프로그램", hue: 185 },
  { name: "주 3회 다이어트 플랜", level: "프로그램", hue: 140 },
];

const PRODUCTS = [
  { name: "MOVE 논슬립 요가매트 6mm", price: 32000, retail: 45000, hue: 160 },
  { name: "MOVE 미니 폼롤러", price: 14900, retail: 19000, hue: 150 },
  { name: "MOVE 라텍스 밴드 4종 세트", price: 12900, retail: 21000, hue: 200 },
  { name: "MOVE 식물성 단백질 14팩", price: 28900, retail: 39000, hue: 215 },
  { name: "MOVE 짐볼 65cm", price: 17900, retail: 25000, hue: 175 },
  { name: "MOVE 데일리 멀티비타민", price: 19900, retail: 29000, hue: 230 },
];

const FEED = [
  { user: "지수", color: 320, time: "12분 전", text: "모닝 스트레칭 7일째 성공! 아침이 한결 가벼워졌어요 🌿", likes: 24, comments: 5, hue: 160, tag: "#모닝스트레칭" },
  { user: "현우", color: 215, time: "1시간 전", text: "코어 필라테스 끝. 오늘도 버텼다 💪", likes: 41, comments: 8, hue: 215, tag: "#필라테스" },
  { user: "유나", color: 150, time: "3시간 전", text: "딥 릴랙스 요가로 하루 마무리. 추천합니다!", likes: 18, comments: 2, hue: 175, tag: "#요가" },
  { user: "민재", color: 12, time: "어제", text: "HIIT 번지 4주차… 드디어 -3kg 달성 🔥", likes: 73, comments: 14, hue: 12, tag: "#다이어트" },
];

/* ===================== COMPONENTS ===================== */
function classCard(c, i) {
  const badge = c.badge ? `<span class="cardx__badge">${c.badge}</span>` : "";
  return `<article class="cardx">
    <div class="cardx__thumb" style="background:${grad(c.hue, i)}">${badge}<span class="cardx__lv">${c.level}</span></div>
    <p class="cardx__name">${c.name}</p>
    <p class="cardx__meta">${c.min ? c.min + "분 · " : ""}${c.cat || c.level}</p>
  </article>`;
}
const rail = (list) => `<div class="rail">${list.map(classCard).join("")}</div>`;

/* ===================== VIEWS ===================== */
function viewHome() {
  return `
    <section class="hero">
      <div class="hero__bg"></div>
      <div class="hero__inner">
        <p class="hero__eyebrow">MOVE MEMBERSHIP</p>
        <h2 class="hero__title">당신의 하루를<br />움직이는 운동 멤버십</h2>
        <p class="hero__sub">집에서 즐기는 1,800여 개 라이브 & VOD 클래스</p>
        <button class="hero__cta" data-act="trial">무료체험 시작하기</button>
      </div>
    </section>
    <section class="block">
      <p class="block__count">1,800여 개 운동 콘텐츠</p>
      <h3 class="block__title">내가 찾던 운동,<br />MOVE에 다 있어요.</h3>
      ${rail(CLASSES.slice(0, 6))}
    </section>
    <section class="block">
      <h3 class="block__title block__title--sm">목표별 추천 프로그램</h3>
      ${rail(PROGRAMS)}
    </section>
    <section class="block">
      <div class="promo-card">
        <div><strong>첫 7일은 무료예요</strong><span>부담 없이 시작하고, 언제든 해지할 수 있어요.</span></div>
        <button class="promo-card__btn" data-act="trial">시작하기</button>
      </div>
    </section>
    <div class="app__pad"></div>`;
}

function viewExplore() {
  return `
    <div class="ex">
      <form class="ex__search" onsubmit="return false;">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3" stroke-linecap="round"/></svg>
        <input type="search" id="exInput" placeholder="운동, 강사, 키워드 검색" aria-label="검색" />
      </form>
      <div class="ex__chips" id="exChips">
        ${CATS.map((c, i) => `<button class="ex__chip ${i === 0 ? "is-on" : ""}" data-cat="${c}">${c}</button>`).join("")}
      </div>
      <div class="ex__list" id="exList"></div>
    </div>
    <div class="app__pad"></div>`;
}
function exItem(c, i) {
  return `<article class="exrow">
    <div class="exrow__thumb" style="background:${grad(c.hue, i)}">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
    </div>
    <div class="exrow__info">
      <p class="exrow__name">${c.name}</p>
      <p class="exrow__meta">${c.cat} · ${c.min}분 · ${c.level}</p>
    </div>
    ${c.badge ? `<span class="exrow__badge">${c.badge}</span>` : ""}
  </article>`;
}

function viewStore() {
  return `
    <div class="store">
      <div class="store__banner">
        <strong>회원 전용 할인</strong>
        <span>MOVE 멤버는 모든 굿즈 최대 40% 할인</span>
      </div>
      <h3 class="store__title">운동을 완성하는 MOVE 굿즈</h3>
      <div class="store__grid">
        ${PRODUCTS.map((p, i) => {
          const rate = Math.round((1 - p.price / p.retail) * 100);
          return `<article class="pcard" data-act="cart">
            <div class="pcard__thumb" style="background:${grad(p.hue, i)}">
              <button class="pcard__like" aria-label="찜">♡</button>
            </div>
            <p class="pcard__name">${p.name}</p>
            <p class="pcard__price"><span class="pcard__rate">${rate}%</span><span class="pcard__sale">${won(p.price)}</span></p>
            <p class="pcard__retail">${won(p.retail)}</p>
          </article>`;
        }).join("")}
      </div>
    </div>
    <div class="app__pad"></div>`;
}

function viewFeed() {
  return `<div class="feed">
    ${FEED.map((f, i) => `
      <article class="post">
        <div class="post__head">
          <span class="avatar" style="background:${grad(f.color, i)}">${f.user[0]}</span>
          <div><p class="post__user">${f.user}</p><p class="post__time">${f.time}</p></div>
          <button class="post__follow">팔로우</button>
        </div>
        <p class="post__text">${f.text}</p>
        <div class="post__img" style="background:${grad(f.hue, i)}"><span>${f.tag}</span></div>
        <div class="post__actions">
          <button class="post__act" data-like aria-label="좋아요">♡ <b>${f.likes}</b></button>
          <button class="post__act">💬 <b>${f.comments}</b></button>
          <button class="post__act post__act--end">↗</button>
        </div>
      </article>`).join("")}
    <div class="app__pad"></div>
  </div>`;
}

function viewMy() {
  return `<div class="my">
    <div class="my__top">
      <span class="my__avatar">M</span>
      <div>
        <p class="my__name">무브회원님 <span class="my__badge">PREMIUM</span></p>
        <p class="my__mail">move@member.app</p>
      </div>
      <button class="my__edit">편집</button>
    </div>
    <div class="my__stats">
      <div><b>37</b><span>수강 클래스</span></div>
      <div><b>12일</b><span>연속 출석</span></div>
      <div><b>24</b><span>찜한 운동</span></div>
    </div>
    <div class="my__membership">
      <div><strong>프리미엄 멤버십</strong><span>다음 결제일 2026.07.24</span></div>
      <button class="my__manage" data-act="trial">관리</button>
    </div>
    <ul class="menu">
      ${["내 클래스", "찜한 운동", "주문 내역", "결제·멤버십", "알림 설정", "고객센터", "로그아웃"]
        .map((m) => `<li class="menu__item" data-act="menu"><span>${m}</span><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></li>`)
        .join("")}
    </ul>
    <div class="app__pad"></div>
  </div>`;
}

/* ===================== ROUTER ===================== */
const VIEWS = { home: viewHome, explore: viewExplore, store: viewStore, feed: viewFeed, my: viewMy };
const TITLES = { home: "◆ MOVE", explore: "탐색", store: "스토어", feed: "피드", my: "마이페이지" };

const appScroll = document.getElementById("appScroll");
const appTitle = document.getElementById("appTitle");
const appGift = document.getElementById("appGift");

function navigate(view) {
  appScroll.innerHTML = (VIEWS[view] || viewHome)();
  appScroll.scrollTop = 0;
  appTitle.textContent = TITLES[view];
  appTitle.classList.toggle("app__logo--plain", view !== "home");
  appGift.style.display = view === "home" ? "" : "none";
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.view === view));
  wire(view);
}

function wire(view) {
  // generic taps
  appScroll.querySelectorAll("[data-act]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const act = el.dataset.act;
      if (act === "trial") { e.preventDefault(); toast("무료체험은 데모에서 비활성화되어 있어요 🙂"); }
      if (act === "cart") {
        const like = e.target.closest(".pcard__like");
        if (like) { e.stopPropagation(); like.textContent = like.textContent === "♡" ? "♥" : "♡"; like.classList.toggle("on"); return; }
        toast("장바구니에 담았어요 🛒");
      }
      if (act === "menu") toast(el.querySelector("span").textContent + " — 데모 화면이에요");
    });
  });
  // bounce on class cards
  appScroll.querySelectorAll(".cardx, .exrow").forEach((c) =>
    c.addEventListener("click", () => c.animate([{ transform: "scale(.96)" }, { transform: "scale(1)" }], { duration: 160 }))
  );

  if (view === "explore") wireExplore();
  if (view === "feed") {
    appScroll.querySelectorAll("[data-like]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const b = btn.querySelector("b");
        const on = btn.classList.toggle("on");
        b.textContent = Number(b.textContent) + (on ? 1 : -1);
        btn.firstChild.textContent = on ? "♥ " : "♡ ";
      });
    });
    appScroll.querySelectorAll(".post__follow").forEach((b) =>
      b.addEventListener("click", () => { b.classList.toggle("on"); b.textContent = b.classList.contains("on") ? "팔로잉" : "팔로우"; })
    );
  }
}

function wireExplore() {
  const input = document.getElementById("exInput");
  const list = document.getElementById("exList");
  const chips = document.getElementById("exChips");
  let cat = "전체";
  const draw = () => {
    const q = (input.value || "").trim();
    const items = CLASSES.filter((c) => (cat === "전체" || c.cat === cat) && (!q || c.name.includes(q)));
    list.innerHTML = items.length
      ? items.map(exItem).join("")
      : `<p class="ex__empty">검색 결과가 없어요</p>`;
    list.querySelectorAll(".exrow").forEach((c) =>
      c.addEventListener("click", () => c.animate([{ transform: "scale(.97)" }, { transform: "scale(1)" }], { duration: 160 }))
    );
  };
  chips.querySelectorAll(".ex__chip").forEach((ch) =>
    ch.addEventListener("click", () => {
      chips.querySelector(".is-on")?.classList.remove("is-on");
      ch.classList.add("is-on"); cat = ch.dataset.cat; draw();
    })
  );
  input.addEventListener("input", draw);
  draw();
}

/* ===================== toast ===================== */
let toastTimer;
function toast(msg) {
  let el = document.getElementById("toast");
  if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; document.querySelector(".app").appendChild(el); }
  el.textContent = msg; el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
}

/* ===================== init ===================== */
document.getElementById("promoChips").innerHTML =
  ["발레", "필라테스", "요가", "스트레칭", "근력"].map((c) => `<li><a href="#">${c}</a></li>`).join("");

document.getElementById("tabbar").addEventListener("click", (e) => {
  const tab = e.target.closest(".tab");
  if (tab) { e.preventDefault(); navigate(tab.dataset.view); }
});

navigate("home");
