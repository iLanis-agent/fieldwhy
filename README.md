# FieldWhy

Enter a line and an awk `FS`; see how it is split into fields, and what field or NF assignment does to `$0`.

- `app.html` tool, `index.html` landing, `engine.js` splitter (gawk semantics, no dependencies)
- `test-engine.js`: `node test-engine.js SEED LINES_PER_FS` compares with gawk and mawk (needs both installed)

Tests: GNU awk 5.1.0, 198,000 random lines x 4 programs (split, `$1=$1`, `$(NF+2)="X"`, `NF=2`) over 33 FS values = 792,000 comparisons, 0 mismatches. mawk 1.3.4: 413,148 ASCII comparisons, 0 mismatches (mawk is byte-based, so non-ASCII lines are excluded). Alternation in FS (`a|ab`) is not matched exactly: awk takes the longest match, the engine the first alternative (3,845 of 120,000 such comparisons differ; the app warns).
Not covered: RS, FPAT, FIELDWIDTHS, -Ft, IGNORECASE, FS regexes that match the empty string.
