import type { Poi } from '../lib/types.ts';

/**
 * Инфраструктура по маршруту (из голосового отзыва): узбекистанцы ездят на
 * своей машине, поэтому в дороге нужны заправки — отдельно метан и бензин,
 * а также туалет, намазхона, медпункт и кафе.
 *
 * ДЕМО-координаты рядом с объектами маршрута. В проде — слой карт партнёра.
 */
export const POIS: Poi[] = [
  // Самарканд
  { id: 'p1', kind: 'gas', fuel: 'methane', name: { uz: 'Metan quyish shoxobchasi', ru: 'Метановая заправка', en: 'Methane station' }, lat: 39.6702, lng: 66.9401, region: 'samarkand' },
  { id: 'p2', kind: 'gas', fuel: 'petrol', name: { uz: 'Benzin zapravkasi', ru: 'АЗС (бензин)', en: 'Petrol station' }, lat: 39.6489, lng: 66.9612, region: 'samarkand' },
  { id: 'p3', kind: 'prayer', name: { uz: 'Namozxona', ru: 'Молельная комната', en: 'Prayer room' }, lat: 39.6551, lng: 66.9749, region: 'samarkand' },
  { id: 'p4', kind: 'toilet', name: { uz: 'Hojatxona', ru: 'Туалет', en: 'Toilet' }, lat: 39.6559, lng: 66.9772, region: 'samarkand' },
  { id: 'p5', kind: 'cafe', name: { uz: 'Choyxona', ru: 'Чайхана', en: 'Teahouse' }, lat: 39.6598, lng: 66.9781, region: 'samarkand' },
  { id: 'p6', kind: 'clinic', name: { uz: 'Tez yordam punkti', ru: 'Медпункт', en: 'First aid point' }, lat: 39.6612, lng: 66.9702, region: 'samarkand' },

  // Бухара
  { id: 'p7', kind: 'gas', fuel: 'methane', name: { uz: 'Metan quyish shoxobchasi', ru: 'Метановая заправка', en: 'Methane station' }, lat: 39.7891, lng: 64.4302, region: 'bukhara' },
  { id: 'p8', kind: 'gas', fuel: 'petrol', name: { uz: 'Benzin zapravkasi', ru: 'АЗС (бензин)', en: 'Petrol station' }, lat: 39.7702, lng: 64.4021, region: 'bukhara' },
  { id: 'p9', kind: 'prayer', name: { uz: 'Namozxona', ru: 'Молельная комната', en: 'Prayer room' }, lat: 39.7761, lng: 64.4151, region: 'bukhara' },
  { id: 'p10', kind: 'toilet', name: { uz: 'Hojatxona', ru: 'Туалет', en: 'Toilet' }, lat: 39.7749, lng: 64.4189, region: 'bukhara' },
  { id: 'p11', kind: 'cafe', name: { uz: 'Choyxona', ru: 'Чайхана', en: 'Teahouse' }, lat: 39.7744, lng: 64.4201, region: 'bukhara' },

  // Хива
  { id: 'p12', kind: 'gas', fuel: 'methane', name: { uz: 'Metan quyish shoxobchasi', ru: 'Метановая заправка', en: 'Methane station' }, lat: 41.3901, lng: 60.3702, region: 'khiva' },
  { id: 'p13', kind: 'toilet', name: { uz: 'Hojatxona', ru: 'Туалет', en: 'Toilet' }, lat: 41.3779, lng: 60.3631, region: 'khiva' },
  { id: 'p14', kind: 'cafe', name: { uz: 'Milliy taomlar', ru: 'Кафе национальной кухни', en: 'National cuisine cafe' }, lat: 41.3771, lng: 60.3652, region: 'khiva' },

  // Ташкент
  { id: 'p15', kind: 'gas', fuel: 'petrol', name: { uz: 'Benzin zapravkasi', ru: 'АЗС (бензин)', en: 'Petrol station' }, lat: 41.3311, lng: 69.2452, region: 'tashkent' },
  { id: 'p16', kind: 'prayer', name: { uz: 'Namozxona', ru: 'Молельная комната', en: 'Prayer room' }, lat: 41.3285, lng: 69.2405, region: 'tashkent' },
  { id: 'p17', kind: 'clinic', name: { uz: 'Poliklinika', ru: 'Поликлиника', en: 'Clinic' }, lat: 41.3252, lng: 69.2381, region: 'tashkent' },
  { id: 'p18', kind: 'cafe', name: { uz: 'Choyxona', ru: 'Чайхана', en: 'Teahouse' }, lat: 41.3264, lng: 69.2359, region: 'tashkent' },

  // Трасса и дальние точки
  { id: 'p19', kind: 'gas', fuel: 'methane', name: { uz: 'Trassadagi metan shoxobchasi', ru: 'Метановая заправка на трассе', en: 'Highway methane station' }, lat: 40.2011, lng: 66.1502, region: 'nurata' },
  { id: 'p20', kind: 'toilet', name: { uz: 'Trassa hojatxonasi', ru: 'Туалет на трассе', en: 'Highway toilet' }, lat: 40.2015, lng: 66.1509, region: 'nurata' },
  { id: 'p21', kind: 'prayer', name: { uz: 'Namozxona', ru: 'Молельная комната', en: 'Prayer room' }, lat: 39.0612, lng: 66.8321, region: 'shakhrisabz' },
  { id: 'p22', kind: 'gas', fuel: 'petrol', name: { uz: 'Benzin zapravkasi', ru: 'АЗС (бензин)', en: 'Petrol station' }, lat: 39.0578, lng: 66.8402, region: 'shakhrisabz' },
];
