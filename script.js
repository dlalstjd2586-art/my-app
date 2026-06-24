// MOVE landing — original content, gradient placeholder thumbnails (no external assets)

const chips = ["발레", "필라테스", "요가", "스트레칭", "근력", "다이어트", "명상"];

// Two green/navy gradient families so thumbnails feel on-brand
const grad = (h, i) =>
  `linear-gradient(150deg, hsl(${h} 55% ${38 + (i % 3) * 6}%), hsl(${h + 22} 60% ${24 + (i % 2) * 6}%))`;

const popular = [
  { name: "아침을 여는 모닝 스트레칭", min: 12, level: "초급", badge: "LIVE" },
  { name: "코어 집중 필라테스", min: 20, level: "중급" },
  { name: "전신 순환 근력 트레이닝", min: 25, level: "중급" },
  { name: "딥 릴랙스 저녁 요가", min: 18, level: "초급" },
  { name: "발레핏 베이직", min: 15, level: "초급", badge: "NEW" },
  { name: "하체 집중 번 아웃", min: 22, level: "고급" },
];

const programs = [
  { name: "4주 체형 교정 챌린지", min: 0, level: "프로그램", badge: "추천" },
  { name: "초보자 홈트 스타터", min: 0, level: "프로그램" },
  { name: "코어 &  자세 바로잡기", min: 0, level: "프로그램" },
  { name: "릴랙스 &  수면 루틴", min: 0, level: "프로그램" },
  { name: "주 3회 다이어트 플랜", min: 0, level: "프로그램" },
];

function cardHTML(item, i, hueBase) {
  const badge = item.badge ? `<span class="cardx__badge">${item.badge}</span>` : "";
  const meta = item.min > 0 ? `${item.min}분 · ${item.level}` : item.level;
  return `
    <article class="cardx">
      <div class="cardx__thumb" style="background:${grad(hueBase + i * 14, i)}">
        ${badge}<span class="cardx__lv">${item.level}</span>
      </div>
      <p class="cardx__name">${item.name}</p>
      <p class="cardx__meta">${meta}</p>
    </article>`;
}

function render(id, list, hueBase) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = list.map((it, i) => cardHTML(it, i, hueBase)).join("");
}

// chips
document.getElementById("chips").innerHTML = chips
  .map((c) => `<li><a href="#">${c}</a></li>`)
  .join("");

// rails — popular uses navy/blue hues, programs uses green hues
render("railPopular", popular, 210);
render("railProgram", programs, 150);

// Simple interactions
document.querySelectorAll(".hero__cta, .promo-card__btn").forEach((b) =>
  b.addEventListener("click", () => alert("무료체험은 데모에서 비활성화되어 있어요 🙂"))
);

document.querySelectorAll(".rail").forEach((rail) => {
  rail.addEventListener("click", (e) => {
    const card = e.target.closest(".cardx");
    if (card) card.animate(
      [{ transform: "scale(.96)" }, { transform: "scale(1)" }],
      { duration: 180, easing: "ease-out" }
    );
  });
});

// Tab bar active state
document.querySelectorAll(".tab").forEach((tab) =>
  tab.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelector(".tab.is-active")?.classList.remove("is-active");
    tab.classList.add("is-active");
  })
);
