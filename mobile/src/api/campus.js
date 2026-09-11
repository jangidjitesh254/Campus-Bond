import { BASE_URL } from './client';

/**
 * The 3D campus map is a static bundle per campus on the API server:
 * /campus/<id>/index.html (the scene), campus.json (layout), photos/, videos/.
 * VGU is the first campus; a second one is another folder with the same shape.
 */
export const DEFAULT_CAMPUS = 'vgu';

export const campusUrl = (id = DEFAULT_CAMPUS) => `${BASE_URL}/campus/${id}/`;
export const campusAsset = (rel, id = DEFAULT_CAMPUS) => `${campusUrl(id)}${rel}`;
export const campusPhoto = (name, id = DEFAULT_CAMPUS) => campusAsset(`photos/${name}.jpg`, id);
export const campusThumb = (name, id = DEFAULT_CAMPUS) => campusAsset(`photos/${name}.thumb.jpg`, id);

export const CampusApi = {
  layout: (id = DEFAULT_CAMPUS) =>
    fetch(`${campusUrl(id)}campus.json?v=${Date.now()}`).then((r) => {
      if (!r.ok) throw new Error('Campus layout not available.');
      return r.json();
    }),
};

export const CATEGORY_ION = {
  academic: 'school-outline',
  admin: 'business-outline',
  food: 'restaurant-outline',
  parking: 'car-outline',
  sports: 'football-outline',
  outdoor: 'leaf-outline',
};

/** Rough walking time — 1.3 m/s, rounded up to the minute. */
export function walkMinutes(metres) {
  return Math.max(1, Math.ceil(metres / 1.3 / 60));
}
