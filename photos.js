(() => {
  const items = Array.from(document.querySelectorAll(".photo-item"));
  if (!items.length) return;

  const box = document.createElement("div");
  box.className = "lightbox";
  box.hidden = true;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Photo viewer");
  box.innerHTML = `
    <button class="lb-btn lb-close" type="button" aria-label="Close">&times;</button>
    <button class="lb-btn lb-prev" type="button" aria-label="Previous photo">&#8249;</button>
    <figure class="lb-figure">
      <img class="lb-img" alt="">
      <figcaption class="lb-caption"></figcaption>
    </figure>
    <button class="lb-btn lb-next" type="button" aria-label="Next photo">&#8250;</button>
  `;
  document.body.appendChild(box);

  const img = box.querySelector(".lb-img");
  const caption = box.querySelector(".lb-caption");
  const closeBtn = box.querySelector(".lb-close");
  const prevBtn = box.querySelector(".lb-prev");
  const nextBtn = box.querySelector(".lb-next");
  let index = 0;
  let lastFocus = null;

  function preload(i) {
    const item = items[(i + items.length) % items.length];
    new Image().src = item.dataset.full;
  }

  function show(i) {
    index = (i + items.length) % items.length;
    const item = items[index];
    const thumb = item.querySelector("img");
    img.src = item.dataset.full;
    img.alt = thumb ? thumb.alt : "";
    caption.textContent = `${item.querySelector(".photo-caption").textContent}  ·  ${index + 1} / ${items.length}`;
    preload(index + 1);
    preload(index - 1);
  }

  function open(i) {
    lastFocus = document.activeElement;
    show(i);
    box.hidden = false;
    document.body.classList.add("lb-open");
    closeBtn.focus();
  }

  function close() {
    box.hidden = true;
    document.body.classList.remove("lb-open");
    img.removeAttribute("src");
    if (lastFocus) lastFocus.focus();
  }

  items.forEach((item, i) => item.addEventListener("click", () => open(i)));
  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", () => show(index - 1));
  nextBtn.addEventListener("click", () => show(index + 1));

  box.addEventListener("click", event => {
    if (event.target === box || event.target.classList.contains("lb-figure")) close();
  });

  document.addEventListener("keydown", event => {
    if (box.hidden) return;
    if (event.key === "Escape") close();
    else if (event.key === "ArrowLeft") show(index - 1);
    else if (event.key === "ArrowRight") show(index + 1);
    else if (event.key === "Tab") {
      const focusable = [closeBtn, prevBtn, nextBtn];
      const pos = focusable.indexOf(document.activeElement);
      event.preventDefault();
      const next = event.shiftKey ? pos - 1 : pos + 1;
      focusable[(next + focusable.length) % focusable.length].focus();
    }
  });

  let startX = 0;
  let startY = 0;
  box.addEventListener("touchstart", event => {
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
  }, { passive: true });
  box.addEventListener("touchend", event => {
    const dx = event.changedTouches[0].clientX - startX;
    const dy = event.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      show(dx < 0 ? index + 1 : index - 1);
    }
  }, { passive: true });
})();
