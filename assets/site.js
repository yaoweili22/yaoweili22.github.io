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

  var codeLinks = Array.from(document.querySelectorAll('.paper-links a[href*="github.com/"]'))
    .filter(function (link) { return link.textContent.trim().indexOf('Code') === 0; });

  function compactNumber(value) {
    if (value >= 1000000) return (value / 1000000).toFixed(value >= 10000000 ? 0 : 1).replace('.0', '') + 'm';
    if (value >= 1000) return (value / 1000).toFixed(value >= 100000 ? 0 : 1).replace('.0', '') + 'k';
    return String(value);
  }

  function readCachedStars(repo) {
    try {
      var cached = JSON.parse(localStorage.getItem('github-stars:' + repo));
      if (cached && (typeof cached.count === 'number' || typeof cached.lastAttemptAt === 'number')) return cached;
    } catch (error) {}
    return null;
  }

  function writeStarCache(repo, value) {
    try {
      localStorage.setItem('github-stars:' + repo, JSON.stringify(value));
    } catch (error) {}
  }

  function renderStars(badge, repo, count) {
    badge.hidden = false;
    badge.textContent = '★ ' + compactNumber(count);
    badge.setAttribute('role', 'img');
    badge.setAttribute('aria-label', count.toLocaleString('en-US') + ' GitHub stars for ' + repo);
  }

  codeLinks.forEach(function (link) {
    var path = new URL(link.href).pathname.split('/').filter(Boolean);
    if (path.length < 2) return;

    var repo = path[0] + '/' + path[1];
    var group = document.createElement('span');
    group.className = 'github-code-group';
    link.parentNode.insertBefore(group, link);
    group.appendChild(link);

    var badge = document.createElement('span');
    badge.className = 'github-stars';
    badge.hidden = true;
    group.appendChild(badge);

    var cached = readCachedStars(repo);
    if (cached && typeof cached.count === 'number') renderStars(badge, repo, cached.count);

    var cacheIsFresh = cached && Date.now() - cached.updatedAt < 6 * 60 * 60 * 1000;
    var retryIsCoolingDown = cached && cached.lastAttemptAt && Date.now() - cached.lastAttemptAt < 15 * 60 * 1000;
    if (cacheIsFresh || retryIsCoolingDown || typeof fetch !== 'function') return;

    writeStarCache(repo, {
      count: cached && cached.count,
      updatedAt: cached && cached.updatedAt || 0,
      lastAttemptAt: Date.now()
    });

    fetch('https://api.github.com/repos/' + repo, {
      headers: { Accept: 'application/vnd.github+json' }
    })
      .then(function (response) {
        if (!response.ok) throw new Error('GitHub API request failed');
        return response.json();
      })
      .then(function (data) {
        if (typeof data.stargazers_count !== 'number') return;
        writeStarCache(repo, {
          count: data.stargazers_count,
          updatedAt: Date.now(),
          lastAttemptAt: Date.now()
        });
        renderStars(badge, repo, data.stargazers_count);
      })
      .catch(function () {});
  });
})();
