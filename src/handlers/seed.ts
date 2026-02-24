import { getSpreadsheet } from '../sheets';
import categoriesData from '../../content/categories.json';
import scenariosData from '../../content/scenarios.json';

export function handleSeedSpreadsheet(): { categories: number; scenarios: number } {
  const ss = getSpreadsheet();

  // Seed categories
  const catHeaders = ['id', 'name', 'description'];
  let catSheet = ss.getSheetByName('categories');
  if (!catSheet) {
    catSheet = ss.insertSheet('categories');
  }
  catSheet.clear();
  catSheet.appendRow(catHeaders);
  for (const cat of categoriesData) {
    catSheet.appendRow([cat.id, cat.name, cat.description]);
  }

  // Seed scenarios
  const scHeaders = [
    'id', 'category_id', 'char_name', 'char_role', 'char_avatar',
    'situation', 'dialogue', 'reference', 'is_violation', 'explanation', 'status',
  ];
  let scSheet = ss.getSheetByName('scenarios');
  if (!scSheet) {
    scSheet = ss.insertSheet('scenarios');
  }
  scSheet.clear();
  scSheet.appendRow(scHeaders);
  for (const sc of scenariosData) {
    scSheet.appendRow([
      sc.id, sc.category_id, sc.char_name, sc.char_role, sc.char_avatar,
      sc.situation, sc.dialogue, sc.reference, sc.is_violation, sc.explanation, sc.status,
    ]);
  }

  return { categories: categoriesData.length, scenarios: scenariosData.length };
}
