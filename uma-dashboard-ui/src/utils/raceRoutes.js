export function getRaceRouteFromPath(pathname) {
  const match = pathname.match(/^\/dashboard\/races\/([^/]+)\/?$/);
  if (!match) return null;
  try {
    return { id: decodeURIComponent(match[1]) };
  } catch {
    return { id: match[1] };
  }
}

export function getRaceDetailPath(raceId) {
  return `/dashboard/races/${encodeURIComponent(raceId)}`;
}
