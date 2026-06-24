// MOVE app — router with top-level tabs + detail pages and back navigation.
// All content original; thumbnails are CSS gradients.

const won = (n) => Number(n).toLocaleString("ko-KR") + "원";
const grad = (h, i = 0) =>
  `linear-gradient(150deg, hsl(${h} 55% ${40 + (i % 3) * 5}%), hsl(${h + 24} 60% ${24 + (i % 2) * 6}%))`;

/* ===================== DATA ===================== */
const CATS = ["전체", "발레", "필라테스", "요가", "스트레칭", "근력", "다이어트", "명상"];

const CLASSES = [
  { name: "아침을 여는 모닝 스트레칭", min: 12, level: "초급", cat: "스트레칭", badge: "LIVE", hue: 200, coach: "이서연" },
  { name: "코어 집중 필라테스", min: 20, level: "중급", cat: "필라테스", hue: 215, coach: "박지호" },
  { name: "전신 순환 근력 트레이닝", min: 25, level: "중급", cat: "근력", hue: 225, coach: "김태웅" },
  { name: "딥 릴랙스 저녁 요가", min: 18, level: "초급", cat: "요가", hue: 160, coach: "정유나" },
  { name: "발레핏 베이직", min: 15, level: "초급", cat: "발레", badge: "NEW", hue: 320, coach: "한소희" },
  { name: "하체 집중 번 아웃", min: 22, level: "고급", cat: "근력", hue: 245, coach: "김태웅" },
  { name: "굿모닝 플로우 요가", min: 16, level: "초급", cat: "요가", hue: 150, coach: "정유나" },
  { name: "탄탄 코어 필라테스", min: 24, level: "중급", cat: "필라테스", hue: 205, coach: "박지호" },
  { name: "다이어트 HIIT 번지", min: 18, level: "고급", cat: "다이어트", badge: "HOT", hue: 12, coach: "김태웅" },
  { name: "마음을 비우는 명상", min: 10, level: "초급", cat: "명상", hue: 175, coach: "이서연" },
  { name: "우아한 발레 스트레칭", min: 14, level: "초급", cat: "발레", hue: 300, coach: "한소희" },
  { name: "잠들기 전 이완 스트레칭", min: 12, level: "초급", cat: "스트레칭", hue: 190, coach: "정유나" },
];

const PROGRAMS = [
  { name: "4주 체형 교정 챌린지", level: "프로그램", badge: "추천", hue: 150, weeks: 4, cat: "프로그램", coach: "박지호" },
  { name: "초보자 홈트 스타터", level: "프로그램", hue: 160, weeks: 2, cat: "프로그램", coach: "이서연" },
  { name: "코어 & 자세 바로잡기", level: "프로그램", hue: 170, weeks: 3, cat: "프로그램", coach: "박지호" },
  { name: "릴랙스 & 수면 루틴", level: "프로그램", hue: 185, weeks: 2, cat: "프로그램", coach: "정유나" },
  { name: "주 3회 다이어트 플랜", level: "프로그램", hue: 140, weeks: 6, cat: "프로그램", coach: "김태웅" },
];

const PRODUCTS = [
  { name: "MOVE 논슬립 요가매트 6mm", price: 32000, retail: 45000, hue: 160, desc: "미끄럼 없는 양면 TPE 소재, 6mm 쿠션감" },
  { name: "MOVE 미니 폼롤러", price: 14900, retail: 19000, hue: 150, desc: "휴대 간편한 30cm 사이즈, 근막 이완에 딱" },
  { name: "MOVE 라텍스 밴드 4종 세트", price: 12900, retail: 21000, hue: 200, desc: "강도별 4종 구성, 전신 근력 운동용" },
  { name: "MOVE 식물성 단백질 14팩", price: 28900, retail: 39000, hue: 215, desc: "1팩 20g 단백질, 비건 식물성 포뮬러" },
  { name: "MOVE 짐볼 65cm", price: 17900, retail: 25000, hue: 175, desc: "안티버스트 PVC, 코어·밸런스 운동" },
  { name: "MOVE 데일리 멀티비타민", price: 19900, retail: 29000, hue: 230, desc: "13종 비타민·미네랄, 30일분" },
];

const FEED = [
  { user: "지수", color: 320, time: "12분 전", text: "모닝 스트레칭 7일째 성공! 아침이 한결 가벼워졌어요 🌿", likes: 24, comments: 5, hue: 160, tag: "#모닝스트레칭" },
  { user: "현우", color: 215, time: "1시간 전", text: "코어 필라테스 끝. 오늘도 버텼다 💪", likes: 41, comments: 8, hue: 215, tag: "#필라테스" },
  { user: "유나", color: 150, time: "3시간 전", text: "딥 릴랙스 요가로 하루 마무리. 추천합니다!", likes: 18, comments: 2, hue: 175, tag: "#요가" },
  { user: "민재", color: 12, time: "어제", text: "HIIT 번지 4주차… 드디어 -3kg 달성 🔥", likes: 73, comments: 14, hue: 12, tag: "#다이어트" },
];

const COMMENTS = [
  { user: "하늘", text: "와 멋져요! 저도 오늘부터 시작해볼게요 👏" },
  { user: "도윤", text: "꾸준함이 최고예요. 화이팅!" },
  { user: "서아", text: "어떤 클래스인가요? 따라 하고 싶어요" },
];

/* ===================== COMPONENTS ===================== */
function classCard(c, i, list = "class") {
  const idx = (list === "program" ? PROGRAMS : CLASSES).indexOf(c);
  const badge = c.badge ? `<span class="cardx__badge">${c.badge}</span>` : "";
  return `<article class="cardx" data-open="${list}" data-id="${idx}">
    <div class="cardx__thumb" style="background:${grad(c.hue, i)}">${badge}<span class="cardx__lv">${c.level}</span></div>
    <p class="cardx__name">${c.name}</p>
    <p class="cardx__meta">${c.min ? c.min + "분 · " : c.weeks ? c.weeks + "주 · " : ""}${c.cat || c.level}</p>
  </article>`;
}
const rail = (list, kind = "class") => `<div class="rail">${list.map((c, i) => classCard(c, i, kind)).join("")}</div>`;

/* ===================== TOP-LEVEL VIEWS ===================== */
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
      ${rail(PROGRAMS, "program")}
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
function exItem(c) {
  const idx = CLASSES.indexOf(c);
  return `<article class="exrow" data-open="class" data-id="${idx}">
    <div class="exrow__thumb" style="background:${grad(c.hue, idx)}">
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
      <div class="store__banner"><strong>회원 전용 할인</strong><span>MOVE 멤버는 모든 굿즈 최대 40% 할인</span></div>
      <h3 class="store__title">운동을 완성하는 MOVE 굿즈</h3>
      <div class="store__grid">${PRODUCTS.map((p, i) => productCard(p, i)).join("")}</div>
    </div>
    <div class="app__pad"></div>`;
}
function productCard(p, i) {
  const idx = PRODUCTS.indexOf(p);
  const rate = Math.round((1 - p.price / p.retail) * 100);
  return `<article class="pcard" data-open="product" data-id="${idx}">
    <div class="pcard__thumb" style="background:${grad(p.hue, i)}"><button class="pcard__like" data-stop aria-label="찜">♡</button></div>
    <p class="pcard__name">${p.name}</p>
    <p class="pcard__price"><span class="pcard__rate">${rate}%</span><span class="pcard__sale">${won(p.price)}</span></p>
    <p class="pcard__retail">${won(p.retail)}</p>
  </article>`;
}

function viewFeed() {
  return `<div class="feed">
    ${FEED.map((f, i) => `
      <article class="post" data-open="post" data-id="${i}">
        <div class="post__head">
          <span class="avatar" style="background:${grad(f.color, i)}">${f.user[0]}</span>
          <div><p class="post__user">${f.user}</p><p class="post__time">${f.time}</p></div>
          <button class="post__follow" data-stop>팔로우</button>
        </div>
        <p class="post__text">${f.text}</p>
        <div class="post__img" style="background:${grad(f.hue, i)}"><span>${f.tag}</span></div>
        <div class="post__actions">
          <button class="post__act" data-like data-stop aria-label="좋아요">♡ <b>${f.likes}</b></button>
          <button class="post__act" data-stop>💬 <b>${f.comments}</b></button>
          <button class="post__act post__act--end" data-stop>↗</button>
        </div>
      </article>`).join("")}
    <div class="app__pad"></div>
  </div>`;
}

function viewMy() {
  const items = ["내 클래스", "찜한 운동", "주문 내역", "결제·멤버십", "알림 설정", "고객센터", "로그아웃"];
  return `<div class="my">
    <div class="my__top">
      <span class="my__avatar">M</span>
      <div><p class="my__name">무브회원님 <span class="my__badge">PREMIUM</span></p><p class="my__mail">move@member.app</p></div>
      <button class="my__edit" data-open="menu" data-id="프로필 편집">편집</button>
    </div>
    <div class="my__stats"><div><b>37</b><span>수강 클래스</span></div><div><b>12일</b><span>연속 출석</span></div><div><b>24</b><span>찜한 운동</span></div></div>
    <div class="my__membership"><div><strong>프리미엄 멤버십</strong><span>다음 결제일 2026.07.24</span></div><button class="my__manage" data-open="menu" data-id="결제·멤버십">관리</button></div>
    <ul class="menu">
      ${items.map((m) => `<li class="menu__item" data-open="menu" data-id="${m}"><span>${m}</span><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></li>`).join("")}
    </ul>
    <div class="app__pad"></div>
  </div>`;
}

/* ===================== DETAIL VIEWS ===================== */
function detailClass(id, kind) {
  const src = kind === "program" ? PROGRAMS : CLASSES;
  const c = src[id]; if (!c) return viewHome();
  const related = CLASSES.filter((x) => x.cat === c.cat && x !== c).slice(0, 6);
  const metaLine = c.min ? `${c.cat} · ${c.min}분 · ${c.level}` : `${c.weeks}주 프로그램 · ${c.level}`;
  return `<div class="detail">
    <div class="player" style="background:${grad(c.hue, id)}">
      <button class="player__play" data-act="trial" aria-label="재생"><svg viewBox="0 0 24 24" width="30" height="30" fill="#fff"><path d="M8 5v14l11-7z"/></svg></button>
      ${c.badge ? `<span class="player__badge">${c.badge}</span>` : ""}
    </div>
    <div class="dt">
      <h2 class="dt__title">${c.name}</h2>
      <p class="dt__meta">${metaLine}</p>
      <div class="dt__coach">
        <span class="avatar avatar--sm" style="background:${grad(c.hue + 40, id)}">${c.coach[0]}</span>
        <div><p class="dt__coachname">${c.coach} 강사</p><p class="dt__coachsub">MOVE 전문 트레이너</p></div>
        <button class="dt__follow" data-stop>팔로우</button>
      </div>
      <p class="dt__desc">${c.name} 클래스는 집에서 부담 없이 따라 할 수 있도록 동작을 차근차근 안내해요. 호흡과 자세 포인트를 짚어주어 처음이어도 끝까지 완주할 수 있어요.</p>
      <ul class="dt__points">
        <li>매트 한 장이면 준비 끝, 별도 기구가 필요 없어요</li>
        <li>동작마다 호흡·자세 가이드를 제공해요</li>
        <li>난이도 ${c.level} · ${c.coach} 강사의 시그니처 루틴</li>
      </ul>
      ${related.length ? `<h3 class="dt__rel">함께 보면 좋은 클래스</h3>${rail(related)}` : ""}
      <div class="app__pad"></div>
    </div>
    <div class="dt__bar"><button class="dt__cta" data-act="trial">지금 시작하기</button></div>
  </div>`;
}

function detailProduct(id) {
  const p = PRODUCTS[id]; if (!p) return viewStore();
  const rate = Math.round((1 - p.price / p.retail) * 100);
  const related = PRODUCTS.filter((x) => x !== p).slice(0, 4);
  return `<div class="detail">
    <div class="pd__img" style="background:${grad(p.hue, id)}"></div>
    <div class="dt">
      <p class="pd__brand">MOVE</p>
      <h2 class="dt__title">${p.name}</h2>
      <p class="pd__price"><span class="pcard__rate">${rate}%</span><span class="pd__sale">${won(p.price)}</span><span class="pcard__retail">${won(p.retail)}</span></p>
      <div class="pd__qty">
        <span>수량</span>
        <div class="pd__stepper"><button data-qty="-1">−</button><b id="pdQty">1</b><button data-qty="1">+</button></div>
      </div>
      <ul class="dt__points">
        <li>${p.desc}</li>
        <li>무료배송 · 오늘 주문 시 1~2일 내 도착</li>
        <li>수령 후 7일 이내 교환·반품 가능</li>
      </ul>
      <h3 class="dt__rel">함께 사면 좋은 상품</h3>
      <div class="store__grid">${related.map((x, i) => productCard(x, i)).join("")}</div>
      <div class="app__pad"></div>
    </div>
    <div class="dt__bar dt__bar--split">
      <button class="dt__cart" data-act="cart">장바구니</button>
      <button class="dt__cta" data-act="buy">바로 구매</button>
    </div>
  </div>`;
}

function detailPost(id) {
  const f = FEED[id]; if (!f) return viewFeed();
  return `<div class="detail">
    <div class="dt" style="padding-top:18px">
      <div class="post__head">
        <span class="avatar" style="background:${grad(f.color, id)}">${f.user[0]}</span>
        <div><p class="post__user">${f.user}</p><p class="post__time">${f.time}</p></div>
        <button class="post__follow" data-stop>팔로우</button>
      </div>
      <p class="post__text">${f.text}</p>
      <div class="post__img" style="background:${grad(f.hue, id)}"><span>${f.tag}</span></div>
      <div class="post__actions">
        <button class="post__act" data-like data-stop>♡ <b>${f.likes}</b></button>
        <button class="post__act" data-stop>💬 <b>${f.comments}</b></button>
        <button class="post__act post__act--end" data-stop>↗</button>
      </div>
      <h3 class="dt__rel">댓글 ${COMMENTS.length}</h3>
      <ul class="cmt">
        ${COMMENTS.map((c, i) => `<li class="cmt__row"><span class="avatar avatar--sm" style="background:${grad(120 + i * 50, i)}">${c.user[0]}</span><div><p class="cmt__user">${c.user}</p><p class="cmt__text">${c.text}</p></div></li>`).join("")}
      </ul>
      <div class="app__pad"></div>
    </div>
    <div class="dt__bar dt__bar--input">
      <input type="text" placeholder="응원의 댓글을 남겨보세요" aria-label="댓글" />
      <button data-act="comment">등록</button>
    </div>
  </div>`;
}

function detailMenu(key) {
  return `<div class="menupage">
    <div class="menupage__icon">🛠️</div>
    <h2 class="menupage__title">${key}</h2>
    <p class="menupage__sub">‘${key}’ 화면이에요. 데모에서는 내용이 비어 있어요.</p>
    <button class="menupage__btn" data-back>이전으로</button>
  </div>`;
}

/* ===================== ROUTER ===================== */
const TOP = { home: viewHome, explore: viewExplore, store: viewStore, feed: viewFeed, my: viewMy };
const TOP_TITLE = { home: "◆ MOVE", explore: "탐색", store: "스토어", feed: "피드", my: "마이페이지" };
const DETAIL_TITLE = { class: "클래스", program: "프로그램", product: "상품 정보", post: "게시물", menu: "" };

const appScroll = document.getElementById("appScroll");
const appTitle = document.getElementById("appTitle");
const appGift = document.getElementById("appGift");
const appBack = document.getElementById("appBack");

let stack = [];
let cur = { view: "home", id: null };
let activeTab = "home";

function show(view, id) {
  cur = { view, id };
  const isTop = !!TOP[view];
  if (isTop) {
    appScroll.innerHTML = TOP[view]();
    activeTab = view;
    appTitle.textContent = TOP_TITLE[view];
    appTitle.classList.toggle("app__logo--plain", view !== "home");
    appBack.hidden = true;
    appGift.style.display = view === "home" ? "" : "none";
  } else {
    appScroll.innerHTML =
      view === "class" || view === "program" ? detailClass(id, view) :
      view === "product" ? detailProduct(id) :
      view === "post" ? detailPost(id) : detailMenu(id);
    appTitle.textContent = view === "menu" ? id : DETAIL_TITLE[view];
    appTitle.classList.add("app__logo--plain");
    appBack.hidden = false;
    appGift.style.display = "none";
  }
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.view === activeTab));
  appScroll.scrollTop = 0;
  wire(view);
}
function open(view, id) { stack.push(cur); show(view, id); }
function back() { const prev = stack.pop() || { view: "home", id: null }; show(prev.view, prev.id); }
function goTop(view) { stack = []; show(view, null); }

/* ===================== WIRING ===================== */
function wire(view) {
  // open detail from any [data-open] element (ignore inner [data-stop] controls)
  appScroll.querySelectorAll("[data-open]").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-stop]")) return;
      open(el.dataset.open, isNaN(+el.dataset.id) ? el.dataset.id : +el.dataset.id);
    });
  });
  // generic actions
  appScroll.querySelectorAll("[data-act]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const a = el.dataset.act;
      if (a === "trial") toast("무료체험은 데모에서 비활성화되어 있어요 🙂");
      if (a === "cart") toast("장바구니에 담았어요 🛒");
      if (a === "buy") toast("구매는 데모에서 비활성화되어 있어요 🙂");
      if (a === "comment") toast("댓글은 데모에서 등록되지 않아요 ✍️");
    });
  });
  // like buttons (cards, posts)
  appScroll.querySelectorAll(".pcard__like").forEach((b) =>
    b.addEventListener("click", (e) => { e.stopPropagation(); b.textContent = b.textContent === "♡" ? "♥" : "♡"; b.classList.toggle("on"); })
  );
  appScroll.querySelectorAll("[data-like]").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const b = btn.querySelector("b"); const on = btn.classList.toggle("on");
      b.textContent = Number(b.textContent) + (on ? 1 : -1);
      btn.firstChild.textContent = on ? "♥ " : "♡ ";
    })
  );
  appScroll.querySelectorAll(".post__follow, .dt__follow").forEach((b) =>
    b.addEventListener("click", (e) => { e.stopPropagation(); b.classList.toggle("on"); b.textContent = b.classList.contains("on") ? "팔로잉" : "팔로우"; })
  );
  appScroll.querySelectorAll("[data-back]").forEach((b) => b.addEventListener("click", back));
  // product quantity stepper
  const qty = appScroll.querySelector("#pdQty");
  if (qty) appScroll.querySelectorAll("[data-qty]").forEach((b) =>
    b.addEventListener("click", () => { qty.textContent = Math.max(1, Number(qty.textContent) + Number(b.dataset.qty)); })
  );

  if (view === "explore") wireExplore();
}

function wireExplore() {
  const input = document.getElementById("exInput");
  const list = document.getElementById("exList");
  const chips = document.getElementById("exChips");
  let cat = "전체";
  const draw = () => {
    const q = (input.value || "").trim();
    const items = CLASSES.filter((c) => (cat === "전체" || c.cat === cat) && (!q || c.name.includes(q) || c.coach.includes(q)));
    list.innerHTML = items.length ? items.map(exItem).join("") : `<p class="ex__empty">검색 결과가 없어요</p>`;
    list.querySelectorAll("[data-open]").forEach((el) =>
      el.addEventListener("click", () => open("class", +el.dataset.id))
    );
  };
  chips.querySelectorAll(".ex__chip").forEach((ch) =>
    ch.addEventListener("click", () => { chips.querySelector(".is-on")?.classList.remove("is-on"); ch.classList.add("is-on"); cat = ch.dataset.cat; draw(); })
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
  if (tab) { e.preventDefault(); goTop(tab.dataset.view); }
});
appBack.addEventListener("click", back);

show("home", null);
