# iPhone repair indexing investigation — September 7, 2026

## Finding

The strongest working diagnosis is deferred crawl selection, not a demonstrated technical exclusion. Search Console reports **Discovered – currently not indexed**, with no recorded last crawl and no Google-selected canonical. That does not establish why Google deferred this particular URL, nor prove it has never fetched any version historically. The reported six-month duration is consistent with the repository page being created March 26, but we do not have six months of inspection snapshots.

## Evidence

- Canonical URL: https://www.haileyrepair.com/iphone-repair. Direct public request returns HTTP 200, HTML, a self-referencing www canonical, and no X-Robots-Tag exclusion.
- Google's September 7 live test: available to Google, page can be indexed, HTTP 200, all resources loaded. Its smartphone screenshot visibly renders the local iPhone headline, description, quote button and pricing button. Rendered HTML retains the correct canonical.
- One console warning reports a WebGL GPU stall due to ReadPixels. This is a performance warning; the test still rendered successfully. It is not evidence of an indexing block.
- The 16-address matrix covering HTTP/HTTPS, apex/www, extensionless/trailing slash/.html/.md behaves consistently: alternate forms redirect toward the canonical 200 page. The historical Markdown redirect was added September 1.
- Separate GSC inspection of the HTTPS apex extensionless URL, www .html URL and www .md URL each reports unknown to Google. None provides evidence that an older address is indexed instead. These checks are not an exhaustive inventory of historical aliases.
- Live apex sitemap redirects to the www sitemap. Both resolve to the same valid XML containing 77 entries, including the exact iPhone canonical once. The local sitemap also has 77 entries. GSC read the submitted sitemap successfully September 4 with 77 discovered pages. The page-level 'no referring sitemaps detected' does not prove omission from the sitemap.
- The local link inventory finds 63 sitemap pages containing 143 links to the iPhone route, including two self-links; therefore 62 other pages contain 141 incoming links. Homepage contains four, including a service card. Both high-traffic screen guides already contain contextual repair links. This is not an orphan page.
- All 76 saved revisions of iphone-repair.html were checked for meta noindex: none found. Canonical changed from apex to www March 28 and has remained www in subsequent source history. Repository history cannot establish historical hosting headers or firewall behavior.
- GSC crawl statistics, updated September 5, show 1,214 requests over the report window: 1,121 www and 93 apex. Both hosts report No problems; average response time 150 ms. Responses: 86% HTTP 200, 11% HTTP 301, 1% HTTP 404, 1% HTTP 304 (rounded). Purpose: 95% refresh, 5% discovery. File type: 40% HTML. These are site-level requests, not unique pages or proof of a page-specific cause.
- An indexing request was already accepted September 7 during the preceding audit. Repeating it does not advance queue priority, according to the confirmation shown by Google.

## Decision and next steps

No additional website change is justified as an indexing fix by these findings. Existing canonicalization, crawl permissions, sitemap inclusion and contextual links already work. Changing the slug or creating a competing iPhone service page would introduce migration or duplication risk without addressing an observed defect.

Recheck the canonical URL in 7–14 days after the accepted request. The first useful change is a recorded crawl date. If it remains Discovered, examine verified Googlebot requests and blocking events in the hosting/CDN logs for this exact path; those logs were not available in this investigation. Site-wide crawl stats cannot rule out every historical or selective access failure. If it becomes Crawled – currently not indexed, inspect the crawled HTML and selected canonical before treating content differentiation as the next problem.

For a substantive improvement, add an actual iPhone repair case with original photos, model, symptom, diagnostic finding and outcome supplied by the technician. This is a content recommendation, not a proven indexing cure. The current service page already contains pricing, local context and repair details; further generic text or more links alone would add little.

## Sources and evidence

GSC was operated in the user's signed-in Chrome session using Computer Use. Supporting inspection files, crawl statistics and Google's mobile screenshot are in the task evidence folder:
`/Users/Samuel/.codex/visualizations/2026/09/07/01a07e06-8254-7882-aeaf-fbf0ce23611c/gsc/`.

Google documents the distinction between indexed inspection data and a live availability test: https://support.google.com/webmasters/answer/9012289?hl=en . A live pass establishes accessibility and eligibility, not guaranteed indexing. Sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap .
