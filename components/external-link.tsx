"use strict";

let inputData = "";
let ptr = 0;

function ri() {
  while (ptr < inputData.length && inputData[ptr] <= ' ') ptr++;
  let num = 0;
  while (ptr < inputData.length && inputData[ptr] >= '0' && inputData[ptr] <= '9') {
    num = num * 10 + (inputData.charCodeAt(ptr) - 48);
    ptr++;
  }
  return num;
}

function solve() {
  const n = ri(), h = ri(), k = ri();
  const a = new Array(n);
  for (let i = 0; i < n; i++) a[i] = ri();

  // prefix sums
  const pre = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + a[i];
  const totalDmg = pre[n];

  // Time to kill with given array (no swap), returns seconds
  // If cumulative after r full rounds + i bullets >= h
  function timeToKill(arr) {
    // recompute prefix for arr
    let cum = 0;
    if (arr === a) {
      // use pre
      // full rounds needed before partial
      if (totalDmg <= 0) return Infinity;
      // how many full rounds before we even need a partial?
      // After r full rounds + i bullets: r*totalDmg + pre[i] >= h
      // Find minimum time = r*(n+k) + i
      // Binary search on total bullets fired
      let lo = 1, hi = Math.ceil(h / (totalDmg || 1)) * n + n;
      // just simulate round by round - n up to 2e5, h up to 1e9
      // rounds needed: floor((h-1)/totalDmg)
      const fullRounds = totalDmg > 0 ? Math.floor(Math.max(0, h - 1) / totalDmg) : 0;
      const remaining = h - fullRounds * totalDmg;
      // find first bullet in array with prefix >= remaining
      let pos = n; // default: need all bullets
      for (let i = 1; i <= n; i++) {
        if (pre[i] >= remaining) { pos = i; break; }
      }
      return fullRounds * (n + k) + pos;
    }
    return Infinity;
  }

  // No swap
  const base = timeToKill(a);

  // With swap: try placing each element a[j] at position 0 (swap a[0] with a[j])
  // Or more generally: for each possible "killer" bullet position j, swap it to earliest useful spot
  // 
  // Actually optimal: find the best single swap.
  // After swap(i,j), the array changes at positions i and j.
  // We need minimum time. The only useful swaps move a large bullet earlier.
  //
  // Strategy: try all swaps of position 0 with every other position j (move a[j] to front)
  // AND try swaps that place the max element at the critical position.
  // 
  // But n=2e5 and t=1e4... need O(n) per test case.
  //
  // Key insight: The optimal swap either:
  // 1. Swaps some a[j] to position 0 (making it shoot first)
  // 2. The answer with no swap
  // Because making the largest bullet shoot first minimizes time in round 1.
  // But we also need to consider: what if we're already killing in round 1 but 
  // a swap within round 1 helps? Moving a later bullet in round 1 earlier doesn't 
  // change the total damage of round 1, just when it's delivered.
  //
  // So the optimal swap: find max a[j] for j>0, swap it to position 0.
  // Also try: for each j, swap a[j] to front and compute time.
  // O(n) per test case is fine.

  // Precompute: prefix sums of original
  // After swapping index 0 and j: new array has a[j] at 0, a[0] at j
  // new prefix: 
  //   pre'[i] for i <= j: pre[i] - a[0] + a[j]  (if i >= 1, since pos 0 changed)
  //   at pos j: pre[j] - a[j] + a[0]  ... 
  // Let's be precise:
  // new_pre[i] = sum of new_a[0..i-1]
  // new_a[0] = a[j], new_a[j] = a[0], rest same
  // new_pre[i] = pre[i] + (a[j]-a[0])  for 1 <= i <= j
  // new_pre[i] = pre[i]                 for i > j
  // (since we removed a[0] from front and added a[j], net +delta for i in [1,j])
  // and for i > j, the a[j]->a[0] swap cancels with a[0]->a[j] swap)

  // Similarly swap(i, j) for arbitrary i,j is complex. Let's just try all j swapped to pos 0.
  // This is the most impactful swap. If we need more, try also swapping within other positions.
  
  // Actually, we should try swapping EVERY pair? No, O(n^2) too slow.
  // 
  // Better insight: We only need to try swapping the maximum element to each earlier position.
  // Or: for each possible "time of death" round r, what's the best we can do?
  //
  // Simplest O(n) approach that covers the optimal:
  // Try swap(0, j) for all j. This is O(n).
  // Also try swap(i, 0) which is same thing.
  // This covers moving any bullet to position 1 (shoot first).

  const delta0 = a[0]; // original a[0]
  let best = base;

  for (let j = 1; j < n; j++) {
    const deltaJ = a[j];
    // new prefix: new_pre[i] = pre[i] + (deltaJ - delta0) for 1<=i<=j
    //             new_pre[i] = pre[i] for i>j
    // total damage same = totalDmg
    const diff = deltaJ - delta0;
    // full rounds: same formula
    const fullRounds = totalDmg > 0 ? Math.floor(Math.max(0, h - 1) / totalDmg) : 0;
    const remaining = h - fullRounds * totalDmg;
    // find first i where new_pre[i] >= remaining
    // new_pre[i] = pre[i] + diff  for i <= j
    //            = pre[i]          for i > j
    // Binary search or linear scan:
    let pos = n;
    for (let i = 1; i <= n; i++) {
      const np = i <= j ? pre[i] + diff : pre[i];
      if (np >= remaining) { pos = i; break; }
    }
    const t = fullRounds * (n + k) + pos;
    if (t < best) best = t;
  }

  return best;
}

process.stdin.resume();
process.stdin.setEncoding("utf8");
process.stdin.on("data", d => (inputData += d));
process.stdin.on("end", () => {
  const T = ri();
  const out = [];
  for (let t = 0; t < T; t++) out.push(solve());
  process.stdout.write(out.join("\n") + "\n");
});