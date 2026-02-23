import { getSheetData } from '../sheets';

export function handleGetCategories(): Category[] {
  const rows = getSheetData('categories');
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description || null,
  }));
}
