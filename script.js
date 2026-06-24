// Renders the QUAT store homepage from real scraped data (data.json)
const won = (n) => (n == null ? "" : Number(n).toLocaleString("ko-KR") + "원");

async function init() {
  // Prefer the inlined global (works via file://); fall back to fetching data.json.
  let data = window.STORE_DATA;
  if (!data) {
    try {
      data = await (await fetch("data.json")).json();
    } catch (e) {
      document.getElementById("sections").innerHTML =
        '<p style="padding:40px;text-align:center;color:#999">데이터를 불러올 수 없습니다.</p>';
      return;
    }
  }

  renderBanners(data.banners);
  renderCategories(data.categories);
  renderSections(data.sections);
  wireCart();
}

/* ---- Banner carousel ---- */
function renderBanners(banners) {
  const track = document.getElementById("heroTrack");
  track.innerHTML = banners
    .map(
      (b) => `<a class="hero__slide" href="${b.link || "#"}" target="_blank" rel="noopener">
        <img src="${b.img}" alt="${b.title}" loading="eager" />
      </a>`
    )
    .join("");

  const slides = banners.length;
  let idx = 0;
  const countEl = document.getElementById("heroCount");
  const go = (n) => {
    idx = (n + slides) % slides;
    track.style.transform = `translateX(-${idx * 100}%)`;
    countEl.textContent = `${idx + 1} / ${slides}`;
  };
  document.getElementById("heroPrev").addEventListener("click", () => go(idx - 1));
  document.getElementById("heroNext").addEventListener("click", () => go(idx + 1));
  go(0);
  if (slides > 1) setInterval(() => go(idx + 1), 5000);
}

/* ---- Category icons ---- */
function renderCategories(cats) {
  document.getElementById("catList").innerHTML = cats
    .map(
      (c) => `<li><a href="#" class="cat">
        <span class="cat__icon"><img src="${c.icon}" alt="" loading="lazy" /></span>
        <span class="cat__name">${c.name}</span>
      </a></li>`
    )
    .join("");
}

/* ---- Product sections ---- */
function card(p) {
  const hasDiscount = p.rate > 0 && p.retail && p.retail !== p.sale;
  const priceLine = hasDiscount
    ? `<span class="card__rate">${p.rate}%</span><span class="card__final">${won(p.sale)}</span>`
    : `<span class="card__final">${won(p.sale)}</span>`;
  const origin = hasDiscount ? won(p.retail) : "";
  const rating = (4 + ((p.id % 9) + 1) / 10).toFixed(1);
  return `
    <article class="card" data-price="${p.sale || 0}">
      <div class="card__thumb">
        <img src="${p.img}" alt="${p.name}" loading="lazy" />
        <button class="card__like" aria-label="찜">♡</button>
      </div>
      <div class="card__body">
        <p class="card__name">${p.name}</p>
        <p class="card__origin">${origin}</p>
        <p class="card__price">${priceLine}</p>
        <p class="card__meta"><span class="card__star">★</span>${rating} · 무료배송</p>
      </div>
    </article>`;
}

function renderSections(sections) {
  document.getElementById("sections").innerHTML = sections
    .map(
      (s) => `<section class="section container">
        <div class="section__head">
          <a href="#" class="section__more">전체보기 ›</a>
          <h3 class="section__title">${s.title}</h3>
        </div>
        <div class="grid">${s.items.map(card).join("")}</div>
      </section>`
    )
    .join("");
}

/* ---- Cart + like interactions ---- */
function wireCart() {
  let cart = 0;
  const badge = document.getElementById("cartCount");
  document.getElementById("sections").addEventListener("click", (e) => {
    const like = e.target.closest(".card__like");
    if (like) {
      e.preventDefault();
      const liked = like.textContent.trim() === "♥";
      like.textContent = liked ? "♡" : "♥";
      like.style.color = liked ? "" : "#ff2d55";
      return;
    }
    if (e.target.closest(".card")) {
      cart += 1;
      badge.hidden = false;
      badge.textContent = cart;
      badge.animate(
        [{ transform: "scale(1.6)" }, { transform: "scale(1)" }],
        { duration: 250, easing: "ease-out" }
      );
    }
  });
}

init();
