(function(){
  var nav=document.getElementById('nav'),
      toggle=nav.querySelector('.nav__toggle'),
      hero=document.getElementById('home'),
      links=[].slice.call(nav.querySelectorAll('.nav__pill a[href^="#"]:not(.only-mobile)')),
      ids=['home','about','featured','contact'],
      sections=ids.map(function(id){return document.getElementById(id)}),
      ticking=false;

  function update(){
    ticking=false;
    var navH=nav.offsetHeight;
    // Solid backdrop once the nav has left the photo hero
    nav.classList.toggle('is-solid', hero.getBoundingClientRect().bottom <= navH + 2);
    // Scroll-spy: highlight the section currently under the middle of the viewport
    var mid=window.innerHeight*0.45, current=0;
    sections.forEach(function(s,i){ if(s.getBoundingClientRect().top <= mid) current=i; });
    links.forEach(function(a,i){
      var on=(a.getAttribute('href')==='#'+ids[current]);
      a.classList.toggle('is-active',on);
      if(on) a.setAttribute('aria-current','true'); else a.removeAttribute('aria-current');
    });
  }
  function onScroll(){ if(!ticking){ ticking=true; requestAnimationFrame(update); } }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll);
  update();

  function setOpen(open){
    nav.classList.toggle('is-open',open);
    toggle.setAttribute('aria-expanded',open);
    toggle.setAttribute('aria-label',open?'Close menu':'Open menu');
  }
  toggle.addEventListener('click',function(){ setOpen(!nav.classList.contains('is-open')); });
  nav.querySelectorAll('.nav__pill a').forEach(function(a){ a.addEventListener('click',function(){ setOpen(false); }); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') setOpen(false); });

  // Smooth scroll-in animation for each page section; no hover interaction required.
  var revealItems=[].slice.call(document.querySelectorAll('.stage, .foot'));
  if('IntersectionObserver' in window){
    var revealObserver=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    revealItems.forEach(function(item){ revealObserver.observe(item); });
  }else{
    revealItems.forEach(function(item){ item.classList.add('is-visible'); });
  }
})();
/* Menu search: hides cards that don't match. Uses its own class, so it works together with the category filters. */
(function(){
  var input=document.querySelector('.menu-find input');
  if(!input) return;
  var cards=document.querySelectorAll('.menu-card');
  input.addEventListener('input',function(){
    var q=input.value.trim().toLowerCase();
    cards.forEach(function(card){
      var name=card.querySelector('.menu-card__name').textContent.toLowerCase();
      var desc=card.querySelector('.menu-card__desc').textContent.toLowerCase();
      card.classList.toggle('is-unmatched', q!=='' && name.indexOf(q)===-1 && desc.indexOf(q)===-1);
    });
  });
})();
