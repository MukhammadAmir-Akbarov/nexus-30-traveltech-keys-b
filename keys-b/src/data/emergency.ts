import type { I18nText } from '../lib/types.ts';

/**
 * Экстренные номера Узбекистана.
 *
 * Те же, что в абзаце корпуса c62 — не выдуманные и не «примерно такие».
 * Лежат отдельным файлом, потому что в беде человек не должен ничего
 * запрашивать: карточка приходит вместе со страницей и работает офлайн.
 */
export const EMERGENCY: {
  number: string;
  label: I18nText;
  icon: 'alert' | 'shield' | 'clinic';
}[] = [
  {
    number: '112',
    label: { uz: 'Yagona favqulodda raqam', ru: 'Единый экстренный', en: 'Single emergency line' },
    icon: 'alert',
  },
  {
    number: '102',
    label: { uz: 'Militsiya', ru: 'Милиция', en: 'Police' },
    icon: 'shield',
  },
  {
    number: '103',
    label: { uz: 'Tez yordam', ru: 'Скорая помощь', en: 'Ambulance' },
    icon: 'clinic',
  },
];
