# shared/constants

Physical and engineering constants that are true regardless of which
layer is asking — as opposed to `core/config/Config.js`, which holds
this-app's-default-values (not universal constants).

`engineering-constants.js` is a starter. As new analysis types are
added (Truss, Frame 3D, Grid, Plate, Shell, Solid), add their
governing constants here rather than inlining magic numbers inside
`core/analysis-elements/*` or `core/solver/*`.
