
(function(){
  const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
  const normalize=s=>(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  const data={
    specialties:['Cardiologia','Pediatria','Ginecologia e Obstetrícia','Ortopedia','Clínica Geral','Dermatologia','Neurologia','Psiquiatria','Endocrinologia','Oftalmologia','Cirurgia Geral','Anestesiologia'],
    hospitals:[
      ['Hospital Esperança Recife','Recife','UTI Adulto',8,78,'ok'],
      ['Hospital Memorial Guararapes','Jaboatão dos Guararapes','Clínica médica',14,62,'ok'],
      ['Hospital Regional do Agreste','Caruaru','UTI Adulto',3,91,'warn'],
      ['Hospital São Marcos','Recife','UTI Pediátrica',2,94,'danger'],
      ['Hospital Dom Hélder','Jaboatão dos Guararapes','Emergência',11,71,'ok'],
      ['Hospital Santa Joana','Recife','Obstetrícia',6,83,'warn']
    ]
  };

  function setupHeader(){
    const h=$('.site-header'),toggle=$('.nav-toggle'),drawer=$('.drawer'),scrim=$('.scrim');
    if(!h)return;
    window.addEventListener('scroll',()=>h.classList.toggle('scrolled',scrollY>8),{passive:true});
    const close=()=>{drawer?.classList.remove('open');scrim?.classList.remove('show');document.body.classList.remove('no-scroll')};
    toggle?.addEventListener('click',()=>{drawer?.classList.toggle('open');scrim?.classList.toggle('show');document.body.classList.toggle('no-scroll',drawer?.classList.contains('open'))});
    scrim?.addEventListener('click',close);
    $$('.drawer a').forEach(a=>a.addEventListener('click',close));
  }

  function activeNav(){
    const p=location.pathname.split('/').pop()||'index.html';
    const aliases={'leitos.html':'capacidade.html','profissionais.html':'capacidade.html'};
    const activePage=aliases[p]||p;
    $$('.main-nav a,.drawer nav a').forEach(a=>{
      const href=(a.getAttribute('href')||'').split('/').pop().split('?')[0];
      const active=href===activePage;
      a.classList.toggle('active',active);
      if(active)a.setAttribute('aria-current','page');
      else a.removeAttribute('aria-current');
    });
  }

  function setupSearch(){
    const input=$('[data-search]'),box=$('.suggestions'); if(!input||!box)return;
    let activeIndex=-1;
    input.setAttribute('aria-expanded','false');
    input.setAttribute('aria-controls','search-suggestions');
    box.id='search-suggestions';
    box.setAttribute('aria-live','polite');
    const render=q=>{
      const n=normalize(q);
      const arr=data.specialties.filter(x=>normalize(x).includes(n)).slice(0,6);
      box.innerHTML=arr.map((x,index)=>`<div class="suggestion" id="suggestion-${index}" role="option" tabindex="0" data-value="${x}"><span>${x}</span><small>Especialidade</small></div>`).join('');
      activeIndex=-1;
      const open=!!arr.length&&!!q;
      box.classList.toggle('open',open);
      input.setAttribute('aria-expanded',String(open));
    };
    const choose=s=>{if(!s)return;input.value=s.dataset.value;box.classList.remove('open');input.setAttribute('aria-expanded','false');activeIndex=-1};
    const updateActive=()=>{$$('.suggestion',box).forEach((s,index)=>s.classList.toggle('active',index===activeIndex));input.setAttribute('aria-activedescendant',activeIndex>=0?`suggestion-${activeIndex}`:'')};
    input.addEventListener('input',()=>render(input.value));
    input.addEventListener('keydown',e=>{
      const suggestions=$$('.suggestion',box);if(!suggestions.length||!box.classList.contains('open'))return;
      if(e.key==='ArrowDown'){e.preventDefault();activeIndex=(activeIndex+1)%suggestions.length;updateActive()}
      if(e.key==='ArrowUp'){e.preventDefault();activeIndex=(activeIndex-1+suggestions.length)%suggestions.length;updateActive()}
      if(e.key==='Enter'&&activeIndex>=0){e.preventDefault();choose(suggestions[activeIndex])}
      if(e.key==='Escape'){box.classList.remove('open');input.setAttribute('aria-expanded','false');activeIndex=-1}
    });
    box.addEventListener('click',e=>choose(e.target.closest('.suggestion')));
    document.addEventListener('click',e=>{if(!e.target.closest('.searchbox')){box.classList.remove('open');input.setAttribute('aria-expanded','false');activeIndex=-1}});
    input.closest('form')?.addEventListener('submit',e=>{e.preventDefault();location.href='pages/capacidade.html?especialidade='+encodeURIComponent(input.value||'')});
  }

  function counters(){
    $$('[data-count]').forEach(el=>{
      const target=+el.dataset.count; let n=0; const step=Math.max(1,Math.ceil(target/35));
      const run=()=>{n=Math.min(target,n+step);el.textContent=n.toLocaleString('pt-BR')+(el.dataset.suffix||'');if(n<target)requestAnimationFrame(run)};
      if(!('IntersectionObserver' in window)){run();return}
      const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){run();io.disconnect()}},{threshold:.4});io.observe(el);
    });
  }

  function reveal(){
    const items=$$('.reveal'); if(!items.length)return;
    if(!('IntersectionObserver' in window)){items.forEach(x=>x.classList.add('visible'));return}
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.1});
    items.forEach(x=>io.observe(x));
  }

  function toast(msg){
    let t=$('.toast'); if(!t){t=document.createElement('div');t.className='toast';document.body.append(t)}
    t.textContent=msg;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),2600);
  }

  function setupActions(){
    $$('.js-action').forEach(b=>b.addEventListener('click',()=>toast(b.dataset.message||'Ação realizada na demonstração.')));
  }

  function setupFilters(){
    const input=$('[data-filter-input]'),items=$$('[data-item]');if(!input||!items.length)return;
    const selects=$$('[data-filter-select]');
    const run=()=>{
      const q=normalize(input.value);let visible=0;
      items.forEach(item=>{
        const text=normalize(item.textContent);
        const okText=!q||text.includes(q);
        const okSelect=selects.every(s=>!s.value||item.dataset[s.dataset.filter]===s.value);
        const show=okText&&okSelect;item.style.display=show?'':'none';if(show)visible++;
      });
      const count=$('[data-result-count]');if(count)count.textContent=`${visible} resultado${visible===1?'':'s'}`;
    };
    input.addEventListener('input',run);selects.forEach(s=>s.addEventListener('change',run));run();
  }

  function setupContact(){
    const form=$('#contact-form'),type=$('#type'),dynamic=$('#dynamic-fields');if(!form||!type||!dynamic)return;
    const fields={
      hospital:`<div class="form-group"><label for="cnpj">CNPJ</label><input id="cnpj" placeholder="00.000.000/0000-00"></div><div class="form-group"><label for="beds">Quantidade de leitos</label><input id="beds" type="number" min="0" placeholder="Ex.: 120"></div><div class="form-group full"><label for="specialties">Especialidades</label><input id="specialties" placeholder="Cardiologia, UTI, pediatria..."></div>`,
      professional:`<div class="form-group"><label for="crm">Registro profissional</label><input id="crm" placeholder="CRM, COREN, CRO..."></div><div class="form-group"><label for="specialty">Especialidade</label><input id="specialty" placeholder="Cardiologia"></div><div class="form-group full"><label for="availability">Disponibilidade</label><select id="availability"><option>Plantão</option><option>Horário comercial</option><option>Sobreaviso</option></select></div>`,
      partner:`<div class="form-group full"><label for="organization">Organização</label><input id="organization" placeholder="Nome da instituição ou empresa"></div>`,
      other:`<div class="form-group full"><label for="subject">Assunto</label><input id="subject" placeholder="Como podemos ajudar?"></div>`
    };
    const update=()=>dynamic.innerHTML=fields[type.value]||'';
    type.addEventListener('change',update);
    form.addEventListener('submit',e=>{e.preventDefault();toast('Cadastro enviado para análise. Demonstração sem armazenamento.');form.reset();dynamic.innerHTML=''});
    const params=new URLSearchParams(location.search);if(params.get('tipo')){const map={hospital:'hospital',professional:'professional',parceiro:'partner',cadastro:'hospital'};type.value=map[params.get('tipo')]||'';update()}
  }

  function setupDashboardMenu(){
    const toggle=$('.mobile-sidebar-toggle'),side=$('.sidebar'),scrim=$('.dash-scrim');
    if(!toggle||!side)return;
    const close=()=>{side.classList.remove('open');scrim?.classList.remove('show');document.body.classList.remove('no-scroll')};
    toggle.addEventListener('click',()=>{side.classList.toggle('open');scrim?.classList.toggle('show');document.body.classList.toggle('no-scroll',side.classList.contains('open'))});
    scrim?.addEventListener('click',close);
    $$('.sidebar-nav a').forEach(a=>a.addEventListener('click',close));
  }

  function setup(){
    setupHeader();activeNav();setupSearch();counters();reveal();setupActions();setupFilters();setupContact();setupDashboardMenu();
  }
  document.addEventListener('DOMContentLoaded',setup);
})();
