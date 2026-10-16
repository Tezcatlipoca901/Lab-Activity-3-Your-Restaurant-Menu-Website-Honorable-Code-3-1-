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

  // The card title is built from two parts ("Savory" + "BANGSILOG") with no space between,
  // so a plain textContent search for "savory bangsilog" never matched. Compare with spaces
  // normalised and also with spaces removed.
  function cardMatches(card, term){
    if(!term) return true;
    var h = card.querySelector('.menu-card__name');
    var name = [].map.call(h.childNodes, function(n){ return n.textContent.trim(); }).join(' ').toLowerCase().replace(/\s+/g,' ');
    var desc = card.querySelector('.menu-card__desc').textContent.toLowerCase();
    var t = term.toLowerCase().replace(/\s+/g,' ').trim();
    return name.includes(t) || name.replace(/\s/g,'').includes(t.replace(/\s/g,'')) || desc.includes(t);
  }

  // Category and search work together: a card shows only if it matches both.
  var currentCategory = 'all';
  function currentTerm(){ return (searchInputs[0] ? searchInputs[0].value : '').trim().toLowerCase(); }
  function applyFilters(){
    var term = currentTerm();
    menuCards.forEach(function(card){
      var inCat = currentCategory === 'all' || card.getAttribute('data-category') === currentCategory;
      card.classList.toggle('hidden', !(inCat && cardMatches(card, term)));
    });
  }

  // Filter by category (keeps whatever is typed in the search bar)
  filterBtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      currentCategory = this.getAttribute('data-category');
      filterBtns.forEach(function(b){ b.classList.toggle('is-active', b === btn); });
      applyFilters();
    });
  });

  // Search functionality (both search bars)
  searchInputs.forEach(function(input){
    input.addEventListener('input', function(){
      var searchTerm = this.value.trim().toLowerCase();

      // keep the other search bar in sync
      searchInputs.forEach(function(i){ if(i !== input) i.value = input.value; });

      applyFilters();
    });
  });

  // ── Hero search bar: "Search" pill + suggestions ──
  var heroForm = document.querySelector('.menu-search');
  if(heroForm){
    var heroInput = heroForm.querySelector('input');
    var heroGo    = heroForm.querySelector('.menu-search__go');
    var list      = heroForm.querySelector('.menu-suggest');
    var MAX = 6, active = -1, items = [];

    // dish data, read from the menu cards
    var dishes = [].slice.call(menuCards).map(function(card){
      var h = card.querySelector('.menu-card__name');
      var raw = [].map.call(h.childNodes, function(n){ return n.textContent.trim(); }).join(' ').replace(/\s+/g,' ').trim();
      var img = card.querySelector('.menu-card__img img');
      var price = card.querySelector('.menu-card__price-amount');
      return {
        name: raw.toLowerCase().replace(/\b\w/g, function(c){ return c.toUpperCase(); }),
        key: raw.toLowerCase(),
        src: img ? img.getAttribute('src') : '',
        price: price ? price.textContent.trim() : '',
        cat: (card.getAttribute('data-category') || '').replace(/-/g,' ')
      };
    });

    function syncActive(){ heroForm.classList.toggle('is-active', heroInput.value.trim() !== ''); }

    function closeList(){
      list.hidden = true; list.innerHTML = ''; items = []; active = -1;
      heroInput.setAttribute('aria-expanded','false');
      heroInput.removeAttribute('aria-activedescendant');
    }

    function setActive(i){
      if(!items.length) return;
      active = (i + items.length) % items.length;
      items.forEach(function(li, n){
        var on = n === active;
        li.classList.toggle('is-active', on);
        li.setAttribute('aria-selected', on ? 'true' : 'false');
        if(on){ heroInput.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({block:'nearest'}); }
      });
    }

    function highlight(el, text, term){
      var i = text.toLowerCase().indexOf(term);
      if(i < 0){ el.textContent = text; return; }
      el.appendChild(document.createTextNode(text.slice(0, i)));
      var m = document.createElement('mark'); m.textContent = text.slice(i, i + term.length);
      el.appendChild(m);
      el.appendChild(document.createTextNode(text.slice(i + term.length)));
    }

    function showSuggestions(){
      var term = heroInput.value.trim().toLowerCase();
      closeList();
      if(!term) return;

      // names that start with the term (or a word in it) first, then anything containing it
      var starts = [], contains = [];
      dishes.forEach(function(d){
        var i = d.key.indexOf(term);
        if(i === 0 || (i > 0 && d.key.charAt(i-1) === ' ')) starts.push(d);
        else if(i > 0) contains.push(d);
      });
      var found = starts.concat(contains).slice(0, MAX);

      if(!found.length){
        var none = document.createElement('li');
        none.className = 'menu-suggest__empty'; none.setAttribute('role','option');
        none.textContent = 'No dishes found for \u201C' + heroInput.value.trim() + '\u201D';
        list.appendChild(none);
      } else {
        found.forEach(function(d, n){
          var li = document.createElement('li');
          li.className = 'menu-suggest__item'; li.id = 'menu-suggest-' + n;
          li.setAttribute('role','option'); li.setAttribute('aria-selected','false');
          li.dataset.value = d.name;

          var img = document.createElement('img');
          img.className = 'menu-suggest__img'; img.src = d.src; img.alt = ''; img.loading = 'lazy';
          var name = document.createElement('span'); name.className = 'menu-suggest__name';
          highlight(name, d.name, term);
          var meta = document.createElement('span'); meta.className = 'menu-suggest__meta';
          var pr = document.createElement('span'); pr.className = 'menu-suggest__price'; pr.textContent = d.price;
          var ct = document.createElement('span'); ct.className = 'menu-suggest__cat'; ct.textContent = d.cat;
          meta.appendChild(pr); meta.appendChild(ct);

          li.appendChild(img); li.appendChild(name); li.appendChild(meta);
          list.appendChild(li); items.push(li);
        });
      }
      list.hidden = false;
      heroInput.setAttribute('aria-expanded','true');
    }

    // filter the grid and jump to the menu panel
    function runSearch(){
      var term = heroInput.value.trim().toLowerCase();
      searchInputs.forEach(function(i){ if(i !== heroInput) i.value = heroInput.value; });
      applyFilters();

      closeList();
      var panel = document.getElementById('menu');
      if(panel) panel.scrollIntoView({behavior:'smooth', block:'start'});
      heroInput.blur();
    }

    heroInput.addEventListener('input', function(){ syncActive(); showSuggestions(); });
    heroInput.addEventListener('focus', function(){ if(heroInput.value.trim()) showSuggestions(); });
    heroInput.addEventListener('keydown', function(e){
      if(e.key === 'ArrowDown'){ if(items.length){ e.preventDefault(); setActive(active + 1); } }
      else if(e.key === 'ArrowUp'){ if(items.length){ e.preventDefault(); setActive(active - 1); } }
      else if(e.key === 'Escape'){ closeList(); }
      else if(e.key === 'Enter' && active > -1 && items[active]){
        e.preventDefault();
        heroInput.value = items[active].dataset.value; syncActive(); runSearch();
      }
    });

    // keep focus in the input while clicking a suggestion / the Search pill
    list.addEventListener('mousedown', function(e){ e.preventDefault(); });
    if(heroGo) heroGo.addEventListener('mousedown', function(e){ e.preventDefault(); });
    list.addEventListener('click', function(e){
      var li = e.target.closest('.menu-suggest__item');
      if(!li) return;
      heroInput.value = li.dataset.value; syncActive(); runSearch();
    });

    document.addEventListener('click', function(e){ if(!heroForm.contains(e.target)) closeList(); });
    heroInput.addEventListener('blur', function(){ setTimeout(closeList, 120); });

    heroForm.addEventListener('submit', function(e){ e.preventDefault(); runSearch(); });
  }
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

  // Arrows
  var prevBtn = root.querySelector('.sulit-deals__arrow--prev'),
      nextBtn = root.querySelector('.sulit-deals__arrow--next');
  if(prevBtn) prevBtn.addEventListener('click', function(){ go(index - 1, true); });
  if(nextBtn) nextBtn.addEventListener('click', function(){ go(index + 1, true); });

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


// "No results" message for both search bars
(function(){
  var grid  = document.querySelector('.menu-grid');
  var empty = document.querySelector('.menu-empty');
  if(!grid || !empty) return;
  var cards  = [].slice.call(grid.querySelectorAll('.menu-card'));
  var inputs = [].slice.call(document.querySelectorAll('.menu-search input, .menu-find input'));
  var term   = empty.querySelector('.menu-empty__term');

  function update(){
    var q = (inputs[0] ? inputs[0].value : '').trim();
    var visible = cards.some(function(c){ return !c.classList.contains('hidden'); });
    var show = q !== '' && !visible;
    empty.hidden = !show;
    var activeBtn = document.querySelector('.filter-btn.is-active');
    var cat = activeBtn && activeBtn.getAttribute('data-category') !== 'all' ? activeBtn.textContent.trim() : '';
    term.textContent = show ? ' for \u201C' + q + '\u201D' + (cat ? ' in ' + cat : '') : '';
    inputs.forEach(function(i){ i.classList.toggle('has-no-results', show); });
  }

  // runs whenever a card is hidden or shown, whichever search bar caused it
  var mo = new MutationObserver(update);
  cards.forEach(function(c){ mo.observe(c, {attributes:true, attributeFilter:['class']}); });
  inputs.forEach(function(i){ i.addEventListener('input', update); });
  document.querySelectorAll('.filter-btn').forEach(function(b){ b.addEventListener('click', function(){ setTimeout(update, 0); }); });
})();


// Platter carousel (one platter at a time: dots, swipe, auto-advance)
(function(){
  var root = document.querySelector('.platter__carousel');
  if(!root) return;

  var viewport = root.querySelector('.platter__viewport'),
      track    = root.querySelector('.platter__track'),
      slides   = [].slice.call(root.querySelectorAll('.platter__slide')),
      dots     = [].slice.call(root.querySelectorAll('.platter__dot')),
      count    = slides.length,
      index    = 0,
      timer    = null,
      INTERVAL = 8000,
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
      d.tabIndex = on ? 0 : -1;
    });
    collapseAll();
    if(user) restart();
  }

  var toggles = [].slice.call(root.querySelectorAll('.platter__more'));
  function anyOpen(){ return toggles.some(function(b){ return b.getAttribute('aria-expanded') === 'true'; }); }
  function setOpen(b, open){
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    b.textContent = open ? 'Hide details' : 'What’s included';
  }
  function collapseAll(){ toggles.forEach(function(b){ setOpen(b, false); }); }
  toggles.forEach(function(b){
    b.addEventListener('click', function(){
      var open = b.getAttribute('aria-expanded') !== 'true';
      collapseAll();
      setOpen(b, open);
      restart();
    });
  });

  function stop(){ if(timer){ clearInterval(timer); timer = null; } }
  function start(){
    if(reduceMotion || timer || anyOpen()) return;   // don't move on while someone is reading the details
    timer = setInterval(function(){ go(index + 1); }, INTERVAL);
  }
  function restart(){ stop(); start(); }

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

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', start);
  document.addEventListener('visibilitychange', function(){ document.hidden ? stop() : start(); });

  go(0);
  start();
})();