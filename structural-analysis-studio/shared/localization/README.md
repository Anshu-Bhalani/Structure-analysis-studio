# shared/localization

UI translation strings, one JSON file per locale, keyed identically
across locales so a missing key is easy to spot.

`en.json` is a starter with the handful of strings that exist today
(the UI currently has English hardcoded directly in
`frontend/desktop-ui/components/*.js`). Wiring real i18n is future
work — see root `ARCHITECTURE.md` → "Suggested improvements".

Add a new locale by copying `en.json` to e.g. `es.json` and
translating the values, then register it in
`shared/config/app.config.json`'s `supportedLocales`.
