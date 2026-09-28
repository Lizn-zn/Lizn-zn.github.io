# Zenan Li — Academic Homepage

Static academic homepage at <https://lizn-zn.github.io/>. The current site uses
plain HTML, CSS, JavaScript, and JSON; there is no build step or package install.

## Preview locally

From the repository root:

```sh
python3 -m http.server 8081 --bind 127.0.0.1
```

Open <http://127.0.0.1:8081/>. Use an HTTP server because the page fetches its
publication, news, and honors data from JSON files.

## Update content

| Content | File |
| --- | --- |
| Biography, affiliation, contact, research, experience, and service | `index.html` |
| Publications and resource links | `data/publications.json` |
| News, in editorial display order | `data/news.json` |
| Honors and awards | `data/honors.json` |
| Typography, layout, responsive and print styles | `styles.css` |
| Data rendering, search, filters, and navigation | `script.js` |
| Complete archive pages | `pages/all-publications.html`, `pages/all-news.html`, `pages/all-honors.html` |

The homepage displays the first three news entries and all papers. Publication
categories are `theorem-proving`, `neuro-symbolic`, and `trustworthy-ml`. Papers
are sorted by year; their JSON order is preserved within the same year and topic.
Label preprints explicitly in `venue`, for example `Preprint, 2026`.

Use verified public URLs for resource tags such as `Paper` and `Code`. Leave
unavailable links out of the `tags` array. News resource links use `url` and
`text`; publication resource tags use `link` and `text`.

After editing CSS or JavaScript, update the asset query version in the homepage
and the three archive pages. Canonical and sharing metadata live in each page's
`<head>`; keep them consistent with content and the production URL.

## Verify changes

```sh
node --check script.js
python3 -m json.tool data/publications.json > /dev/null
python3 -m json.tool data/news.json > /dev/null
python3 -m json.tool data/honors.json > /dev/null
```

In a browser, check the homepage and archive pages, publication search and
filters, mobile navigation, and narrow-screen overflow. New publication URLs
and changes to affiliations or conference status should be checked against
primary sources.

## Historical files and design studies

Local design studies in `design-preview.html` and `design-options/` are kept
outside the deployed site.

The `.nojekyll` file identifies the current static site. `_config.yml`,
`_layouts/`, `_includes/`, `_sass/`, `_posts/`, and `_site/` come from the older
Jekyll site and are not the source of the current homepage. Edit the root files
listed above, rather than generated files in `_site/`.

The original site used the [AP theme](https://github.com/kssim/ap), based on
[Tale](https://github.com/chesterhow/tale). Its attribution remains in `LICENSE`.
