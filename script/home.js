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
})();
