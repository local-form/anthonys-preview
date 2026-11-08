// Anthony's · The Holiday Case. No libraries. Nothing animates unless something changes.
(() => {
const q = (s, r = document) => r.querySelector(s), qa = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
qa('[data-year]').forEach(e => e.textContent = new Date().getFullYear());

// ---------- data ----------
const cakes = JSON.parse(q('#flavor-data').textContent);           // {n, d, c, p:[large, medium, small, slice]}
const GROUP = { fruity: 'Fruity', chocolate: 'Chocolate', classic: 'Classic' };
const SIZES = [{ i: 2, name: 'Small', serves: 'serves 6' }, { i: 1, name: 'Medium', serves: 'serves 8' }, { i: 0, name: 'Large', serves: 'serves 10–12' }];
const lowest = c => { const v = [c.p[0], c.p[1], c.p[2]].filter(Boolean).map(s => +s.slice(1)); return v.length ? '$' + Math.min(...v) : null; };
const state = { cake: null, size: 2, day: null };   // day = UTC ms of a New York calendar date

// ---------- New York calendar maths (dates as UTC midnights) ----------
const nyParts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
const P = t => +nyParts.find(x => x.type === t).value;
const DAY = 864e5, today = Date.UTC(P('year'), P('month') - 1, P('day')), nowMin = P('hour') * 60 + P('minute');
const dow = t => new Date(t).getUTCDay();
const CLOSE = { 0: 900, 4: 1260, 5: 1260, 6: 1260 };                  // last close per open day (minutes): Sun 3pm, Thu–Sat 9pm
const isOpen = t => dow(t) in CLOSE;
const fmt = (t, o) => new Date(t).toLocaleDateString('en-US', { timeZone: 'UTC', ...o });
const short = t => fmt(t, { weekday: 'short', month: 'short', day: 'numeric' });
const long = t => fmt(t, { weekday: 'long', month: 'long', day: 'numeric' });
// earliest pickup: 48 hours from now; the day two days out only counts if they are still open at this time of day
let earliest = today + 2 * DAY;
if (!(isOpen(earliest) && nowMin < CLOSE[dow(earliest)])) { earliest += DAY; while (!isOpen(earliest)) earliest += DAY; }
// holidays
const year = new Date(today).getUTCFullYear();
const thanks = y => { const d = Date.UTC(y, 10, 1); return d + (((4 - dow(d)) + 7) % 7 + 21) * DAY; };   // 4th Thursday of November
const holidays = [];
for (const y of [year, year + 1]) holidays.push({ name: 'Thanksgiving', day: thanks(y) }, { name: 'Christmas', day: Date.UTC(y, 11, 25) });
holidays.forEach(h => { let t = h.day - DAY; while (!isOpen(t)) t -= DAY; h.last = t; h.by = t - 2 * DAY; });
const holidayOn = t => holidays.find(h => h.day === t) || (fmt(t, { month: 'numeric', day: 'numeric' }) === '12/24' ? { name: 'Christmas Eve', day: t } : null);
const holidayFor = t => holidays.find(h => t <= h.day && t > h.day - 8 * DAY);   // a pickup in the week before a holiday
const lastOpenOnOrBefore = t => { while (!isOpen(t)) t -= DAY; return t; };

// ---------- hero countdown ----------
(() => {
  const h = holidays.filter(h => h.by >= today).sort((a, b) => a.by - b.by)[0];
  if (!h) return;
  const left = Math.round((h.by - today) / DAY);
  q('#dl-num').textContent = left === 0 ? 'Today' : left;
  q('#dl-unit').textContent = left === 0 ? 'last day' : left === 1 ? 'day' : 'days';
  if (left === 0) q('#dl-num').style.fontSize = '0.6em';
  q('#dl-head').textContent = `${h.name} orders close ${fmt(h.by, { weekday: 'short', month: 'short', day: 'numeric' })}.`;
  let body = `That’s for ${fmt(h.last, { weekday: 'long', month: 'short', day: 'numeric' })} pickup, the last open day before ${h.name}.`;
  if (!isOpen(h.by)) body += ` They’re closed ${fmt(h.by, { weekday: 'long' })}, so call by ${fmt(lastOpenOnOrBefore(h.by), { weekday: 'short', month: 'short', day: 'numeric' })}.`;
  q('#dl-body').textContent = body;
})();

// ---------- the case: filter + tag rail ----------
const rail = q('#rail'), sheet = q('#sheet');
let opener = null;
function fillRail(group, animate) {
  const list = cakes.filter(c => c.c === group);
  const tags = list.map((c, i) => { const b = el('button', 'tag'); b.type = 'button'; b.style.setProperty('--i', i);
    b.append(el('b', null, c.n), el('i', null, lowest(c) ? 'from ' + lowest(c) : 'call for price'));
    b.addEventListener('click', () => { opener = b; openSheet(c); }); return b; });
  const all = el('a', 'tag all', 'All 48 on the menu'); all.href = 'menu.html?menu=cheesecake'; all.style.setProperty('--i', list.length);
  rail.replaceChildren(...tags, all); rail.scrollLeft = 0;
  if (animate && !reduce) { rail.classList.remove('swap'); void rail.offsetWidth; rail.classList.add('swap'); }
}
qa('.tab').forEach(t => t.addEventListener('click', () => {
  if (t.getAttribute('aria-pressed') === 'true') return;
  qa('.tab').forEach(x => x.setAttribute('aria-pressed', String(x === t)));
  fillRail(t.dataset.group, true);
}));
fillRail('fruity', false);

// ---------- flavor sheet ----------
let sheetCake = null;
function openSheet(c) {
  sheetCake = c;
  q('#sh-group').textContent = GROUP[c.c] + ' · cheesecake';
  q('#sh-name').textContent = c.n;
  q('#sh-desc').textContent = c.d;
  const rows = [...SIZES].reverse().map(s => { const d = el('div'), dt = el('dt', null, s.name + ' '), dd = el('dd', null, c.p[s.i] || 'Call');
    dt.append(el('span', null, s.serves)); d.append(dt, dd); return d; });
  if (c.p[3]) { const d = el('div'), dt = el('dt', null, 'A slice '); dt.append(el('span', null, 'eat in or take out')); d.append(dt, el('dd', null, c.p[3])); rows.push(d); }
  q('#sh-sizes').replaceChildren(...rows);
  if (sheet.showModal) sheet.showModal(); else sheet.setAttribute('open', '');
}
const closeSheet = () => sheet.close ? sheet.close() : sheet.removeAttribute('open');
q('#sh-close').addEventListener('click', closeSheet);
sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });
sheet.addEventListener('close', () => { if (opener) opener.focus({ preventScroll: true }); });
q('#sh-order').addEventListener('click', () => {
  pickCake(sheetCake.n); opener = null; closeSheet();
  q('#order').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  setTimeout(() => q('#o-flavor').focus({ preventScroll: true }), reduce ? 0 : 600);
});

// ---------- step 1: cake ----------
const sel = q('#o-flavor');
sel.append(new Option('Choose a flavor…', ''));
for (const g of Object.keys(GROUP)) { const og = document.createElement('optgroup'); og.label = GROUP[g]; cakes.filter(c => c.c === g).forEach(c => og.append(new Option(c.n, c.n))); sel.append(og); }
sel.addEventListener('change', () => pickCake(sel.value));
const sizesBox = q('#o-sizes');
function drawSizes() {
  const c = state.cake;
  sizesBox.replaceChildren(...SIZES.map(s => { const b = el('button', 'size'); b.type = 'button'; b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(state.size === s.i)); b.tabIndex = state.size === s.i ? 0 : -1;
    b.append(el('b', null, s.name), el('span', null, s.serves), el('em', null, c ? (c.p[s.i] || 'Call') : '–'));
    b.addEventListener('click', () => { state.size = s.i; drawSizes(); update(); });
    b.addEventListener('keydown', e => { const k = SIZES.findIndex(x => x.i === state.size); let n;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (k + 1) % 3; if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (k + 2) % 3;
      if (n != null) { e.preventDefault(); state.size = SIZES[n].i; drawSizes(); update(); sizesBox.children[n].focus(); } });
    return b; }));
}
function pickCake(name) { state.cake = cakes.find(c => c.n === name) || null; sel.value = state.cake ? state.cake.n : ''; q('#o-desc').textContent = state.cake ? state.cake.d : ''; drawSizes(); update(); }

// ---------- step 2: pickup day ----------
const cal = q('#cal'), months = [];
{ const d = new Date(today); for (let i = 0; i < 3; i++) months.push(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + i, 1)); }
let mi = 0;
function drawCal() {
  const m0 = months[mi], m = new Date(m0), days = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 0)).getUTCDate();
  q('#cal-month').textContent = fmt(m0, { month: 'long', year: 'numeric' });
  q('#cal-prev').disabled = mi === 0; q('#cal-next').disabled = mi === months.length - 1;
  const cells = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => { const c = el('span', 'dow', d); c.title = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]; return c; });
  for (let i = 0; i < dow(m0); i++) cells.push(el('span'));
  for (let n = 1; n <= days; n++) {
    const t = m0 + (n - 1) * DAY, b = el('button', 'day'); b.type = 'button'; b.append(String(n));
    const hol = holidayOn(t), last = holidays.find(h => h.last === t);
    let label = long(t);
    if (t < today) { b.disabled = true; label += ', past'; }
    else if (!isOpen(t)) { b.classList.add('closed'); b.disabled = true; label += ', closed'; }
    else if (t < earliest) { b.disabled = true; label += ', under 48 hours’ notice'; }
    else {
      b.classList.add('open');
      if (hol) { b.classList.add('hol'); label += `, ${hol.name}, call to confirm holiday hours`; }
      else if (last) { b.classList.add('last'); label += `, last open day before ${last.name}`; }
      b.setAttribute('aria-pressed', String(state.day === t));
      b.addEventListener('click', () => { state.day = t; drawCal(); update(); });
    }
    b.setAttribute('aria-label', label); cells.push(b);
  }
  cal.replaceChildren(...cells);
}
q('#cal-prev').addEventListener('click', () => { if (mi > 0) { mi--; drawCal(); } });
q('#cal-next').addEventListener('click', () => { if (mi < months.length - 1) { mi++; drawCal(); } });
q('#earliest').textContent = long(earliest);
// key holiday dates under the calendar, in words
{ const items = [];
  for (const h of holidays.filter(h => h.day >= earliest && h.day < months[months.length - 1] + 31 * DAY)) {
    if (h.last >= earliest) items.push([short(h.last), `Last regular pickup before ${h.name} · order by ${short(h.by)}`]);
    items.push([short(h.day), `${h.name}: call for holiday hours`]);
    if (h.name === 'Christmas') { const eve = h.day - DAY; if (eve !== h.last) items.push([short(eve), 'Christmas Eve: call for holiday hours']); else items[items.length - 2][1] += '; call for Christmas Eve hours'; }
  }
  const ul = el('ul', 'keydates'); ul.setAttribute('aria-label', 'Holiday dates');
  items.forEach(([d, t]) => { const li = el('li'); li.append(el('b', null, d), el('span', null, t)); ul.append(li); });
  q('#day-pick').before(ul); }
// open the month that holds the next holiday's last pickup day, so the deadline is the first thing you see
{ const h = holidays.filter(h => h.last >= earliest).sort((a, b) => a.last - b.last)[0]; if (h) { const k = months.findIndex(m => new Date(m).getUTCMonth() === new Date(h.last).getUTCMonth() && new Date(m).getUTCFullYear() === new Date(h.last).getUTCFullYear()); if (k > 0) mi = k; } }

// ---------- step 3: the ticket fills itself in ----------
function update() {
  const c = state.cake, s = SIZES.find(x => x.i === state.size), t = state.day;
  const price = c ? (c.p[s.i] || 'Call for price') : '–';
  q('#t-cake').textContent = c ? `${s.name} ${c.n}` : '–';
  q('#t-price').textContent = c ? price : '–';
  let dayText = '–', byText = '–', why = '';
  if (t != null) {
    const hol = holidayOn(t), forH = holidayFor(t);
    dayText = short(t) + (hol ? ' · call for holiday hours' : '');
    if (forH) why = forH.name;
    let by = t - 2 * DAY; byText = short(by) + (isOpen(by) ? '' : ` (call by ${short(lastOpenOnOrBefore(by))}; closed ${fmt(by, { weekday: 'short' })})`);
  }
  q('#t-day').textContent = dayText; q('#t-by').textContent = byText;
  const sum = q('#summary'); sum.replaceChildren();
  if (c || t != null) {
    sum.append(c ? `${s.name} ${c.n}` : 'A cheesecake');
    if (t != null) { sum.append(', pickup '); const em = el('em', null, fmt(t, { weekday: 'short', month: 'short', day: 'numeric' })); sum.append(em); if (why) sum.append(`, for ${why}`); }
    sum.append('.');
  } else sum.textContent = 'Pick a cake and a pickup day.';
}
drawSizes(); drawCal(); update();

// ---------- request forms: read back, send nothing ----------
const showDone = (box, line, extra) => { const b = el('b', null, line); box.replaceChildren(b, el('span', null, extra)); box.hidden = false; box.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); };
q('#ticket').addEventListener('submit', e => {
  e.preventDefault(); const f = e.target, err = q('#t-err'), name = f.elements.name.value.trim(), phone = f.elements.phone.value.trim();
  const miss = []; if (!state.cake) miss.push('a flavor'); if (state.day == null) miss.push('a pickup day'); if (!name) miss.push('your name'); if (!phone) miss.push('a phone number');
  if (miss.length) { err.textContent = 'Still needed: ' + miss.join(', ') + '.'; err.hidden = false; return; }
  err.hidden = true;
  const msg = f.elements.msg.value.trim();
  showDone(q('#t-done'), `Your request: ${q('#summary').textContent.replace(/\.$/, '')}${msg ? `, “${msg}” on top` : ''}, for ${name}.`,
    'Preview only: nothing was sent. On the real site, Anthony’s calls you back to confirm the cake, the pickup time and the price. To order now, call (973) 415-8885.');
});
// table request
const rDay = q('#r-day'); rDay.min = new Date(today).toISOString().slice(0, 10);
const SERV = { Dinner: [4, 5, 6], Brunch: [6, 0], Lunch: [4, 5] };
q('#table').addEventListener('submit', e => {
  e.preventDefault(); const f = e.target, err = q('#r-err'), name = f.elements.name.value.trim(), phone = f.elements.phone.value.trim(), meal = f.elements.meal.value;
  const miss = []; if (!name) miss.push('your name'); if (!phone) miss.push('a phone number'); if (!rDay.value) miss.push('a day');
  if (miss.length) { err.textContent = 'Still needed: ' + miss.join(', ') + '.'; err.hidden = false; return; }
  const t = Date.parse(rDay.value + 'T00:00:00Z');
  if (!SERV[meal].includes(dow(t))) { err.textContent = `${meal} isn’t served on ${fmt(t, { weekday: 'long' })}s. ${q('#r-hint').textContent.split('.').slice(0, 3).join('.')}.`; err.hidden = false; return; }
  err.hidden = true;
  showDone(q('#r-done'), `Your request: ${meal} for ${f.elements.guests.value || 2}, ${long(t)}, for ${name}.`, 'Preview only: nothing was sent. On the real site, Anthony’s calls or texts to confirm your table. To book now, call (973) 415-8885.');
});

// ---------- kitchen tabs ----------
const previews = { brunch: [['Apple Fritter French Toast', 'Egg-dipped, griddled, and dusted with powdered sugar.', '$16'], ['Crisp Buttermilk Chicken and Waffles', 'Buttermilk fried chicken, pears, bacon and cheddar between two house waffles.', '$20'], ['The Brunch Burger', 'Short rib & brisket, bacon, cheddar, and an over-easy egg.', '$22']], lunch: [['Chicken Milanese Sandwich', 'Chicken cutlet, arugula, cherry peppers, and shaved pecorino.', '$16'], ['Hot Honey Chicken Sandwich', 'Crispy chicken, house slaw, pickles, and hot honey.', '$15'], ['Crispy Buttermilk Chicken & Waffles', 'Buttermilk fried chicken, bacon, cheddar, brown butter pears and maple syrup.', '$20']], dinner: [['Chicken Parm Vodka', 'Chicken parmigiana, house vodka sauce, and fresh mozzarella.', '$28'], ['Cavatelli with Sausage & Broccoli Rabe', 'Hot & sweet Italian sausage, garlic, and pecorino.', '$20'], ['Fettucini Vodka & Braised Short Rib', 'Braised beef short rib, house vodka sauce, and ricotta.', '$34']] };
const photos = { dinner: ['ravioli.webp', 'Fresh ravioli with sage, toasted nuts and grated cheese at Anthony’s', 'Ravioli with sage · dinner', 1080, 1350], brunch: ['chicken-waffles.webp', 'A chicken and waffle sandwich at Anthony’s', 'Chicken and waffles · brunch and lunch', 1200, 916] };
photos.lunch = photos.brunch;
const tabs = qa('[data-preview]');
function setTab(b) {
  const k = b.dataset.preview, img = q('#meal-image'), ph = photos[k];
  tabs.forEach(x => { x.setAttribute('aria-selected', String(x === b)); x.tabIndex = x === b ? 0 : -1; });
  const panel = q('#meal-preview'); panel.setAttribute('aria-labelledby', b.id);
  panel.replaceChildren(...previews[k].map(([n, d, p]) => { const row = el('div', 'dish'), w = el('div'); w.append(el('h3', null, n), el('p', null, d)); row.append(w, el('span', null, p)); return row; }));
  const link = q('#full-menu-link'); link.href = 'menu.html?menu=' + k; link.textContent = `See the full ${k} menu`;
  q('#r-meal').value = k[0].toUpperCase() + k.slice(1);
  if (!img.getAttribute('src').endsWith(ph[0])) { const swap = () => { img.src = 'assets/' + ph[0]; img.alt = ph[1]; img.width = ph[3]; img.height = ph[4]; q('#meal-caption').textContent = ph[2]; img.classList.remove('fading'); };
    if (reduce) swap(); else { img.classList.add('fading'); setTimeout(swap, 180); } }
}
tabs.forEach(b => { b.addEventListener('click', () => setTab(b)); b.addEventListener('keydown', e => { const i = tabs.indexOf(b); let n;
  if (e.key === 'ArrowRight') n = (i + 1) % tabs.length; if (e.key === 'ArrowLeft') n = (i + tabs.length - 1) % tabs.length;
  if (n != null) { e.preventDefault(); tabs[n].focus(); setTab(tabs[n]); } }); });

// ---------- open now (America/New_York) ----------
(() => {
  const sched = { 0: [[600, 900]], 4: [[660, 960], [1020, 1260]], 5: [[660, 960], [1020, 1260]], 6: [[630, 960], [1020, 1260]] };
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const t = m => { const h = Math.floor(m / 60), mm = m % 60; return (h % 12 || 12) + (mm ? ':' + String(mm).padStart(2, '0') : '') + (h < 12 ? ' am' : ' pm'); };
  const d = dow(today), st = q('#open-status'), txt = q('#open-text');
  qa('[data-hours] [data-days]').forEach(r => { if (r.dataset.days.split(',').map(Number).includes(d)) r.classList.add('is-today'); });
  const now = (sched[d] || []).find(([a, b]) => nowMin >= a && nowMin < b);
  if (now) { st.classList.add('is-open'); txt.textContent = 'Open now · until ' + t(now[1]); return; }
  st.classList.add('is-closed'); const later = (sched[d] || []).find(([a]) => a > nowMin);
  if (later) { txt.textContent = 'Closed now · opens ' + t(later[0]); return; }
  for (let i = 1; i <= 7; i++) { const k = (d + i) % 7; if (sched[k]) { txt.textContent = 'Closed now · opens ' + (i === 1 ? 'tomorrow' : names[k]) + ' ' + t(sched[k][0][0]); return; } }
})();

// ---------- quick bar: shows once the hero buttons scroll away ----------
(() => { const bar = q('.bar'), cta = q('.hero .actions'); if (!bar || !cta) return;
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => bar.classList.toggle('show', !e.isIntersecting && e.boundingClientRect.top < 0)).observe(cta);
  else bar.classList.add('show'); })();

// ---------- scroll reveal (PREVIEW-STANDARD.md) ----------
(() => {
  const els = qa('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-visible')); return; }
  const n = new Map(); els.forEach(e => { const p = e.parentElement, i = n.get(p) || 0; e.style.setProperty('--d', i * .08 + 's'); n.set(p, i + 1); });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { threshold: .01, rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
  setTimeout(() => els.forEach(e => { if (e.getBoundingClientRect().top < innerHeight) e.classList.add('is-visible'); }), 1500);
})();
})();
