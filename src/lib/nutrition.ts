// Base de datos simple de alimentos comunes (valores por 100g)
export const FOOD_DB: Record<string, { baseCalories: number; baseProtein: number; baseCarbs: number; baseFat: number; baseSugar: number }> = {
   "avena": { baseCalories: 389, baseProtein: 16.9, baseCarbs: 66, baseFat: 6.9, baseSugar: 0.9 },
   "bowl de avena": { baseCalories: 350, baseProtein: 12, baseCarbs: 55, baseFat: 8, baseSugar: 15 },
   "pollo": { baseCalories: 165, baseProtein: 31, baseCarbs: 0, baseFat: 3.6, baseSugar: 0 },
   "pechuga de pollo": { baseCalories: 165, baseProtein: 31, baseCarbs: 0, baseFat: 3.6, baseSugar: 0 },
   "arroz": { baseCalories: 130, baseProtein: 2.7, baseCarbs: 28, baseFat: 0.3, baseSugar: 0.1 },
   "arroz blanco": { baseCalories: 130, baseProtein: 2.7, baseCarbs: 28, baseFat: 0.3, baseSugar: 0.1 },
   "huevo": { baseCalories: 155, baseProtein: 13, baseCarbs: 1.1, baseFat: 11, baseSugar: 1.1 },
   "huevos": { baseCalories: 155, baseProtein: 13, baseCarbs: 1.1, baseFat: 11, baseSugar: 1.1 },
   "pan": { baseCalories: 265, baseProtein: 9, baseCarbs: 49, baseFat: 3.2, baseSugar: 5 },
   "manzana": { baseCalories: 52, baseProtein: 0.3, baseCarbs: 14, baseFat: 0.2, baseSugar: 10 },
   "plátano": { baseCalories: 89, baseProtein: 1.1, baseCarbs: 23, baseFat: 0.3, baseSugar: 12 },
   "banana": { baseCalories: 89, baseProtein: 1.1, baseCarbs: 23, baseFat: 0.3, baseSugar: 12 },
   "salmon": { baseCalories: 208, baseProtein: 20, baseCarbs: 0, baseFat: 13, baseSugar: 0 },
   "salmón": { baseCalories: 208, baseProtein: 20, baseCarbs: 0, baseFat: 13, baseSugar: 0 },
   "atun": { baseCalories: 132, baseProtein: 28, baseCarbs: 0, baseFat: 1, baseSugar: 0 },
   "atún": { baseCalories: 132, baseProtein: 28, baseCarbs: 0, baseFat: 1, baseSugar: 0 },
   "yogur": { baseCalories: 59, baseProtein: 10, baseCarbs: 3.6, baseFat: 0.4, baseSugar: 3.2 },
   "yogurt": { baseCalories: 59, baseProtein: 10, baseCarbs: 3.6, baseFat: 0.4, baseSugar: 3.2 },
   "brocoli": { baseCalories: 34, baseProtein: 2.8, baseCarbs: 7, baseFat: 0.4, baseSugar: 1.7 },
   "brócoli": { baseCalories: 34, baseProtein: 2.8, baseCarbs: 7, baseFat: 0.4, baseSugar: 1.7 },
   "espinaca": { baseCalories: 23, baseProtein: 2.9, baseCarbs: 3.6, baseFat: 0.4, baseSugar: 0.4 },
   "pasta": { baseCalories: 131, baseProtein: 5, baseCarbs: 25, baseFat: 1.1, baseSugar: 0.6 },
   "papa": { baseCalories: 77, baseProtein: 2, baseCarbs: 17, baseFat: 0.1, baseSugar: 0.8 },
   "patata": { baseCalories: 77, baseProtein: 2, baseCarbs: 17, baseFat: 0.1, baseSugar: 0.8 },
   "queso": { baseCalories: 402, baseProtein: 25, baseCarbs: 1.3, baseFat: 33, baseSugar: 0.5 },
   "leche": { baseCalories: 42, baseProtein: 3.4, baseCarbs: 5, baseFat: 1, baseSugar: 5 },
   "aceite de oliva": { baseCalories: 884, baseProtein: 0, baseCarbs: 0, baseFat: 100, baseSugar: 0 },
   "aceite": { baseCalories: 884, baseProtein: 0, baseCarbs: 0, baseFat: 100, baseSugar: 0 },
   "almendra": { baseCalories: 579, baseProtein: 21, baseCarbs: 22, baseFat: 50, baseSugar: 4.4 },
   "almendras": { baseCalories: 579, baseProtein: 21, baseCarbs: 22, baseFat: 50, baseSugar: 4.4 },
   "fresa": { baseCalories: 32, baseProtein: 0.7, baseCarbs: 7.7, baseFat: 0.3, baseSugar: 4.9 },
   "fresas": { baseCalories: 32, baseProtein: 0.7, baseCarbs: 7.7, baseFat: 0.3, baseSugar: 4.9 },
   "aguacate": { baseCalories: 160, baseProtein: 2, baseCarbs: 8.5, baseFat: 15, baseSugar: 0.7 },
   "palta": { baseCalories: 160, baseProtein: 2, baseCarbs: 8.5, baseFat: 15, baseSugar: 0.7 },
   "tomate": { baseCalories: 18, baseProtein: 0.9, baseCarbs: 3.9, baseFat: 0.2, baseSugar: 2.6 },
   "zanahoria": { baseCalories: 41, baseProtein: 0.9, baseCarbs: 9.6, baseFat: 0.2, baseSugar: 4.7 },
   "carne": { baseCalories: 250, baseProtein: 26, baseCarbs: 0, baseFat: 17, baseSugar: 0 },
   "res": { baseCalories: 250, baseProtein: 26, baseCarbs: 0, baseFat: 17, baseSugar: 0 },
   "cerdo": { baseCalories: 242, baseProtein: 27, baseCarbs: 0, baseFat: 14, baseSugar: 0 },
   "pavo": { baseCalories: 135, baseProtein: 30, baseCarbs: 0, baseFat: 1, baseSugar: 0 },
   "tofu": { baseCalories: 76, baseProtein: 8, baseCarbs: 1.9, baseFat: 4.8, baseSugar: 0.3 },
   "lentejas": { baseCalories: 116, baseProtein: 9, baseCarbs: 20, baseFat: 0.4, baseSugar: 1.8 },
   "garbanzos": { baseCalories: 164, baseProtein: 8.9, baseCarbs: 27, baseFat: 2.6, baseSugar: 4.8 },
   "ensalada": { baseCalories: 33, baseProtein: 2.9, baseCarbs: 5, baseFat: 0.5, baseSugar: 2.5 },
   "batata": { baseCalories: 86, baseProtein: 1.6, baseCarbs: 20, baseFat: 0.1, baseSugar: 4.2 },
   "miel": { baseCalories: 304, baseProtein: 0.3, baseCarbs: 82, baseFat: 0, baseSugar: 82 },
   "chocolate": { baseCalories: 546, baseProtein: 4.9, baseCarbs: 61, baseFat: 31, baseSugar: 48 },
   "cafe": { baseCalories: 2, baseProtein: 0.1, baseCarbs: 0, baseFat: 0, baseSugar: 0 },
   "café": { baseCalories: 2, baseProtein: 0.1, baseCarbs: 0, baseFat: 0, baseSugar: 0 },
};

export function estimateMacros(input: string) {
   const lower = input.toLowerCase().trim();
   
   // Buscar coincidencia exacta o parcial
   let match = FOOD_DB[lower];
   if (!match) {
      const key = Object.keys(FOOD_DB).find(k => lower.includes(k));
      if (key) match = FOOD_DB[key];
   }
   
   if (match) {
      return { ...match, confidence: "high" as const };
   }
   
   // Estimación por palabras clave si no hay match
   const isProtein = /pollo|carne|pescado|atun|atún|salmon|salmón|huevo|huevos|pavo|queso|tofu|lentejas|garbanzos/.test(lower);
   const isCarb = /arroz|pasta|pan|avena|papa|patata|batata|miel|chocolate/.test(lower);
   const isVeggie = /ensalada|tomate|lechuga|espinaca|brocoli|brócoli|zanahoria|fresa|fresas|manzana|platano|banana|palta|aguacate/.test(lower);
   const isFat = /aceite|almendra|almendras|mantequilla|aguacate|palta|salmon|salmón/.test(lower);
   
   if (isProtein) {
      return { baseCalories: 180, baseProtein: 22, baseCarbs: 2, baseFat: 8, baseSugar: 1, confidence: "medium" as const };
   }
   if (isCarb) {
      return { baseCalories: 220, baseProtein: 5, baseCarbs: 40, baseFat: 3, baseSugar: 8, confidence: "medium" as const };
   }
   if (isVeggie) {
      return { baseCalories: 50, baseProtein: 2, baseCarbs: 10, baseFat: 0.5, baseSugar: 5, confidence: "medium" as const };
   }
   if (isFat) {
      return { baseCalories: 300, baseProtein: 5, baseCarbs: 5, baseFat: 25, baseSugar: 2, confidence: "medium" as const };
   }
   
   // Fallback genérico
   return { baseCalories: 180, baseProtein: 8, baseCarbs: 20, baseFat: 7, baseSugar: 4, confidence: "low" as const };
}
