# Sask Learner Prep

Static practice site for the Saskatchewan Class 7 knowledge test (signs + rules of the road).
No build step: plain HTML, CSS and JavaScript.

- `index.html` — home
- `signs-test.html`, `rules-test.html` — practice tests (engine in `app.js`, questions in `data/*.json`)
- `road-signs.html` — study sheet of all signs
- `handbook.html` — handbook guide; the PDF link points to the official file on sgi.sk.ca
- `sitemap.xml`, `robots.txt`, `og.png`, `favicon.svg` — SEO and sharing
- `vercel.json` — clean URLs (`/rules-test` instead of `/rules-test.html`)

When the final domain is known, replace `https://sask-learner-prep.vercel.app`
in all `.html` files, `sitemap.xml` and `robots.txt`.
