// ---- Data ----
const categories = [
  { icon: "🔥", name: "특가할인" },
  { icon: "🏋️", name: "운동용품" },
  { icon: "👕", name: "운동복" },
  { icon: "✨", name: "이너뷰티" },
  { icon: "💊", name: "영양제" },
  { icon: "🥗", name: "식단관리" },
  { icon: "🍪", name: "간식" },
  { icon: "🎬", name: "클래스" },
  { icon: "🏆", name: "베스트" },
];

const exclusive = [
  { emoji: "🪀", brand: "QUAT", name: "콰트 바로보드", price: 65000, discount: 56 },
  { emoji: "🧱", brand: "QUAT", name: "콰트 바로폼", price: 37900, discount: 44 },
  { emoji: "🩰", brand: "QUAT", name: "콰트 2단 발레바", price: 119000, discount: 14 },
  { emoji: "📦", brand: "QUAT", name: "콰트 멀티스텝 박스", price: 79000, discount: 20 },
  { emoji: "⚽", brand: "QUAT", name: "콰트 하프 짐볼", price: 21900, discount: 69 },
];

const recovery = [
  { emoji: "🦯", brand: "QUAT", name: "콰트 바로스틱", price: 54000, discount: 40 },
  { emoji: "🧻", brand: "QUAT", name: "콰트 미니 폼롤러", price: 13900, discount: 30 },
  { emoji: "🟦", brand: "Adidas", name: "아디다스 EPP 폼롤러", price: 30700, discount: 36 },
  { emoji: "💆", brand: "스포츨러", name: "근막이완 마사지건", price: 89000, discount: 50 },
  { emoji: "🧦", brand: "QUAT", name: "콰트 논슬립 양말", price: 9900, discount: 25 },
];

const news = [
  { emoji: "🍗", brand: "오빠닭", name: "스팀 닭가슴살 30팩", price: 32900, discount: 35 },
  { emoji: "🍣", brand: "콰트키친", name: "현미 단백질 초밥", price: 12900, discount: 20 },
  { emoji: "🥤", brand: "천호식품", name: "이너뷰티 콜라겐 드링크", price: 28000, discount: 30 },
  { emoji: "💊", brand: "QUAT", name: "데일리 멀티 비타민", price: 19900, discount: 40 },
  { emoji: "🍫", brand: "콰트", name: "단백질 프로틴바 12개입", price: 15900, discount: 28 },
];

// ---- Helpers ----
const won = (n) => n.toLocaleString("ko-KR") + "원";

function makeCard(p) {
  const origin = Math.round(p.price / (1 - p.discount / 100));
  return `
    <article class="card" data-price="${p.price}">
      <div class="card__thumb">
        <span class="card__tag">${p.discount}%</span>
        <span aria-hidden="true">${p.emoji}</span>
        <button class="card__like" aria-label="찜">🤍</button>
      </div>
      <div class="card__body">
        <p class="card__brand">${p.brand}</p>
        <p class="card__name">${p.name}</p>
        <div class="card__price">
          <span class="card__discount">${p.discount}%</span>
          <span class="card__final">${won(p.price)}</span>
        </div>
        <p class="card__origin"><s>${won(origin)}</s></p>
        <p class="card__meta">⭐ 4.${(p.discount % 9) + 1} · 무료배송</p>
      </div>
    </article>`;
}

function renderGrid(id, list) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = list.map(makeCard).join("");
}

// ---- Render ----
document.getElementById("catList").innerHTML = categories
  .map(
    (c) => `<li><a href="#" class="cat"><span class="cat__icon">${c.icon}</span><span class="cat__name">${c.name}</span></a></li>`
  )
  .join("");

renderGrid("gridExclusive", exclusive);
renderGrid("gridRecovery", recovery);
renderGrid("gridNew", news);

// ---- Cart (demo) ----
let cart = 0;
const cartCountEl = document.getElementById("cartCount");
document.querySelectorAll(".grid").forEach((grid) => {
  grid.addEventListener("click", (e) => {
    const like = e.target.closest(".card__like");
    if (like) {
      e.preventDefault();
      like.textContent = like.textContent === "🤍" ? "❤️" : "🤍";
      return;
    }
    const card = e.target.closest(".card");
    if (card) {
      cart += 1;
      cartCountEl.textContent = cart;
      cartCountEl.animate(
        [{ transform: "scale(1.6)" }, { transform: "scale(1)" }],
        { duration: 250, easing: "ease-out" }
      );
    }
  });
});

// ---- Hero slider ----
(function () {
  const slides = Array.from(document.querySelectorAll(".hero__slide"));
  const dotsWrap = document.getElementById("heroDots");
  let idx = 0;

  // apply gradient backgrounds from inline --bg
  slides.forEach((s) => {
    const bg = s.style.getPropertyValue("--bg");
    if (bg) s.style.background = bg;
  });

  dotsWrap.innerHTML = slides
    .map((_, i) => `<button aria-label="슬라이드 ${i + 1}"></button>`)
    .join("");
  const dots = Array.from(dotsWrap.children);

  function go(n) {
    slides[idx].classList.remove("is-active");
    dots[idx].classList.remove("is-active");
    idx = (n + slides.length) % slides.length;
    slides[idx].classList.add("is-active");
    dots[idx].classList.add("is-active");
  }

  dots.forEach((d, i) => d.addEventListener("click", () => go(i)));
  dots[0].classList.add("is-active");
  setInterval(() => go(idx + 1), 4500);
})();
