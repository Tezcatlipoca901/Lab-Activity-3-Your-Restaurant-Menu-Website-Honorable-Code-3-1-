(function(){
  var nav=document.getElementById('nav'),
      toggle=nav.querySelector('.nav__toggle'),
      hero=document.querySelector('.menu-hero'),
      links=[].slice.call(nav.querySelectorAll('.nav__pill a[href^="#"]:not(.only-mobile)')),
      sections=[],
      ids=[],
      ticking=false;

  // Build section array
  links.forEach(function(a){
    var href=a.getAttribute('href');
    if(href && href.startsWith('#')){
      var id=href.slice(1);
      var el=document.getElementById(id);
      if(el){ 
        ids.push(id); 
        sections.push(el);
      }
    }
  });

  function update(){
    ticking=false;
    var navH=nav.offsetHeight;

    // White navbar once the hero is behind it, so page content doesn't show through the links
    if(hero) nav.classList.toggle('is-solid', hero.getBoundingClientRect().bottom <= navH);
    
    // Scroll-spy: find which section is currently in view
    var scrollPos = window.pageYOffset || document.documentElement.scrollTop;
    var current = 0;
    
    // Check each section to see if we've scrolled past it
    sections.forEach(function(section, i){
      var sectionTop = section.offsetTop - navH - 50;
      if(scrollPos >= sectionTop){
        current = i;
      }
    });
    
    // Update active states
    links.forEach(function(link, i){
      var isActive = (i === current);
      link.classList.toggle('is-active', isActive);
      if(isActive){
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }
  
  function onScroll(){ 
    if(!ticking){ 
      ticking=true; 
      requestAnimationFrame(update); 
    } 
  }
  
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


// Menu filtering functionality
(function(){
  var filterBtns = document.querySelectorAll('.filter-btn');
  var menuCards = document.querySelectorAll('.menu-card');
  var searchInputs = [].slice.call(document.querySelectorAll('.menu-search input, .menu-find input'));

  // Filter by category
  filterBtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      var category = this.getAttribute('data-category');
      
      // Update active button
      filterBtns.forEach(function(b){ b.classList.remove('is-active'); });
      this.classList.add('is-active');
      
      // Filter cards
      menuCards.forEach(function(card){
        if(category === 'all' || card.getAttribute('data-category') === category){
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
      
      // Clear search if filter is changed
      searchInputs.forEach(function(i){ i.value = ''; });
    });
  });

  // Search functionality (both search bars)
  searchInputs.forEach(function(input){
    input.addEventListener('input', function(){
      var searchTerm = this.value.trim().toLowerCase();

      // keep the other search bar in sync
      searchInputs.forEach(function(i){ if(i !== input) i.value = input.value; });

      menuCards.forEach(function(card){
        var name = card.querySelector('.menu-card__name').textContent.toLowerCase();
        var desc = card.querySelector('.menu-card__desc').textContent.toLowerCase();

        if(name.includes(searchTerm) || desc.includes(searchTerm)){
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });

      // Reset filter buttons when searching
      if(searchTerm){
        filterBtns.forEach(function(b){ b.classList.remove('is-active'); });
      }
    });
  });
})();


// Sulit Deals carousel (dots, swipe, auto-advance)
(function(){
  var root = document.querySelector('.sulit-deals');
  if(!root) return;

  var viewport = root.querySelector('.sulit-deals__viewport'),
      track    = root.querySelector('.sulit-deals__track'),
      slides   = [].slice.call(root.querySelectorAll('.sulit-deals__slide')),
      dots     = [].slice.call(root.querySelectorAll('.sulit-deals__dot')),
      count    = slides.length,
      index    = 0,
      timer    = null,
      INTERVAL = 6000,
      reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(count < 2) return;

  function go(i, user){
    index = (i + count) % count;
    track.style.transform = 'translateX(' + (-100 * index) + '%)';
    slides.forEach(function(s, n){
      if(n === index){ s.removeAttribute('aria-hidden'); s.removeAttribute('inert'); }
      else { s.setAttribute('aria-hidden', 'true'); s.setAttribute('inert', ''); }
    });
    dots.forEach(function(d, n){
      var on = n === index;
      d.classList.toggle('is-active', on);
      d.setAttribute('aria-selected', on ? 'true' : 'false');
      d.tabIndex = on ? 0 : -1;               // roving tabindex: arrows move between dots
    });
    if(user) restart();
  }

  function stop(){ if(timer){ clearInterval(timer); timer = null; } }
  function start(){
    if(reduceMotion || timer) return;
    timer = setInterval(function(){ go(index + 1); }, INTERVAL);
  }
  function restart(){ stop(); start(); }

  // Dots
  dots.forEach(function(dot, n){
    dot.addEventListener('click', function(){ go(n, true); });
    dot.addEventListener('keydown', function(e){
      var next = null;
      if(e.key === 'ArrowRight' || e.key === 'ArrowDown') next = n + 1;
      else if(e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = n - 1;
      else if(e.key === 'Home') next = 0;
      else if(e.key === 'End') next = count - 1;
      if(next === null) return;
      e.preventDefault();
      go(next, true);
      dots[(next + count) % count].focus();
    });
  });

  // Swipe (touch + mouse drag on desktop)
  var startX = 0, startY = 0, tracking = false;
  viewport.addEventListener('pointerdown', function(e){
    if(e.pointerType === 'mouse' && e.button !== 0) return;
    startX = e.clientX; startY = e.clientY; tracking = true;
  });
  viewport.addEventListener('pointerup', function(e){
    if(!tracking) return;
    tracking = false;
    var dx = e.clientX - startX, dy = e.clientY - startY;
    if(Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1), true);
  });
  viewport.addEventListener('pointercancel', function(){ tracking = false; });

  // Pause while the person is looking at / interacting with it, or the tab is hidden
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', start);
  document.addEventListener('visibilitychange', function(){ document.hidden ? stop() : start(); });

  go(0);
  start();
})();