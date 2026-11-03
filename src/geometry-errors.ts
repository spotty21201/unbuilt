export function isPolygonOverlayError(error:unknown):error is Error {
  return error instanceof Error&&(/SweepLine|segment #|output ring/.test(error.message)||error instanceof RangeError&&/isExteriorRing|enclosingRing/.test(error.stack??''));
}
export function geometryRecoveryMessage(error:unknown):string {
  return isPolygonOverlayError(error)?'Road/polygon calculation could not finish near a curve or junction. Accepted geometry and quantities are preserved. Review the last road edit and its radii, or cancel this preview.':error instanceof Error?error.message:String(error);
}
