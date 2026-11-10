const episode = document.querySelector(".episode");
const orchard = document.querySelector(".orchard");
const cat = document.querySelector(".cat");
const leafLayer = document.querySelector(".leaves");
const progress = document.querySelectorAll("[data-step]");
const stepFor = { portada: 1, recuerdo: 1, pregunta: 2, no: 2, si: 3, carta: 3 };
const leafColors = ["#d78952", "#c56369", "#8b9462", "#e9ae6d", "#b28755"];

function scatterLeaves(count) {
  const leaves = document.createDocumentFragment();

  for (let index = 0; index < count; index++) {
    const leaf = document.createElement("span");
    leaf.className = "leaf";
    leaf.style.setProperty("--left", `${Math.random() * 100}%`);
    leaf.style.setProperty("--width", `${5 + Math.random() * 6}px`);
    leaf.style.setProperty("--drift", `${-85 + Math.random() * 170}px`);
    leaf.style.setProperty("--duration", `${9 + Math.random() * 9}s`);
    leaf.style.setProperty("--delay", `${-Math.random() * 15}s`);
    leaf.style.setProperty("--color", leafColors[index % leafColors.length]);
    leaves.append(leaf);
  }

  leafLayer.replaceChildren(leaves);
}

function showScene(id) {
  const previous = document.getElementById(episode.dataset.scene);
  const next = document.getElementById(id);
  const isReaction = id === "no";

  previous.hidden = true;
  next.hidden = false;
  episode.dataset.scene = id;
  orchard.hidden = isReaction;
  cat.hidden = !isReaction;
  leafLayer.hidden = isReaction;

  for (const dot of progress) {
    if (Number(dot.dataset.step) === stepFor[id]) {
      dot.setAttribute("aria-current", "step");
    } else {
      dot.removeAttribute("aria-current");
    }
  }

  if (id === "si" || id === "portada") {
    scatterLeaves(id === "si" ? 36 : 17);
  }

  const title = next.querySelector("h1, h2");
  title.focus({ preventScroll: true });

  const bounds = title.getBoundingClientRect();
  if (bounds.top < 0 || bounds.bottom > window.innerHeight) {
    title.scrollIntoView({ block: "center" });
  }
}

for (const button of episode.querySelectorAll("[data-go]")) {
  button.addEventListener("click", () => showScene(button.dataset.go));
}

scatterLeaves(17);

