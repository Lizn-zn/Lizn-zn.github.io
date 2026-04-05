document.addEventListener('DOMContentLoaded', function() {
  // Make all links open in a new tab
  makeAllLinksOpenInNewTab();

  // Set up MutationObserver to watch for dynamically added links
  setupLinkObserver();

  // Mobile Menu Toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    // Close menu when a link is clicked
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }

  // Load publications data from JSON file
  loadPublications();

  // Smooth scrolling for navigation links
  const navLinks = document.querySelectorAll('.nav-links a');

  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      if (this.getAttribute('href').startsWith('#')) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
          const navHeight = document.querySelector('.top-nav').offsetHeight;
          const targetPosition = targetSection.offsetTop - navHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          navLinks.forEach(l => l.classList.remove('active'));
          this.classList.add('active');
        }
      }
    });
  });

  // Update active nav link on scroll
  window.addEventListener('scroll', function() {
    let current = '';
    const sections = document.querySelectorAll('section[id]');
    const navHeight = document.querySelector('.top-nav').offsetHeight;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      if (pageYOffset >= sectionTop - navHeight - 100) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      const linkTarget = link.getAttribute('href').substring(1);
      if (linkTarget === current ||
        (current === 'homepage' && linkTarget === 'about') ||
        (current === 'about' && linkTarget === 'homepage')) {
        link.classList.add('active');
      }
    });
  });

  // Load news data
  let newsJsonPath = 'data/news.json';
  if (window.location.pathname.includes('/pages/')) {
    newsJsonPath = '../data/news.json';
  }

  fetch(newsJsonPath)
    .then(response => response.json())
    .then(data => {
      const latestNewsSection = document.getElementById('latest-news');
      if (latestNewsSection) {
        renderNewsItems(data.slice(0, 3), 'news-container');
      }

      const allNewsSection = document.getElementById('all-news');
      if (allNewsSection) {
        renderNewsItems(data, 'all-news-container');
      }
    })
    .catch(error => {
      console.error('Error loading news data:', error);
    });

  // Load honors data
  let honorsJsonPath = 'data/honors.json';
  if (window.location.pathname.includes('/pages/')) {
    honorsJsonPath = '../data/honors.json';
  }

  fetch(honorsJsonPath)
    .then(response => response.json())
    .then(data => {
      const honorsSection = document.getElementById('honors');
      if (honorsSection) {
        renderHonorsItems(data.slice(0, 8), 'honors-container');
      }

      const allHonorsSection = document.getElementById('all-honors');
      if (allHonorsSection) {
        renderHonorsItems(data, 'all-honors-container');
      }
    })
    .catch(error => {
      console.error('Error loading honors data:', error);
    });
});

// Function to load publications from JSON
function loadPublications() {
  let publicationsJsonPath = 'data/publications.json';
  if (window.location.pathname.includes('/pages/')) {
    publicationsJsonPath = '../data/publications.json';
  }

  const publicationsList = document.querySelector('.publications-list');
  if (!publicationsList) {
    console.warn('Publications list not found');
    return;
  }

  publicationsList.innerHTML = '';

  fetch(publicationsJsonPath)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(publications => {
      console.log('Loaded publications:', publications.length);

      let pubsToShow = publications;

      // Sort by year descending (Preprints/Missing year at top)
      pubsToShow.sort((a, b) => {
        const yearA = a.year ? parseInt(a.year) : 9999;
        const yearB = b.year ? parseInt(b.year) : 9999;
        return yearB - yearA;
      });

      // Group by year
      const pubsByYear = {};
      pubsToShow.forEach(pub => {
        const year = pub.year || 'Preprint';
        if (!pubsByYear[year]) {
          pubsByYear[year] = [];
        }
        pubsByYear[year].push(pub);
      });

      // Get sorted years
      const sortedYears = Object.keys(pubsByYear).sort((a, b) => {
        if (a === 'Preprint') return -1;
        if (b === 'Preprint') return 1;
        return b - a;
      });

      // Render groups
      sortedYears.forEach(year => {
        const yearGroup = document.createElement('div');
        yearGroup.className = 'pub-year-group';

        const yearHeader = document.createElement('h3');
        yearHeader.className = 'pub-year-header';
        yearHeader.textContent = `-${year}-`;
        yearGroup.appendChild(yearHeader);

        const ul = document.createElement('ul');
        ul.className = 'pub-list-ul';

        pubsByYear[year].forEach(pub => {
          const li = document.createElement('li');
          li.className = 'pub-list-item';

          const contentWrapper = document.createElement('div');
          contentWrapper.className = 'pub-content-wrapper';

          // --- Line 1: [Venue] Title ---
          const line1 = document.createElement('div');
          line1.className = 'pub-line-1';

          const titleSpan = document.createElement('span');
          titleSpan.className = 'pub-title-text';
          titleSpan.textContent = pub.title;
          line1.appendChild(titleSpan);

          // Paper/Code Buttons
          if (pub.tags) {
            pub.tags.forEach(tag => {
              if (tag.link && tag.link !== '#') {
                const btn = document.createElement('a');
                btn.className = 'pub-link-btn';
                btn.href = tag.link;
                btn.target = '_blank';

                if (tag.text === 'Paper') {
                  btn.textContent = 'PDF';
                } else {
                  btn.textContent = tag.text;
                }

                line1.appendChild(btn);
              }
            });
          }

          // Thumbnail Preview Button
          let thumbBox = null;
          if (pub.thumbnail) {
            const btnPreview = document.createElement('button');
            btnPreview.className = 'pub-link-btn pub-btn-preview';
            btnPreview.textContent = 'Image';
            btnPreview.onclick = function() {
              if (li.classList.contains('with-thumbnail-expanded')) {
                li.classList.remove('with-thumbnail-expanded');
                thumbBox.style.display = 'none';
                btnPreview.classList.remove('active');
              } else {
                li.classList.add('with-thumbnail-expanded');
                thumbBox.style.display = 'block';
                btnPreview.classList.add('active');
              }
            };
            line1.appendChild(btnPreview);

            thumbBox = document.createElement('div');
            thumbBox.className = 'pub-thumbnail-box';
            thumbBox.style.display = 'none';
            const thumbImg = document.createElement('img');
            thumbImg.src = pub.thumbnail;
            thumbImg.alt = 'Publication Thumbnail';
            thumbBox.appendChild(thumbImg);
          }

          contentWrapper.appendChild(line1);

          // --- Line 2: Authors ---
          const line2 = document.createElement('div');
          line2.className = 'pub-line-2';
          line2.innerHTML = pub.authors;
          contentWrapper.appendChild(line2);

          // --- Line 3: Venue Details ---
          const line3 = document.createElement('div');
          line3.className = 'pub-line-3';

          // Badge (Oral/Spotlight)
          let highlightText = pub.highlight || '';
          let badgeText = '';
          if (highlightText.toLowerCase().includes('oral')) badgeText = 'Oral';
          else if (highlightText.toLowerCase().includes('spotlight')) badgeText = 'Spotlight';

          if (badgeText) {
            const badge = document.createElement('span');
            badge.className = 'pub-badge-highlight';
            badge.textContent = badgeText;
            line3.appendChild(badge);
          }

          // Full Venue Name
          const fullVenueName = getVenueFullName(pub.venue, pub.year);
          const venueNameSpan = document.createElement('span');
          venueNameSpan.textContent = fullVenueName;
          line3.appendChild(venueNameSpan);

          contentWrapper.appendChild(line3);

          li.appendChild(contentWrapper);
          if (thumbBox) {
            li.appendChild(thumbBox);
          }

          ul.appendChild(li);
        });

        yearGroup.appendChild(ul);
        publicationsList.appendChild(yearGroup);
      });
    })
    .catch(error => {
      console.error('Error loading publications data:', error);
      publicationsList.innerHTML = '<p>Failed to load publications. Please check the console for details.</p>';
    });
}

function getVenueShortName(venueStr, year) {
  if (!venueStr) return 'Preprint';

  let s = venueStr.replace(/\d{4}/g, '').trim();
  let suffix = '';

  // Conferences that need year suffix
  const conferences = [
    'NeurIPS', 'CVPR', 'ICCV', 'ECCV', 'ICRA', 'AAAI',
    'GLOBECOM', 'INFOCOM', 'MOBICOM',
    'ICLR', 'ICML', 'ICSE', 'KDD', 'COLM'
  ];
  for (const conf of conferences) {
    if (s.toUpperCase().includes(conf.toUpperCase())) {
      if (year) {
        const yearStr = year.toString();
        if (yearStr.length === 4) {
          suffix = "'" + yearStr.substring(2);
        }
      }
      return conf + suffix;
    }
  }

  // ESEC/FSE special case
  if (s.includes('ESEC') || s.includes('FSE')) {
    if (year) {
      const yearStr = year.toString();
      if (yearStr.length === 4) {
        suffix = "'" + yearStr.substring(2);
      }
    }
    return 'ESEC/FSE' + suffix;
  }

  // ICSE-NIER
  if (s.includes('ICSE-NIER')) {
    if (year) {
      const yearStr = year.toString();
      if (yearStr.length === 4) {
        suffix = "'" + yearStr.substring(2);
      }
    }
    return 'ICSE-NIER' + suffix;
  }

  // Special cases
  if (s.toLowerCase().includes('arxiv')) return 'ArXiv';
  if (s.toLowerCase().includes('submission')) return 'In Submission';

  // Journals
  if (s.includes('TDSC')) return 'IEEE TDSC';
  if (s.includes('TMC')) return 'IEEE TMC';
  if (s.includes('JSAC')) return 'IEEE JSAC';
  if (s.includes('TGCN')) return 'IEEE TGCN';
  if (s.includes('LNET')) return 'IEEE LNET';
  if (s.includes('TNSE')) return 'IEEE TNSE';
  if (s.includes('IOTJ') || s.includes('IoTJ')) return 'IEEE IoTJ';

  return s;
}

function getVenueFullName(venueStr, year) {
  if (!venueStr) return '';
  let s = venueStr.replace(/\d{4}/g, '').trim();

  let yearSuffix = '';
  if (year) {
    const yearStr = year.toString();
    if (yearStr.length === 4) {
      yearSuffix = "'" + yearStr.substring(2);
    }
  }

  // Journal Full Names (No Year)
  if (s.includes('TDSC')) return 'IEEE Transactions on Dependable and Secure Computing';
  if (s.includes('TMC')) return 'IEEE Transactions on Mobile Computing';
  if (s.includes('JSAC')) return 'IEEE Journal on Selected Areas in Communications';
  if (s.includes('TGCN')) return 'IEEE Transactions on Green Communications and Networking';
  if (s.includes('TNSE')) return 'IEEE Transactions on Network Science and Engineering';
  if (s.includes('IoTJ') || s.includes('IOTJ')) return 'IEEE Internet of Things Journal';
  if (s.includes('LNET') || s.includes('LNet')) return 'IEEE Networking Letters';

  // Conference Full Names (With Year Suffix)
  if (s.includes('NeurIPS')) return `Advances in Neural Information Processing Systems (NeurIPS${yearSuffix})`;
  if (s.includes('CVPR')) return `IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR${yearSuffix})`;
  if (s.includes('ICCV')) return `IEEE/CVF International Conference on Computer Vision (ICCV${yearSuffix})`;
  if (s.includes('ECCV')) return `European Conference on Computer Vision (ECCV${yearSuffix})`;
  if (s.includes('ICRA')) return `IEEE International Conference on Robotics and Automation (ICRA${yearSuffix})`;
  if (s.includes('AAAI')) return `AAAI Conference on Artificial Intelligence (AAAI${yearSuffix})`;
  if (s.includes('GLOBECOM')) return `IEEE Global Communications Conference (GLOBECOM${yearSuffix})`;
  if (s.includes('INFOCOM')) return `IEEE International Conference on Computer Communications (INFOCOM${yearSuffix})`;
  if (s.includes('MOBICOM')) return `Annual International Conference on Mobile Computing and Networking (MobiCom${yearSuffix})`;

  // Additional conferences for Zenan's publications
  if (s.includes('ICLR')) return `International Conference on Learning Representations (ICLR${yearSuffix})`;
  if (s.includes('ICML')) return `International Conference on Machine Learning (ICML${yearSuffix})`;
  if (s.includes('ICSE-NIER')) return `International Conference on Software Engineering, New Ideas and Emerging Results (ICSE-NIER${yearSuffix})`;
  if (s.includes('ICSE')) return `International Conference on Software Engineering (ICSE${yearSuffix})`;
  if (s.includes('ESEC') || s.includes('FSE')) return `ACM Joint European Software Engineering Conference and Symposium on the Foundations of Software Engineering (ESEC/FSE${yearSuffix})`;
  if (s.includes('KDD')) return `ACM SIGKDD Conference on Knowledge Discovery and Data Mining (KDD${yearSuffix})`;
  if (s.includes('COLM')) return `Conference on Language Modeling (COLM${yearSuffix})`;

  if (s.toLowerCase().includes('arxiv')) return 'arXiv preprint';
  if (s.toLowerCase().includes('submission')) return 'In submission';

  return s;
}

function getCCFRank(fullName, originalVenue) {
  const v = (fullName + ' ' + originalVenue).toLowerCase();

  // CCF-A
  if (v.includes('tdsc') || v.includes('dependable and secure') ||
    v.includes('tmc') || v.includes('mobile computing') ||
    v.includes('aaai') || v.includes('neurips') ||
    v.includes('cvpr') || v.includes('iccv') ||
    v.includes('infocom') || v.includes('jsac') ||
    v.includes('iclr') || v.includes('icml') ||
    v.includes('icse') || v.includes('fse') || v.includes('esec') ||
    v.includes('kdd')) {
    return 'A';
  }

  // CCF-B
  if (v.includes('icra') || v.includes('colm')) {
    return 'B';
  }

  // CCF-C
  if (v.includes('globecom')) {
    return 'C';
  }

  return null;
}

// Function to render news items
function renderNewsItems(newsData, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn('News container not found:', containerId);
    return;
  }

  container.innerHTML = '';

  newsData.forEach(newsItem => {
    const newsElement = document.createElement('div');
    newsElement.className = 'news-item';

    const dateElement = document.createElement('span');
    dateElement.className = 'news-date';
    dateElement.textContent = newsItem.date;

    const contentElement = document.createElement('div');
    contentElement.className = 'news-content';

    const textSpan = document.createElement('span');
    textSpan.innerHTML = '🎉 ' + newsItem.content;
    contentElement.appendChild(textSpan);

    if (newsItem.links && newsItem.links.length > 0) {
      newsItem.links.forEach(link => {
        const space = document.createTextNode(' ');
        contentElement.appendChild(space);

        const linkElement = document.createElement('a');
        linkElement.href = link.url;
        linkElement.textContent = link.text;
        if (link.url && !link.url.startsWith('#')) {
          linkElement.setAttribute('target', '_blank');
        }
        contentElement.appendChild(linkElement);
      });
    }

    if (newsItem.link && newsItem.link !== '#' && (!newsItem.links || newsItem.links.length === 0)) {
      const space = document.createTextNode(' ');
      contentElement.appendChild(space);

      const linkElement = document.createElement('a');
      linkElement.href = newsItem.link;
      linkElement.textContent = '[Link]';
      linkElement.setAttribute('target', '_blank');
      contentElement.appendChild(linkElement);
    }

    newsElement.appendChild(dateElement);
    newsElement.appendChild(contentElement);
    container.appendChild(newsElement);
  });
}

// Function to render honors items
function renderHonorsItems(honorsData, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn('Honors container not found:', containerId);
    return;
  }

  container.innerHTML = '';

  honorsData.forEach(honor => {
    const honorElement = document.createElement('div');
    honorElement.className = 'honor-item';

    const yearElement = document.createElement('div');
    yearElement.className = 'honor-year';
    yearElement.textContent = honor.date;

    const contentElement = document.createElement('div');
    contentElement.className = 'honor-content';

    const titleElement = document.createElement('h3');
    titleElement.textContent = honor.title;

    const orgElement = document.createElement('p');
    orgElement.className = 'text-sm text-neutral-600';
    orgElement.textContent = honor.org;

    contentElement.appendChild(titleElement);
    contentElement.appendChild(orgElement);

    honorElement.appendChild(yearElement);
    honorElement.appendChild(contentElement);

    container.appendChild(honorElement);
  });
}

// Helper to open all external links in new tab
function makeAllLinksOpenInNewTab() {
  const links = document.querySelectorAll('a');
  links.forEach(link => {
    if (link.hostname !== window.location.hostname && link.getAttribute('href') && !link.getAttribute('href').startsWith('#') && !link.getAttribute('href').startsWith('mailto:')) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

// Helper to setup MutationObserver for dynamically added links
function setupLinkObserver() {
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            if (node.tagName === 'A') {
              if (node.hostname !== window.location.hostname && node.getAttribute('href') && !node.getAttribute('href').startsWith('#') && !node.getAttribute('href').startsWith('mailto:')) {
                node.setAttribute('target', '_blank');
                node.setAttribute('rel', 'noopener noreferrer');
              }
            }
            const links = node.querySelectorAll('a');
            links.forEach(link => {
              if (link.hostname !== window.location.hostname && link.getAttribute('href') && !link.getAttribute('href').startsWith('#') && !link.getAttribute('href').startsWith('mailto:')) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
              }
            });
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
