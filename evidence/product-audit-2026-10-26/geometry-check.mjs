import { cedarMarket, generateSpine, validateLayout, placeFootprint } from '../../src/geometry.ts';
import { polysOverlap, polyOverlapsRect, isSimple, polyArea } from '../../src/polygon.ts';
const site = cedarMarket();
const layout = generateSpine(site, 10);
const p = layout.parcels[0];
const both = [{x:p.x,y:p.y},{x:p.x+20,y:p.y},{x:p.x+20,y:p.y+p.h},{x:p.x,y:p.y+p.h}];
const inset = [{x:p.x+1,y:p.y},{x:p.x+10,y:p.y},{x:p.x+10,y:p.y+p.h},{x:p.x+1,y:p.y+p.h}];
const nonfinite = [{x:NaN,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}];
console.log(JSON.stringify({parcel:p,footprint:placeFootprint(p),samePolygonOverlap:polysOverlap(both,both),sameRectangleOverlap:polyOverlapsRect(both,{x:p.x,y:p.y,w:20,h:p.h}),duplicateLotErrors:validateLayout(site,layout,new Map([[0,both],[1,both]])),insetSetbackErrors:validateLayout(site,layout,new Map([[0,inset]])),nonfiniteSimple:isSimple(nonfinite),nonfiniteAreaIsNaN:Number.isNaN(polyArea(nonfinite))},null,2));
