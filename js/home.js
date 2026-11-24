// スクロール位置から、その画面に近い写真だけの移動量を計算します。
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const wideScreen = window.matchMedia("(min-width: 901px)");
const scenes = Array.from(document.querySelectorAll("[data-scroll-scene]"), (element) => ({
  element,
  layers: Array.from(element.querySelectorAll("[data-shift], [data-drift]")),
}));
const panels = document.querySelectorAll("[data-mask], [data-lines]");
let pendingFrame = 0;

function constrain(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function renderScroll() {
  pendingFrame = 0;
  const viewport = window.innerHeight;
  for (const { element, layers } of scenes) {
    const { top, bottom, height } = element.getBoundingClientRect();
    if (bottom < -120 || top > viewport + 120) continue;

    const progress = constrain((viewport - top) / (viewport + height), 0, 1);
    const distance = progress * 2 - 1;
    for (const layer of layers) {
      layer.style.setProperty("--shift", `${distance * Number(layer.dataset.shift || 0)}px`);
      layer.style.setProperty("--drift", `${distance * Number(layer.dataset.drift || 0)}px`);
    }

    if (element.hasAttribute("data-expand")) {
      const opening = constrain((viewport * .72 - top) / (viewport * .6), 0, 1);
      const crop = 22 * (1 - opening) ** 2;
      element.style.setProperty("--crop", `${crop}%`);
    }
  }
}

function queueScroll() {
  if (!pendingFrame) pendingFrame = requestAnimationFrame(renderScroll);
}

const observer = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    }, { threshold: .19 })
  : null;

function updateMotion() {
  const enabled = !motionPreference.matches;
  const useParallax = enabled && wideScreen.matches;
  document.documentElement.classList.toggle("home-motion", enabled);
  document.documentElement.classList.toggle("home-reveals", enabled && observer !== null);

  for (const panel of panels) {
    if (enabled && !panel.classList.contains("in-view")) observer?.observe(panel);
    else observer?.unobserve(panel);
  }

  if (useParallax) {
    window.addEventListener("scroll", queueScroll, { passive: true });
    window.addEventListener("resize", queueScroll);
    queueScroll();
  } else {
    window.removeEventListener("scroll", queueScroll);
    window.removeEventListener("resize", queueScroll);
    cancelAnimationFrame(pendingFrame);
    pendingFrame = 0;
    for (const { element, layers } of scenes) {
      element.style.removeProperty("--crop");
      for (const layer of layers) {
        layer.style.removeProperty("--shift");
        layer.style.removeProperty("--drift");
      }
    }
  }
}

motionPreference.addEventListener("change", updateMotion);
wideScreen.addEventListener("change", updateMotion);
updateMotion();

function setupOpening() {
  const opening = document.querySelector(".opening");
  if (!opening?.showModal) return;

  const skip = opening.querySelector(".opening-skip");
  const replay = document.querySelector(".opening-replay");
  const main = document.querySelector("#main");
  const duration = Number.parseFloat(getComputedStyle(opening).getPropertyValue("--opening-duration"));
  const storageKey = "pureliora-opening-seen";
  let fallback;
  let returnFocus = main;

  function play(focusTarget) {
    if (opening.open) return;
    returnFocus = focusTarget;
    opening.showModal();
    // 動きを減らす設定やアニメーション未対応の環境でも、自動で閉じます。
    fallback = window.setTimeout(finish, duration + (motionPreference.matches ? 0 : 500));
    try {
      sessionStorage.setItem(storageKey, "yes");
    } catch {
      // 保存が制限されても再生とスキップは利用できます。
    }
  }

  function finish() {
    if (!opening.open) return;
    window.clearTimeout(fallback);
    opening.close();
    returnFocus.focus({ preventScroll: true });
  }

  replay.hidden = false;
  replay.addEventListener("click", () => play(replay));
  skip.addEventListener("click", finish);
  opening.addEventListener("cancel", (event) => {
    event.preventDefault();
    finish();
  });
  opening.addEventListener("animationend", (event) => {
    if (event.target === opening && event.animationName === "opening-sequence") finish();
  });
  motionPreference.addEventListener("change", finish);

  // 自動再生は、このタブで最初にホームを開いたときだけです。
  if (motionPreference.matches || location.hash) return;
  try {
    if (sessionStorage.getItem(storageKey)) return;
  } catch {
    // 保存が使えない環境でも、自動再生します。
  }
  play(main);
}

setupOpening();
