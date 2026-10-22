# Called from other skills

`sw-verify-feature` invokes this skill once, before spawning, and passes the
table to its verifiers as `args`; one run standalone invokes it itself. A
caller passes no arguments and reads the printed table, never re-running it.

`sw-design-requirements`, `sw-design-solution` and `sw-implement-feature` do
**not** invoke it: each probes only what its own run uses and stops naming
`sw-setup` when one is missing. A full table is the price of surveying an
environment, not of one run's prerequisites — so this skill stays the one place
it is surveyed and fixed, run up front.
