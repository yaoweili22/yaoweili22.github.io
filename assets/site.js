(function () {
  var root = document.documentElement;
  var themeButton = document.querySelector('.theme-button');
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function updateThemeControls() {
    var dark = root.dataset.theme === 'dark';
    themeButton.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    if (themeMeta) themeMeta.setAttribute('content', dark ? '#13140f' : '#f5f5ef');
  }

  if (themeButton) {
    updateThemeControls();
    themeButton.addEventListener('click', function () {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (error) {}
      updateThemeControls();
    });
  }

  var sectionLinks = Array.from(document.querySelectorAll('.navlinks a[href^="#"]'));
  var sections = sectionLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach(function (link) {
          link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-24% 0px -64% 0px', threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
