# shared/assets

Non-UI business assets — things that end up *in exported output*,
not in the app chrome. For example:

- PDF/print report letterhead & branding
- Watermarks for exported diagrams
- Thumbnail images for `shared/example-projects/`

Contrast with `frontend/shared-ui/assets/`, which holds icons/fonts/
images for the **app's own interface** (toolbar icons, empty-state
illustrations). If an asset is drawn *inside the app UI*, it goes in
`frontend/shared-ui/assets/`. If it's produced *as output* (a report,
an exported image), it goes here.

Empty for now — populate as export/reporting features are built.
