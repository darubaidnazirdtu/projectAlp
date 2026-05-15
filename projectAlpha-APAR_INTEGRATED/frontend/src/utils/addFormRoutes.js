import { resources } from '../config/tableConfig.js';

const normalizePath = (path) => {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
};

export const formRoutes = resources
  .filter((resource) => Boolean(resource.addPath))
  .map((resource) => ({
    id: resource.id,
    label: resource.addLabel || `Add ${resource.title}`,
    path: normalizePath(resource.addPath),
    category: resource.category || 'Forms',
    keywords: resource.keywords || []
  }));

export const getFormRouteByPath = (path) => {
  const normalized = normalizePath(path);
  return formRoutes.find((route) => route.path === normalized) || null;
};

export default formRoutes;
