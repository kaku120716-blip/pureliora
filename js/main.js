// 正式なURLを受け取ったら、対応する空欄に https:// から始まるURLを入力します。
const destinations = {
  purchase: "",
  line: "",
};

for (const button of document.querySelectorAll("[data-destination]")) {
  let destination;
  try {
    destination = new URL(destinations[button.dataset.destination]);
  } catch {
    continue;
  }
  if (destination.protocol !== "https:" && destination.protocol !== "http:") continue;

  const link = document.createElement("a");
  link.className = button.className;
  link.textContent = button.textContent;
  link.href = destination.href;
  document.getElementById(button.getAttribute("aria-describedby"))?.setAttribute("hidden", "");
  button.replaceWith(link);
}

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.getElementById("site-nav");
const smallScreen = window.matchMedia("(max-width: 900px)");

function setMenu(open) {
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
  navigation.classList.toggle("is-open", open);
}

document.querySelector(".site-header").classList.add("has-menu");
menuButton.hidden = false;
menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
smallScreen.addEventListener("change", () => setMenu(false));
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || menuButton.getAttribute("aria-expanded") !== "true") return;
  setMenu(false);
  menuButton.focus();
});

const backToTop = document.querySelector(".back-top");
function updateBackToTop() {
  backToTop.hidden = window.scrollY < 420 && document.activeElement !== backToTop;
}
window.addEventListener("scroll", updateBackToTop, { passive: true });
backToTop.addEventListener("blur", updateBackToTop);
updateBackToTop();

for (const image of document.querySelectorAll(".media img")) {
  image.addEventListener("error", () => { image.hidden = true; }, { once: true });
  if (image.complete && !image.naturalWidth) image.hidden = true;
}

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("reveal");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.14 });
  document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
}
