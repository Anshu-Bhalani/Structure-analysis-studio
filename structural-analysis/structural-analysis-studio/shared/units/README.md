# shared/units

Data tables for unit conversion — factors, symbols, and display
precision — as opposed to the conversion *logic*, which stays in
`core/utilities/UnitConverter.js`.

`unit-tables.json` is a starter covering the quantities the app
already displays (length, force, moment). As Grid/Plate/Shell/Solid
analysis land, extend it with pressure, stress, and distributed-load
units rather than hardcoding new factors inside
`core/utilities/UnitConverter.js`.

Suggested follow-up (see root `ARCHITECTURE.md`): have
`UnitConverter.js` read from this file instead of its current
internal literal table, so adding a unit is a data change, not a code
change.
