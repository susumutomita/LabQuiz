import categoriesData from '../../content/categories.json';

export function handleGetCategories(): Category[] {
  return categoriesData.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description || null,
  }));
}
