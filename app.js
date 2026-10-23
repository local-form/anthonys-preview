const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const toggle=q('.menu-toggle'), mobileNav=q('#mobile-nav');
function setNavInert(value){qa('main,.site-footer,.mobile-actions').forEach(el=>el.inert=value);}
function closeNav(){if(!toggle)return;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');mobileNav.hidden=true;document.documentElement.classList.remove('nav-open');setNavInert(false);}
if(toggle){toggle.addEventListener('click',()=>{const opened=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!opened));toggle.setAttribute('aria-label',opened?'Open navigation':'Close navigation');mobileNav.hidden=opened;document.documentElement.classList.toggle('nav-open',!opened);setNavInert(!opened);});qa('a',mobileNav).forEach(a=>a.addEventListener('click',closeNav));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!mobileNav.hidden){closeNav();toggle.focus();}if(e.key==='Tab'&&!mobileNav.hidden){const links=qa('a',mobileNav),last=links.at(-1),logo=q('.site-header .wordmark');if(!e.shiftKey&&document.activeElement===last){e.preventDefault();logo.focus();}if(e.shiftKey&&document.activeElement===logo){e.preventDefault();last.focus();}}});matchMedia('(min-width:761px)').addEventListener('change',e=>{if(e.matches)closeNav();});document.addEventListener('click',e=>{if(!e.target.closest('.site-header')&&!mobileNav.hidden)closeNav();});}
qa('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
if('IntersectionObserver'in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.12});qa('.reveal').forEach(el=>observer.observe(el));}
const previews={brunch:[['Apple Fritter French Toast','Egg-dipped, griddled, and dusted with powdered sugar.','$16'],['Cookie Butter Waffles','Bananas, whipped cream, and crumbled Biscoff cookies.','$16'],['The Brunch Burger','Short rib & brisket, bacon, cheddar, and an over-easy egg.','$22']],lunch:[['Chicken Milanese Sandwich','Chicken cutlet, arugula, cherry peppers, and shaved pecorino.','$16'],['Hot Honey Chicken Sandwich','Crispy chicken, house slaw, pickles, and hot honey.','$15'],['Anthony’s BLT','Bacon, arugula, goat cheese, avocado, and tomato.','$14']],dinner:[['Chicken Parm Vodka','Chicken parmigiana, house vodka sauce, and fresh mozzarella.','$28'],['Cavatelli with Sausage & Broccoli Rabe','Hot & sweet Italian sausage, garlic, and pecorino.','$20'],['Fettucini Vodka & Braised Short Rib','Braised beef short rib, house vodka sauce, and ricotta.','$34']]};
function setPreview(button){const key=button.dataset.preview;qa('[data-preview]').forEach(el=>{el.setAttribute('aria-selected',String(el===button));el.tabIndex=el===button?0:-1;});const panel=q('#meal-preview');panel.setAttribute('aria-labelledby',button.id);panel.replaceChildren(...previews[key].map(([name,description,price])=>{const item=document.createElement('div');item.className='preview-dish';const content=document.createElement('div'),heading=document.createElement('h3'),p=document.createElement('p'),amount=document.createElement('span');heading.textContent=name;p.textContent=description;amount.textContent=price;content.append(heading,p);item.append(content,amount);return item;}));const link=q('#full-menu-link');link.href=`menu.html?menu=${key}`;link.innerHTML=`See the full ${key} menu →`;}
qa('[data-preview]').forEach(button=>{button.addEventListener('click',()=>setPreview(button));button.addEventListener('keydown',e=>{const buttons=qa('[data-preview]'),i=buttons.indexOf(button);let next;if(e.key==='ArrowRight')next=(i+1)%buttons.length;if(e.key==='ArrowLeft')next=(i+buttons.length-1)%buttons.length;if(e.key==='Home')next=0;if(e.key==='End')next=buttons.length-1;if(next!==undefined){e.preventDefault();buttons[next].focus();setPreview(buttons[next]);}});});
if(q('.menu-page')){
  const categories=qa('[data-category]'),panels=qa('[data-panel]'),search=q('#menu-search'),clear=q('#clear-search'),status=q('#result-count'),empty=q('#empty-result');
  let category='brunch';
  function applySearch(){const term=search.value.trim().toLowerCase();let visible=0;const panel=q(`[data-panel="${category}"]`);qa('.dish',panel).forEach(dish=>{const show=!term||dish.dataset.search.includes(term);dish.hidden=!show;if(show)visible++;});qa('.menu-group',panel).forEach(group=>group.hidden=!qa('.dish',group).some(d=>!d.hidden));clear.hidden=!term;status.textContent=`${visible} ${visible===1?'dish':'dishes'}${term?' matching “'+search.value.trim()+'”':''}`;empty.hidden=visible>0;}
  function selectCategory(key,updateURL=true){if(!panels.some(panel=>panel.dataset.panel===key))key='brunch';category=key;panels.forEach(panel=>{panel.hidden=panel.dataset.panel!==key;panel.classList.toggle('active',!panel.hidden);});categories.forEach(a=>{if(a.dataset.category===key)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});search.value='';search.placeholder=key==='cheesecake'?'Search flavors or ingredients…':'Search dishes or ingredients…';q('#menu-heading').textContent={brunch:'Weekend brunch.',lunch:'Let’s do lunch.',dinner:'Dinner at Anthony’s.',cheesecake:'Find your cheesecake.',dessert:'Something sweet.',catering:'Made for gathering.'}[key];document.title=`${{brunch:'Brunch',lunch:'Lunch',dinner:'Dinner',cheesecake:'Cheesecakes',dessert:'Desserts',catering:'Catering'}[key]} Menu · Anthony’s Cheesecake`;if(updateURL){const url=new URL(location.href);url.searchParams.set('menu',key);history.pushState({menu:key},'',url);}applySearch();}
  categories.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();selectCategory(a.dataset.category);}));search.addEventListener('input',applySearch);clear.addEventListener('click',()=>{search.value='';applySearch();search.focus();});q('#reset-search').addEventListener('click',()=>{search.value='';applySearch();search.focus();});addEventListener('popstate',()=>selectCategory(new URLSearchParams(location.search).get('menu')||'brunch',false));selectCategory(new URLSearchParams(location.search).get('menu')||'brunch',false);qa('.print-button').forEach(button=>button.addEventListener('click',()=>window.print()));
  const dialog=q('#cake-dialog'),size=q('#cake-size');let currentCake;
  function updateCake(){const index=Number(size.value),prices=JSON.parse(currentCake.dataset.prices);const names=['Large','Medium','Small','Slice'];q('#selected-size').textContent=names[index];q('#selected-price').textContent=prices[index]||'Call for price';q('#cake-servings').textContent=['Serves 10–12. Please allow 48 hours.','Serves 8. Please allow 48 hours.','Serves 6. Please allow 48 hours.','Ask about today’s available slices.'][index];}
  qa('.dish-detail').forEach(button=>button.addEventListener('click',()=>{currentCake=button.closest('.dish');q('#cake-name').textContent=q('h3',currentCake).textContent;q('#cake-description').textContent=q('.dish-description',currentCake).textContent;size.value='2';updateCake();dialog.showModal();}));size.addEventListener('change',updateCake);q('#close-cake').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dialog.close();}});
}

(function(){const st=document.getElementById('open-status'),txt=document.getElementById('open-text');
const sched={0:[[600,900]],4:[[660,960],[1020,1260]],5:[[660,960],[1020,1260]],6:[[630,960],[1020,1260]]};
const dn=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const fmt=m=>{const h=Math.floor(m/60),mm=m%60;return (h%12||12)+(mm?':'+String(mm).padStart(2,'0'):'')+(h<12?' am':' pm');};
const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'numeric',minute:'numeric',hourCycle:'h23'}).formatToParts(new Date()),g=t=>p.find(x=>x.type===t).value;
const day=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(g('weekday')),now=+g('hour')*60+ +g('minute');
qa('[data-hours] [data-days]').forEach(r=>{if(r.dataset.days.split(',').map(Number).includes(day))r.classList.add('is-today');});
if(!st)return;
const today=sched[day]||[];const open=today.find(([a,b])=>now>=a&&now<b);
if(open){st.classList.add('is-open');txt.textContent='Open now · until '+fmt(open[1]);return;}
st.classList.add('is-closed');const later=today.find(([a])=>a>now);
if(later){txt.textContent='Closed now · opens '+fmt(later[0]);return;}
for(let i=1;i<=7;i++){const d=(day+i)%7;if(sched[d]){txt.textContent='Closed now · opens '+(i===1?'tomorrow':dn[d])+' '+fmt(sched[d][0][0]);return;}}})();

if(matchMedia("(prefers-reduced-motion: reduce)").matches)qa("video").forEach(v=>{v.removeAttribute("autoplay");v.pause();});

(function(){const bar=q('.mobile-actions');if(!bar)return;document.documentElement.classList.add('has-bar');
const cta=q('.hero .action-row');
if(cta&&'IntersectionObserver'in window){new IntersectionObserver(([e])=>bar.classList.toggle('is-shown',!e.isIntersecting&&e.boundingClientRect.top<0),{threshold:0}).observe(cta);}
else{const f=()=>bar.classList.toggle('is-shown',scrollY>160);addEventListener('scroll',f,{passive:true});f();}})();

// reveal-failsafe: never leave content hidden if the scroll observer doesn't fire
setTimeout(()=>document.querySelectorAll('.reveal:not(.is-visible)').forEach(el=>{const r=el.getBoundingClientRect();if(r.top<innerHeight*1.5)el.classList.add('is-visible');}),1500);
addEventListener('scroll',()=>document.querySelectorAll('.reveal:not(.is-visible)').forEach(el=>{if(el.getBoundingClientRect().top<innerHeight)el.classList.add('is-visible');}),{passive:true});

// standard scroll reveal (PREVIEW-STANDARD.md)
(() => {
  const els = [...document.querySelectorAll('[data-reveal]')];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-visible')); return; }
  const n = new Map();
  els.forEach(e => { const p = e.parentElement, i = n.get(p) || 0; e.style.setProperty('--d', i * .08 + 's'); n.set(p, i + 1); });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { threshold: .01, rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
  setTimeout(() => els.forEach(e => { if (e.getBoundingClientRect().top < innerHeight) e.classList.add('is-visible'); }), 1500);
})();

// Local Form request form (shared across previews): reads the request back and sends nothing.
document.querySelectorAll('form[data-lf-request]').forEach(form => {
  const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  form.querySelectorAll('input[type=date]').forEach(d => d.min = today.toISOString().slice(0, 10));
  // Whole cheesecakes need 48 hours' notice: push the earliest date out two days when one is part of the order.
  const dayInput = form.querySelector('input[type=date]');
  if (dayInput && form.querySelector('input[name=kind]')) {
    const soon = new Date(today); soon.setDate(soon.getDate() + 2);
    form.addEventListener('change', () => { const k = form.querySelector('input[name=kind]:checked'); dayInput.min = (k && (k.value === 'Whole cheesecake' || k.value === 'Both') ? soon : today).toISOString().slice(0, 10); });
  }
  form.addEventListener('submit', e => {
    e.preventDefault();
    const parts = [...form.querySelectorAll('[data-sum]')].map(el => {
      if (el.type === 'radio') return el.checked ? el.value : '';
      let v = el.value.trim(); if (!v) return '';
      if (el.type === 'date') v = new Date(v + 'T00:00').toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'});
      return el.dataset.sum.replace('%', v);
    }).filter(Boolean);
    const name = (form.elements.name?.value || '').trim(), done = form.querySelector('.lf-done'), b = document.createElement('b'), p = document.createElement('span');
    b.textContent = `Your request: ${parts.join(' · ')}${name ? ` (for ${name})` : ''}`;
    p.textContent = form.dataset.lfConfirm;
    done.replaceChildren(b, p); done.hidden = false; done.scrollIntoView({block: 'nearest', behavior: 'smooth'});
  });
});
