(() => {
  const rope = document.getElementById("rope");
  const resetBtn = document.getElementById("resetBtn");
  if (!rope || !resetBtn) return;

  const MIN_ANGLE = 8;
  const GRAVITY = 18;
  const MAX_ROTATION = 85;

  let angle = MIN_ANGLE;
  let direction = -1;
  let swingTimer = null;
  let dragState = null;

  function applyRotation(value) {
    const clamped = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, value));
    angle = clamped;
    rope.style.transform = `translateX(-50%) rotate(${clamped}deg)`;
  }

  function startSwing() {
    clearTimeout(swingTimer);

    const target = direction * angle;
    const start = performance.now();
    const from = parseFloat(getComputedStyle(rope).transform === "none"
      ? angle
      : String(angle)) || angle;
    const duration = 1800 + Math.abs(angle) * 12;

    function frame(now) {
      if (dragState) return;

      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const current = from + (target - from) * eased;
      applyRotation(current);

      if (t < 1) {
        swingTimer = requestAnimationFrame(frame);
        return;
      }

      angle = Math.max(angle - GRAVITY, MIN_ANGLE);
      direction *= -1;
      startSwing();
    }

    swingTimer = requestAnimationFrame(frame);
  }

  function pointerToAngle(clientX) {
    const rect = rope.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const dx = clientX - centerX;
    return Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, dx * 0.42));
  }

  rope.addEventListener("pointerdown", event => {
    dragState = {
      pointerId: event.pointerId
    };

    cancelAnimationFrame(swingTimer);
    rope.setPointerCapture?.(event.pointerId);
    rope.classList.add("dragging");
  });

  rope.addEventListener("pointermove", event => {
    if (!dragState) return;
    if (event.pointerId !== dragState.pointerId) return;

    const next = pointerToAngle(event.clientX);
    applyRotation(next);
  });

  function releaseDrag() {
    if (!dragState) return;

    const releasedAngle = angle;
    dragState = null;
    rope.classList.remove("dragging");

    direction = releasedAngle >= 0 ? -1 : 1;
    angle = Math.max(Math.abs(releasedAngle) - GRAVITY, MIN_ANGLE);

    startSwing();
  }

  rope.addEventListener("pointerup", releaseDrag);
  rope.addEventListener("pointercancel", releaseDrag);

  resetBtn.addEventListener("click", () => {
    dragState = null;
    cancelAnimationFrame(swingTimer);
    angle = MIN_ANGLE;
    direction = -1;
    applyRotation(8);
    startSwing();
  });

  applyRotation(MIN_ANGLE);
  startSwing();
})();
