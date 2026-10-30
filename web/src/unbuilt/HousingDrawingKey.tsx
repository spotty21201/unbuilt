import type {PlanningParameters} from '../../../src/planning';
import type {PlanContents} from '../../../src/contents';
import {hasHome} from '../../../src/contents';
import type {Rect} from '../../../src/schema';
import {assignmentSource,homeTemplate,housingSummary} from '../../../src/housing';
export default function HousingDrawingKey(p:{planning?:PlanningParameters;contents?:PlanContents;lots:Rect[];selectedLot:number|null}){
  if(!p.planning?.housing)return null;
  const r=p.selectedLot===null?null:p.lots[p.selectedLot],t=r?homeTemplate(p.planning,r):null,mix=housingSummary(p,p.lots);
  return <section className="drawing-housing-key" aria-label="Home designs on drawing">
    <p aria-live="polite">{r&&t?`Lot ${p.selectedLot!+1} · T${t.id.slice(1)} ${t.name} · ${t.width*t.depth} m² · ${assignmentSource(p.planning.housing,r)==='explicit'?'Explicit assignment':'Follows default'}${hasHome(p,r)?'':' · vacant reservation'}`:'Select a lot to identify its home design.'}</p>
    <details><summary>Home designs · {mix.rows.length} templates</summary><ul>{mix.rows.map(row=><li key={row.id}>T{row.id.slice(1)} · {row.name} · {row.width*row.depth} m²/home · {row.count} home{row.count===1?'':'s'}</li>)}</ul><p>{mix.homes} homes · {mix.builtArea.toLocaleString('en-US')} m² built · {mix.vacant} vacant lots. This schedule describes the drawing.</p></details>
  </section>;
}
