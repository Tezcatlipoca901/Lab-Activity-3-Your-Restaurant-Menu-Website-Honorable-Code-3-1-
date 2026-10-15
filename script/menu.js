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