# Inside the Repair — unfinished archive

This build is deliberately not published. `.vercelignore` excludes the entire
`archived/` directory, and the public page, assets, sitemap entry, Quick Find
entry, and homepage/About invitations have been removed from their live locations.

Preview locally at `/archived/inside-the-repair/inside-the-repair.html` while
serving the repository root. Shared photos, fonts, navigation, and global styles
still come from the main site. All feature-specific code is preserved here.

To regenerate or test the archive from the repository root:

```sh
node archived/inside-the-repair/scripts/build-repair-explorer.mjs
node --test archived/inside-the-repair/scripts/test-repair-explorer.mjs
```

The original design and maintenance notes are in `docs/inside-the-repair.md`.
Those notes describe the original public integration; that integration is now
removed. When ready, restore the feature files to their original paths, update
the generator's shared-shell path, restore public asset URLs, remove noindex,
and deliberately re-add the navigation and sitemap entry. Do not remove the
`archived/` deployment exclusion to publish this feature.
