const episode = document.querySelector(".episode");
const orchard = document.querySelector(".orchard");
const cat = document.querySelector(".cat");
const catMeme = document.querySelector(".cat-meme");
const memeImages = catMeme.querySelectorAll("img");
const replayJump = document.querySelector("[data-replay-jump]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const leafLayer = document.querySelector(".leaves");
const progress = document.querySelectorAll("[data-step]");
const stepFor = { portada: 1, recuerdo: 1, pregunta: 2, no: 2, si: 3, carta: 3 };
const leafColors = ["#fff2f8", "#ffd0e4", "#fca9cc", "#e879a8", "#cf568e"];

const bareBranches = leafLayer?.querySelector(".bare-branches");
const shedMask = bareBranches?.querySelector("mask");
const petalsPerCluster = 12;
const airborneLeaves = new Map();
let leafTimer;
let memeRequest = 0;

// Coordinates of blossom clusters in the 1536 × 1024 orchard painting.
const blossomClusters = [
  [220, 163], [345, 234], [500, 224], [620, 278], [765, 306],
  [885, 332], [1007, 278], [1176, 252], [1310, 186], [1440, 220],
].map(([x, y]) => {
  const opening = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  opening.setAttribute("cx", x);
  opening.setAttribute("cy", y);
  opening.setAttribute("r", 0);
  opening.setAttribute("fill", "url(#shed-edge)");
  shedMask?.append(opening);
  return { x, y, opening, remaining: petalsPerCluster };
});

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function getOrchardCrop() {
  const painting = episode.dataset.scene === "si" ? memeImages[0] : orchard;
  const { clientWidth: width, clientHeight: height } = leafLayer;
  const scale = Math.max(width / 1536, height / 1024);
  const [alignX, alignY] = getComputedStyle(painting).objectPosition
    .split(" ").map(value => parseFloat(value) / 100);
  const cropX = (width - 1536 * scale) * alignX;
  const cropY = (height - 1024 * scale) * alignY;
  return { width, height, scale, cropX, cropY };
}

function placeBareBranches() {
  if (!bareBranches) return;
  const { scale, cropX, cropY } = getOrchardCrop();
  Object.assign(bareBranches.style, {
    left: `${cropX}px`, top: `${cropY}px`,
    width: `${1536 * scale}px`, height: `${1024 * scale}px`,
  });
}

function releaseLeaf() {
  const { width, height, scale, cropX, cropY } = getOrchardCrop();
  if (!width || !height) return false;

  const visibleClusters = blossomClusters.filter(cluster => cluster.remaining > 0).map(cluster => ({
    cluster,
    x: (cluster.x * scale + cropX) / width * 100,
    y: (cluster.y * scale + cropY) / height * 100,
  })).filter(point => point.x > 4 && point.x < 96 && point.y > 3 && point.y < 42);
  if (!visibleClusters.length) return false;

  const branch = visibleClusters[Math.floor(Math.random() * visibleClusters.length)];
  branch.cluster.remaining--;
  const shedFraction = 1 - branch.cluster.remaining / petalsPerCluster;
  branch.cluster.opening.setAttribute("r", 88 * Math.sqrt(shedFraction));
  const startX = branch.x + randomBetween(-2, 2);
  const startY = branch.y + randomBetween(-1.4, 1.4);
  const wind = randomBetween(-26, 26);
  const sway = randomBetween(-9, 9);
  const groundX = Math.max(3, Math.min(97, startX + wind));
  const groundY = randomBetween(87, 98);
  const turn = randomBetween(-80, 80);
  const spin = randomBetween(120, 360) * (Math.random() < .5 ? -1 : 1);
  const leaf = document.createElement("span");
  leaf.className = "leaf";
  leaf.style.width = `${randomBetween(7, 17)}px`;
  leaf.style.setProperty("--color", leafColors[Math.floor(Math.random() * leafColors.length)]);

  const pose = (left, top, angle, scaleValue = "1") => ({
    left: `${left}%`, top: `${top}%`,
    transform: `translate(-50%, -50%) rotate(${angle}deg) scale(${scaleValue})`,
  });
  const settled = pose(groundX, groundY, turn + spin, "1, .66");
  leafLayer.append(leaf);
  const flight = leaf.animate([
    { ...pose(startX, startY, turn, ".65"), opacity: 0, offset: 0 },
    { ...pose(startX, startY, turn - 12), opacity: .96, offset: .06 },
    { ...pose(startX + 1, startY + 1, turn + 16), opacity: .96, offset: .12 },
    { ...pose(startX + wind * .27 + sway, startY + (groundY - startY) * .27, turn + spin * .35, ".64, 1"), opacity: .96, offset: .38 },
    { ...pose(startX + wind * .7 - sway, startY + (groundY - startY) * .72, turn + spin * .76), opacity: .96, offset: .76 },
    { ...settled, opacity: .86, offset: 1 },
  ], { duration: randomBetween(4600, 7900), fill: "forwards" });

  airborneLeaves.set(leaf, { flight, settled });
  flight.addEventListener("finish", () => settleLeaf(leaf), { once: true });
  return true;
}

function settleLeaf(leaf) {
  const landing = airborneLeaves.get(leaf);
  if (!landing) return;
  Object.assign(leaf.style, landing.settled);
  leaf.classList.add("is-settled");
  airborneLeaves.delete(leaf);
  landing.flight.cancel();
}

function queueLeaf() {
  leafTimer = undefined;
  if (!releaseLeaf()) return;
  leafTimer = setTimeout(queueLeaf, randomBetween(200, 670));
}

function syncLeaves() {
  if (!leafLayer) return;
  if (leafLayer.hidden || reduceMotion.matches) {
    clearTimeout(leafTimer);
    leafTimer = undefined;
    for (const leaf of airborneLeaves.keys()) settleLeaf(leaf);
    return;
  }
  placeBareBranches();
  if (leafTimer === undefined) queueLeaf();
}

async function playMeme() {
  const request = ++memeRequest;
  await Promise.allSettled([...memeImages].map(image => image.decode()));
  if (request !== memeRequest || catMeme.hidden) return;

  catMeme.classList.remove("is-showing");
  catMeme.getBoundingClientRect();
  catMeme.classList.add("is-showing");
}

function showScene(id) {
  const previous = document.getElementById(episode.dataset.scene);
  const next = document.getElementById(id);
  previous.hidden = true;
  next.hidden = false;
  episode.dataset.scene = id;
  const isReaction = id === "no";
  const isCelebration = id === "si";
  orchard.hidden = isReaction || isCelebration;
  catMeme.hidden = !isCelebration;
  if (!isCelebration) {
    memeRequest++;
    catMeme.classList.remove("is-showing");
  }
  cat.hidden = !isReaction;
  if (leafLayer) leafLayer.hidden = isReaction;

  for (const dot of progress) {
    if (Number(dot.dataset.step) === stepFor[id]) dot.setAttribute("aria-current", "step");
    else dot.removeAttribute("aria-current");
  }
  syncLeaves();

  const title = next.querySelector("h1, h2");
  title.focus({ preventScroll: true });
  const bounds = title.getBoundingClientRect();
  if (bounds.top < 0 || bounds.bottom > window.innerHeight) title.scrollIntoView({ block: "center" });
  if (isCelebration && !reduceMotion.matches) playMeme();
}

for (const button of episode.querySelectorAll("[data-go]")) {
  button.addEventListener("click", () => showScene(button.dataset.go));
}

replayJump.addEventListener("click", () => {
  catMeme.scrollIntoView({ block: "nearest", behavior: "instant" });
  playMeme();
});
if (leafLayer) new ResizeObserver(syncLeaves).observe(leafLayer);
reduceMotion.addEventListener("change", syncLeaves);
syncLeaves();
