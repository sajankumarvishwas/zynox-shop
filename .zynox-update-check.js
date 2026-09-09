document.querySelector(".zy-menu-toggle").addEventListener("click",function(){const p=document.querySelector(".zy-menu-panel"),o=this.getAttribute("aria-expanded")==="true";this.setAttribute("aria-expanded",String(!o));p.setAttribute("aria-hidden",String(o));p.classList.toggle("is-open",!o);});
document.querySelectorAll(".zy-menu-panel a").forEach(a=>a.addEventListener("click",event=>{if(a.hasAttribute("data-about-admin")){event.preventDefault();document.querySelector(".zy-about-admin").classList.add("is-visible");document.querySelector(".zy-about-admin").setAttribute("aria-hidden","false");}document.querySelector(".zy-menu-toggle").setAttribute("aria-expanded","false");document.querySelector(".zy-menu-panel").setAttribute("aria-hidden","true");document.querySelector(".zy-menu-panel").classList.remove("is-open");}));
</script>
<script>
(() => {
  const toast = document.getElementById("zy-soon-toast");
  const project = document.getElementById("zy-soon-toast-project");
  let timer;

  document.querySelectorAll(".zy-soon-card").forEach(card => {
    card.addEventListener("click", () => {
      project.textContent = card.dataset.soon + " IS STILL COOKING.";
      toast.classList.remove("is-visible");
      void toast.offsetWidth;
      toast.classList.add("is-visible");
      toast.setAttribute("aria-hidden", "false");

      clearTimeout(timer);
      timer = setTimeout(() => {
        toast.classList.remove("is-visible");
        toast.setAttribute("aria-hidden", "true");
      }, 2400);
    });
  });
})();
</script>
<script>
(() => {
  const overlay = document.getElementById("zy-update-overlay");
  const closeBtn = document.getElementById("zy-update-close");
  const steps = [...document.querySelectorAll("[data-update-step]")];
  const counter = document.getElementById("zy-update-counter");

  if (!overlay || !closeBtn || steps.length < 2) return;

  let currentStep = 0;

  function showStep(index) {
    currentStep = index;

    steps.forEach((step, i) => {
      step.hidden = i !== index;
    });

    if (counter) {
      counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}`;
    }

    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("zy-update-locked");
  }

  function closeUpdates() {
    overlay.setAttribute("aria-hidden", "true");
    overlay.classList.add("zy-update-finished");
    document.body.classList.remove("zy-update-locked");
  }

  closeBtn.addEventListener("click", () => {
    if (currentStep < steps.length - 1) {
      showStep(currentStep + 1);
    } else {
      closeUpdates();
    }
  });

  steps.forEach((step, index) => {
    step.addEventListener("click", (event) => {
      if (event.target.closest(".zy-update-close")) return;

      if (index === 0) {
        window.location.href = "/minigames.html";
      } else if (index === 1) {
        window.location.href = "/zynoxify.html";
      }
    });
  });

  showStep(0);
})();
