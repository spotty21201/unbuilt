# Development calculations and data preparation

Terrain, drainage and phasing is an initial screening workbench. Enter actual supporting data before interpreting a site-specific result. All three studies are independent; missing or inapplicable data withholds its calculation. Examples are explicitly fictional.

## Prepare an elevation grid

Use local x/y metres in the same origin and orientation as the plan, plus z metres in one stated vertical datum. Supply a source, observation date and declared basis. Export a complete Cartesian grid to UTF-8 CSV, for example this **fictional** four-corner plane:

```csv
x,y,z
0,0,100
120,0,101.2
0,100,102
120,100,103.2
```

The tool accepts up to 20 unique x and y coordinates and 400 levels; repeated x/y pairs or missing grid combinations refuse. The grid must cover the actual boundary for terrain results. It does not interpret global coordinates or convert datums/units. Irregular spot surveys need appropriate external preparation; invented gap-filling would misrepresent their resolution.

Each cell uses a declared SW–NE diagonal. For each triangle, solve `z = a + gx*x + gy*y`; gradient magnitude gives slope `100 * sqrt(gx² + gy²)` percent. The clipped area weights the mean; individual face gradients remain distinct. Min/max use the clipped vertices, so elevations outside the site cannot inflate its range. Surface precision and diagonal choice are modeling assumptions. Piecewise planar triangular surfaces and consistent coordinates/vertical units are standard elevation representations. See the [USGS elevation-model overview](https://pubs.usgs.gov/of/2007/1130/ofr_2007_1130.pdf) and [slope definition and gradient equations](https://doc.esri.com/en/arcgis-pro/latest/tool-reference/spatial-analyst/how-slope-works.html). This tool uses its stated triangle method, not that reference's raster estimator.

The optional platform is one horizontal level over the whole site. Clip every surface facet where `z - platform = 0`. Integrate positive cut and negative fill separately using triangle area times average vertex height. For a 10×10 m plane `z=x` and platform 5 m, exact cut is 125 m³ and fill is 125 m³. This is gross geometric volume, without earth material factors or priced works.

## Storm and runoff screening

Supply a relevant local source for rainfall intensity, its averaging duration and return period, runoff coefficients and concentration time. Those values are entered assumptions; the app does not select an applicable storm, delineate a catchment or assess soils. Declare whole-site contribution and absence of significant storage before using this method.

With area in square metres and intensity in millimetres/hour, `Q = I * Σ(C_i*A_i) / 3,600,000` gives cubic metres/second. Measured home footprints, unioned street surface, designed green and remaining land form non-overlapping area categories. Each receives an entered C. Storm duration must reach the entered time of concentration.

The Rational method estimates a peak for a small catchment under its assumptions; it does not supply a time series or runoff volume. Storage and downstream hydraulics need additional modeling. These limits inform the tool's applicability declarations and its 80 ha cap. See the [Rational method and limitations](https://www.txdot.gov/content/txdotoms/us/en/manuals/des/hyd/chapter-4--hydrology/section-12--rational-method.html). That reference does not establish the local standards for this project.

Gross rainfall volume is simply site area times entered rainfall depth, before losses. It is not the Rational runoff volume and cannot size detention. An outfall capacity is a user-declared comparison only; an apparent capacity margin does not establish a drainage network or a permitted discharge.

## Monthly phase accounting

For phase k, use assigned occupied-home footprints and the accepted construction rate:

`home_budget_k = assigned_built_area_k * construction_rate * (1 + contingency)`

`shared_budget = accepted_non_land_cost - accepted_home_cost * (1 + contingency)`

`phase_non_land_k = home_budget_k + shared_budget * entered_share_k`

Shares must total 1. Each home is assigned once, using its stable lot reference. Changing home templates remeasures its construction budget; replacing/removing lots invalidates affected assignments instead of redistributing them.

Spread each phase's non-land cost evenly over its build months. Put its home sales at the declared shared home price in the entered sales month, alongside the accepted selling-cost fraction. Pay the owner benchmark once. Sum receipts minus those three spending categories. Cumulative cash begins at zero. Its most negative month-end balance is the reported deficit; final cumulative cash reconciles to accepted surplus. Totals use unrounded inputs; tables round for display.

This is undiscounted accounting of accepted assumptions, not a lending or investment model. Cash within a month and infrastructure readiness per phase are not modeled. Earthworks/drainage quantities do not silently become costs: approved budgets belong in the existing cost review.
