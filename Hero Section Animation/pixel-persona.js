/* pixel-persona.js — chunky pixel portrait of Gayathri (from reference photo).
   Character map: one letter = one pixel; padded to 28 cols. */
(function () {
  const MAP = [
    "............................", // 0
    ".........HHHHHHHHHH.........", // 1
    ".......HHHHHHHHHHHHHH.......", // 2
    "......HHHHHHHHHHHHHHHH......", // 3
    ".....HHHHHHHHHHHHHHHHHH.....", // 4
    ".....HHHHHHHHhhHHHHHHHH.....", // 5  centre part
    ".....HHHHFFFFFFFFFFHHHH.....", // 6  forehead
    ".....HHHFFFFFFFFFFFFHHH.....", // 7
    ".....HHHFbbbFFFbbbFFHHH.....", // 8  brows
    ".....HHHFWPFFFFWPFFFHHH.....", // 9  eyes
    ".....HHHFFPFFFFFPFFFHHH.....", // 10
    ".....HHHFFFFFffFFFFFHHH.....", // 11 nose
    ".....HHHRFFFFffFFFFRHHH.....", // 12 blush
    ".....HHHFFFFMLLMFFFFHHH.....", // 13 upper lip
    ".....HHHFFFFFMMMFFFFHGH.....", // 14 lower lip + earring
    ".....HHHFFFFFFFFFFFFHgH.....", // 15 earring drop
    ".....HHHHFFFFFFFFFFHHHH.....", // 16 chin
    ".....HHHHFFnnnnnnFFHHHH.....", // 17 neck
    ".....HHHHFFnnnnnnFFHHHH.....", // 18
    "...HHHHTTTTTTTTTTTTTTHHHH...", // 19 turtleneck collar
    "..HHHHTTTTTTTTTTTTTTTTHHHH..", // 20
    "..HHHHTTTTttttttttTTTTHHHH..", // 21 collar fold
    ".HHHHTTTTTTTTTTTTTTTTTTHHHH.", // 22
    ".HHHHTtTtTtTtTtTtTtTtTtHHHH.", // 23 knit rib
    ".HHHHTTTTTTTTTTTTTTTTTTHHHH.", // 24
    "HHHHTTTTTTTTTTTTTTTTTTTTHHHH", // 25
    "HHHHTtTtTtTtTtTtTtTtTtTtHHHH", // 26 knit rib
    "HHHHHTTTTTTTTTTTTTTTTTTHHHHH", // 27
    "HHHHHTTTTTTTTTTTTTTTTTTHHHHH", // 28
    "HHHHHHTTTTTTTTTTTTTTTTHHHHHH", // 29
    "HHHHHHTtTtTtTtTtTtTtTtHHHHHH", // 30 knit rib
    "HHHHHHHTTTTTTTTTTTTTTHHHHHHH"  // 31 hair flows longest
  ];

  const PAL = {
    H: "#1f1a24", h: "#39313f",              // hair (near-black + cool highlight)
    F: "#c88a5c", f: "#ad703f", n: "#bd8455", // warm brown skin
    W: "#f7ecdd", P: "#3a2a1e", b: "#241a12", // eyes / brows
    R: "#c98565", M: "#b06b63", L: "#c98a7f", // blush / lips
    T: "#f2e8d2", t: "#e2d4b6",               // cream turtleneck
    G: "#e3b35a", g: "#bf8f2c"                // gold hoop earring
  };

  window.renderPersona = function (canvasId, scale) {
    const cv = document.getElementById(canvasId);
    if (!cv) return;
    const s = scale || 5;
    const cols = 28, rows = MAP.length;
    cv.width = cols * s; cv.height = rows * s;
    cv.style.width = (cols * s) + "px";
    cv.style.height = (rows * s) + "px";
    cv.style.imageRendering = "pixelated";
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (let y = 0; y < rows; y++) {
      const row = (MAP[y] || "").padEnd(cols, ".");
      for (let x = 0; x < cols; x++) {
        const col = PAL[row[x]];
        if (col) { ctx.fillStyle = col; ctx.fillRect(x * s, y * s, s, s); }
      }
    }
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", () => window.renderPersona("persona-canvas", 5));
  else window.renderPersona("persona-canvas", 5);
})();
