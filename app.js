const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KES=n=>'KES '+Math.round(n).toLocaleString('en-KE');
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const S={talents:[],venues:[],products:[],cart:store.get('cart',[]),orders:store.get('orders',[]),q:'',cat:'All',feat:[]};
const CATS=['All','Music','Fine Arts','Public Speaking','Crafts','Culinary'];
const FEATS=['Wheelchair Ramp Access','Braille Signage','Sign Language Trained Staff','Accessible Stages'];
const SLOT={Morning:1,Afternoon:1.1,Evening:1.25};
let size=store.get('size',100),hc=store.get('hc',false);

/* ---------- accessibility ---------- */
function applyA11y(){document.documentElement.style.fontSize=size+'%';document.documentElement.classList.toggle('hc',hc);$('#hc').setAttribute('aria-pressed',hc);store.set('size',size);store.set('hc',hc)}
const speak=on=>{speechSynthesis.cancel();$('#spk').setAttribute('aria-pressed',on);if(on){const u=new SpeechSynthesisUtterance($('#app').innerText);u.onend=()=>$('#spk').setAttribute('aria-pressed',false);speechSynthesis.speak(u)}};

/* ---------- boot + routing ---------- */
(async()=>{
  [S.talents,S.venues,S.products]=await Promise.all(['talents','venues','products'].map(n=>fetch(`data/${n}.json`).then(r=>r.json())));
  applyA11y();route();
})();
addEventListener('hashchange',route);
function route(){
  const v=location.hash.slice(1)||'talent', V={talent:vTalent,venues:vVenues,shop:vShop,bookings:vBookings,join:vJoin};
  speechSynthesis.cancel();
  $$('nav a').forEach(a=>a.getAttribute('href')=='#'+v?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));
  (V[v]||vTalent)();$('#cartN').textContent=S.cart.length;$('#app').focus();
}
const img=(src,name,cls='av')=>`<img class="${cls}" src="${esc(src)}" alt="Photo of ${esc(name)}" data-i="${esc(name[0])}" onerror="this.outerHTML='<div class=&quot;av ph&quot; aria-hidden=&quot;true&quot;>'+this.dataset.i+'</div>'">`;

/* ---------- talent ---------- */
function vTalent(){
  $('#app').innerHTML=`<h1 class="h1">Book talent for your event</h1><p class="muted mb-4">Search by name or skill, then book for a partner venue.</p>
  <div class="flex flex-wrap gap-3 mb-5"><label class="grow">Search<input id="q" class="inp" type="search" placeholder="Name or skill" value="${esc(S.q)}"></label></div>
  <div class="flex flex-wrap gap-2 mb-5" role="group" aria-label="Filter by category">${CATS.map(c=>`<button class="chip" data-cat="${c}" aria-pressed="${S.cat==c}">${c}</button>`).join('')}</div>
  <div id="list" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"></div>`;
  $('#q').oninput=e=>{S.q=e.target.value.slice(0,60);tList()};tList();
}
function tList(){
  const q=S.q.toLowerCase().trim();
  const l=S.talents.filter(t=>(S.cat=='All'||t.category==S.cat)&&[t.name,t.title,t.category].join(' ').toLowerCase().includes(q));
  $('#list').innerHTML=l.map(t=>`<article class="card grid gap-2 content-start">
    <div class="flex gap-3 items-center">${img(t.img,t.name)}<div><h2 class="h2">${esc(t.name)} <span class="muted" style="font-size:.9rem;font-weight:400">and others</span></h2><p>${esc(t.title)}</p></div></div>
    <p><span class="tag">${esc(t.disability)}</span> <span class="tag">${esc(t.category)}</span></p>
    <p><span aria-label="Rated ${t.rating} out of 5">★ ${t.rating}</span> · ${esc(t.location)} · <b>${KES(t.fee)}</b></p>
    <p>${esc(t.bio)}</p><p class="muted"><b>Stage needs:</b> ${esc(t.needs)}</p>
    <button class="btn mt-2" data-act="book" data-id="${t.id}">Book ${esc(t.name.split(' ')[0])}</button></article>`).join('')||'<p>No talent matches. Clear the search or choose All.</p>';
}

/* ---------- venues ---------- */
function vVenues(){
  $('#app').innerHTML=`<h1 class="h1">Accessible venues</h1><p class="muted mb-4">Show only venues with every feature you tick.</p>
  <fieldset class="mb-5"><legend class="font-bold">Accessibility features</legend><div class="flex flex-wrap gap-x-6">${FEATS.map(f=>`<label class="row"><input type="checkbox" value="${f}" ${S.feat.includes(f)?'checked':''}>${f}</label>`).join('')}</div></fieldset>
  <div id="vl" class="grid gap-5 md:grid-cols-2"></div>`;
  $$('fieldset input').forEach(i=>i.onchange=()=>{S.feat=$$('fieldset input:checked').map(x=>x.value);vList()});vList();
}
function vList(){
  const l=S.venues.filter(v=>S.feat.every(f=>v.features.includes(f)));
  $('#vl').innerHTML=l.map(v=>`<article class="card grid gap-2"><h2 class="h2">${esc(v.name)}</h2><p class="muted">${esc(v.location)}</p><p>${esc(v.description)}</p>
  <p class="ok">Verified accessibility</p><ul class="flex flex-wrap gap-2">${v.features.map(f=>`<li class="tag">${f}</li>`).join('')}</ul></article>`).join('')||'<p>No venue has all of those features. Untick one to see more.</p>';
}

/* ---------- marketplace + cart ---------- */
function vShop(){
  $('#app').innerHTML=`<h1 class="h1">Hotel marketplace</h1><p class="muted mb-4">Crafts, food and event tickets from our artisans, collected at partner hotels.</p>
  <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">${S.products.map(p=>`<article class="card grid gap-2 content-start">${img(p.img,p.title,'av').replace('class="av"','class="w-full h-40 object-cover rounded-lg"').replace('av ph','w-full h-40 ph rounded-lg')}
  <h2 class="h2">${esc(p.title)}</h2><p>By ${esc(p.artisan)} · <span class="tag">${esc(p.type)}</span></p><p class="muted">Collect at ${esc(p.hotel)}</p><p><b>${KES(p.price)}</b></p>
  <button class="btn" data-act="add" data-id="${p.id}">Add to cart</button></article>`).join('')}</div>`;
}
const total=()=>S.cart.reduce((s,id)=>s+S.products.find(p=>p.id==id).price,0);
function saveCart(){store.set('cart',S.cart);$('#cartN').textContent=S.cart.length}
function cartView(){
  open(`<h2 class="h2" id="dt">Your cart</h2>${S.cart.length?`<ul class="grid gap-2 my-4">${S.cart.map((id,i)=>{const p=S.products.find(x=>x.id==id);return `<li class="card flex items-center gap-3"><span class="grow">${esc(p.title)}<br><b>${KES(p.price)}</b></span><button class="btn alt" data-act="rm" data-id="${i}" aria-label="Remove ${esc(p.title)}">Remove</button></li>`}).join('')}</ul>
  <p class="h2 mb-4">Total: ${KES(total())}</p><div class="flex gap-2"><button class="btn" data-act="checkout">Pay with M-Pesa</button><button class="btn alt" data-act="close">Keep shopping</button></div>`:`<p class="my-4">Your cart is empty. Browse the marketplace to add items.</p><button class="btn" data-act="close">Close</button>`}`);
}

/* ---------- booking ---------- */
function bookView(t){
  const today=new Date().toISOString().slice(0,10);
  open(`<h2 class="h2" id="dt">Book ${esc(t.name)}</h2><form id="bf" class="grid gap-3 my-3" novalidate>
  <label>Partner venue<select name="venue" class="inp">${S.venues.map(v=>`<option>${esc(v.name)}, ${esc(v.location)}</option>`).join('')}</select></label>
  <label>Event date<input name="date" type="date" min="${today}" class="inp"></label>
  <label>Time slot<select name="slot" class="inp">${Object.keys(SLOT).map(s=>`<option>${s}</option>`).join('')}</select></label>
  <label>Accessibility and stage setup notes<textarea name="notes" rows="3" maxlength="300" class="inp" placeholder="${esc(t.needs)}"></textarea></label>
  <p id="err" class="font-bold" role="alert"></p><p class="muted">Base rate ${KES(t.fee)}. Afternoon +10%, evening +25%.</p><p class="h2" id="tot"></p>
  <div class="flex gap-2"><button class="btn">Continue to payment</button><button type="button" class="btn alt" data-act="close">Cancel</button></div></form>`);
  const f=$('#bf'),price=()=>t.fee*SLOT[f.slot.value],up=()=>$('#tot').textContent='Total: '+KES(price());f.slot.onchange=up;up();
  f.onsubmit=e=>{e.preventDefault();const d=f.date.value;
    if(!d||d<today){$('#err').textContent='Choose an event date that is today or later.';f.date.focus();return}
    pay({total:price(),title:`${t.name} at ${f.venue.value}, ${d}, ${f.slot.value}`,type:'Talent booking',event:'Event confirmed'})};
}

/* ---------- M-Pesa simulation ---------- */
function pay(o){
  open(`<h2 class="h2" id="dt">Pay with M-Pesa</h2><p class="my-2">${esc(o.title)}</p><p class="h2">Total: ${KES(o.total)}</p>
  <form id="pf" class="grid gap-3 mt-3" novalidate><label>M-Pesa phone number<input name="ph" class="inp" inputmode="tel" autocomplete="tel" placeholder="0712 345 678"></label>
  <p id="err" class="font-bold" role="alert"></p><button class="btn">Send M-Pesa prompt</button></form>`);
  $('#pf').onsubmit=e=>{e.preventDefault();const m=$('#pf').ph.value.replace(/[\s-]/g,'').match(/^(?:\+?254|0)([17]\d{8})$/);
    if(!m){$('#err').textContent='Enter a valid Safaricom number, like 0712345678.';return}
    const ph='254'+m[1];
    open(`<h2 class="h2" id="dt">Check your phone</h2><p class="my-3"><span class="spin inline-block">◐</span> Sending an M-Pesa prompt to +${ph}…</p>`);
    setTimeout(()=>{open(`<h2 class="h2" id="dt">Enter M-Pesa PIN</h2><p class="my-2">Simulated phone prompt. Pay ${KES(o.total)} to Talanta Hub. Any 4 digits work.</p>
      <form id="kf" class="grid gap-3"><label>PIN<input name="pin" type="password" inputmode="numeric" maxlength="4" class="inp" autocomplete="off"></label><p id="err" class="font-bold" role="alert"></p>
      <div class="flex gap-2"><button class="btn">Confirm</button><button type="button" class="btn alt" id="no">Cancel</button></div></form>`);
      $('#no').onclick=()=>done('Cancelled');
      $('#kf').onsubmit=e=>{e.preventDefault();/^\d{4}$/.test($('#kf').pin.value)?done('Paid'):$('#err').textContent='PIN must be 4 digits.'};
    },2200);
    function done(status){
      const r={id:Date.now(),type:o.type,title:o.title,total:o.total,status,event:status=='Paid'?o.event:'Not confirmed',
        receipt:status=='Paid'?'TH'+Math.random().toString(36).slice(2,10).toUpperCase():'—',time:new Date().toLocaleString('en-KE'),phone:'•••••••'+ph.slice(-3)};
      S.orders.unshift(r);store.set('orders',S.orders);
      if(status=='Paid'&&o.type=='Marketplace order'){S.cart=[];saveCart()}
      open(`<h2 class="h2" id="dt">${status=='Paid'?'Payment received':'Payment cancelled'}</h2><dl class="card my-3 grid gap-1"><div>Receipt: <b>${r.receipt}</b></div><div>Time: ${r.time}</div><div>Amount: ${KES(r.total)}</div><div>Status: <b>${status}</b></div><div>${esc(r.title)}</div></dl>
      <div class="flex gap-2"><a class="btn" style="display:inline-flex;align-items:center;text-decoration:none" href="#bookings" data-act="close">View my bookings</a><button class="btn alt" data-act="close">Close</button></div>`);
    }};
}

/* ---------- dashboard ---------- */
function vBookings(){
  $('#app').innerHTML=`<h1 class="h1">My bookings</h1><p class="muted mb-4">Talent bookings and marketplace purchases in one place.</p>
  ${S.orders.length?`<ul class="grid gap-4">${S.orders.map(r=>`<li class="card grid gap-1"><b>${esc(r.type)}</b><span>${esc(r.title)}</span><span>${KES(r.total)} · ${esc(r.time)}</span>
  <span>Payment: <b class="${r.status=='Paid'?'ok':''}">${r.status}</b> · ${esc(r.event)} · Receipt ${esc(r.receipt)}</span></li>`).join('')}</ul>`:'<p>No bookings yet. <a href="#talent" style="text-decoration:underline">Find talent to book</a>.</p>'}`;
}

/* ---------- registration ---------- */
function vJoin(){
  $('#app').innerHTML=`<h1 class="h1">Join Talanta Hub</h1><form id="rf" class="card grid gap-3 max-w-xl mt-4" novalidate>
  <fieldset><legend class="font-bold">I am joining as</legend><label class="row"><input type="radio" name="role" value="Talent" checked>Talent</label><label class="row"><input type="radio" name="role" value="Partner Hotel">Partner hotel</label></fieldset>
  <label>Full name or hotel name<input name="name" class="inp" maxlength="80" autocomplete="name"></label>
  <label>Email<input name="email" type="email" class="inp" autocomplete="email"></label>
  <label>Phone<input name="phone" class="inp" inputmode="tel" autocomplete="tel"></label>
  <div id="tf" class="grid gap-3"><label>Skill category<select name="cat" class="inp">${CATS.slice(1).map(c=>`<option>${c}</option>`).join('')}</select></label>
  <label>Your stage or accessibility needs<textarea name="needs" rows="3" maxlength="300" class="inp"></textarea></label></div>
  <p id="err" class="font-bold" role="alert"></p><button class="btn">Create account</button></form>`;
  const f=$('#rf');$$('[name=role]').forEach(r=>r.onchange=()=>$('#tf').hidden=f.role.value!='Talent');
  f.onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(f));let m='';
    if(v.name.trim().length<2)m='Enter a name.';else if(!/^\S+@\S+\.\S+$/.test(v.email))m='Enter a valid email address.';else if(!/^(?:\+?254|0)[17]\d{8}$/.test(v.phone.replace(/[\s-]/g,'')))m='Enter a valid Kenyan phone number.';
    $('#err').textContent=m;if(m)return;
    store.set('registrations',[...store.get('registrations',[]),{role:v.role,name:v.name.trim(),email:v.email,...(v.role=='Talent'?{cat:v.cat,needs:v.needs}:{})}]);
    f.outerHTML=`<p class="card ok" role="status">Welcome, ${esc(v.name.trim())}. Your ${esc(v.role.toLowerCase())} account is created.</p>`};
}

/* ---------- dialog + events ---------- */
const dlg=$('#dlg');
function open(h){dlg.innerHTML=h;dlg.open||dlg.showModal();dlg.querySelector('input,select,button')?.focus()}
const A={
  smaller:()=>{size=Math.max(80,size-10);applyA11y()},bigger:()=>{size=Math.min(160,size+10);applyA11y()},
  hc:()=>{hc=!hc;applyA11y()},speak:()=>speak($('#spk').getAttribute('aria-pressed')!='true'),
  book:id=>bookView(S.talents.find(t=>t.id==id)),add:id=>{S.cart.push(id);saveCart();open(`<h2 class="h2" id="dt">Added to cart</h2><div class="flex gap-2 mt-4"><button class="btn" data-act="cart">View cart</button><button class="btn alt" data-act="close">Keep shopping</button></div>`)},
  rm:i=>{S.cart.splice(i,1);saveCart();cartView()},cart:cartView,close:()=>{dlg.close();route()},
  checkout:()=>pay({total:total(),title:`${S.cart.length} marketplace item(s)`,type:'Marketplace order',event:'Order placed'})
};
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act],[data-cat]');if(!b)return;
  if(b.dataset.cat){S.cat=b.dataset.cat;$$('[data-cat]').forEach(x=>x.setAttribute('aria-pressed',x==b));return tList()}
  A[b.dataset.act]?.(b.dataset.id);
});
