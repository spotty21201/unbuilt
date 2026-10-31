# Unbuilt — angled streets and corner fillets

Authorized by the owner's request to round turning roads and support angles other than 90°. This extends editable streets without renumbering the owner's roadmap. Preserve all earlier work, tester assignments and independent-review evidence.

Open **Circulation → Edit street network**. **Any angle** drawing connects each picked/typed point directly; **Right angles** retains the earlier automatic bend. Typed coordinates retain decimals, including projection onto an angled segment. Crossings join at grade and split into shared editable nodes. Existing horizontal/vertical components retain their row/column editing behavior. Angled legs move with attached junctions. Widths remain 6–12 m, as entered planning assumptions.

**Corner fillet radius (m)** accepts 0–50 m. **Round corners · 4 m** is a convenient starting value. Zero keeps square corners; saved legacy networks remain unchanged until explicitly edited. Drafts show the full pavement outline, quantities and blockers. Apply accepts one plan-history step; Cancel retains accepted work. Draft Undo/Redo, plan history, local/project save, export/import, saved alternatives, search, feasibility and measured AI cost proposals preserve angles and radius.

## Measured geometry

The shared road-surface engine offsets every straight centreline by half its declared width, closes outside bend wedges at offset-kerb intersections, and unions the pavement before measuring it. Extreme hairpins whose miter exceeds four times the larger half-width use a bevel. Circular fillets replace pavement-outline corners, including inside junction kerbs. Entrance and terminal cross-sections retain their full width.

For a corner with included angle α and entered radius R, the tangent distance is R / tan(α/2). Limit it to 45% of each adjacent boundary edge; the effective radius is that distance × tan(α/2). This avoids adjacent fillets crossing on short kerbs. The editor reports how many corners were limited and the smallest effective radius. The entered radius is a kerb parameter, not a guaranteed centreline radius or a vehicle turning standard.

Curves are polygonized with maximum 0.005 m chord deviation. Unioned polygons, including holes, drive the actual drawing, road area, costs, drainage surface area, containment, open-space/clearance conflicts, lot conflicts and frontage. No arc area is claimed as mathematically exact: quantities measure this same bounded polygon approximation. Crossings/overlaps count once. Entrance-apron area remains separate and pavement/apron overlap is refused.

Use `polygon-clipping` 0.15.7 for polygon union, pinned in the root lockfile. Its [primary documentation](https://github.com/mfogel/polygon-clipping) specifies polygon/multipolygon operations with holes. Install both workspaces from the repository root using `npm ci` and `npm ci --prefix web` before tests/build/service. No external geometry service or paid call is involved.

## Lot and engineering scope

Whole rectangular lots continue to generate along horizontal/vertical street legs. The curved/angled pavement filters their overlap and measures their actual shared frontage. Land beside angled legs remains explicitly unallocated; this release does not generate rotated or curved frontage parcels. Manual lots, reshapes and housing assignments remain held under existing conflict/review protections.

Road width, kerb radii and entered costs are planning assumptions. Vehicle swept paths, minimum turning compliance, vertical alignment, superelevation, traffic, downstream drainage design and legal external access need separate supporting data and qualified review. Drainage screening uses the updated measured pavement area but does not design kerb drainage.

## Data and verification

Street networks add optional `cornerRadius`; straight segments now accept any bearing. Advanced networks require project v14, decision record v15, and snapshot v12 plus `angled-rounded-streets`. A saved advanced alternative also upgrades the outer project/record envelope even when the working plan is legacy. Disguised older envelopes are refused. Older supported files and their original square geometry remain readable.

Verify analytical segment widths/areas, crossing union, bend closure and circular-filleting tolerance; holes, reduced radii, false bounding-box conflicts, boundary/park/held-lot protection, frontage, reconciled land/cost/drainage quantities, persistence/downgrade guards, AI binding and held road search. Exercise the actual browser drawing, keyboard edits, review/history, scheme comparison/reopen, costs/export/service, accessibility semantics and narrow/native-zoom controls. Evidence and remaining human/professional checks belong in `evidence/angled-rounded-streets/`.
