import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/utils/translations';

export const useTranslation = () => {
  const { language } = useLanguage();

  return (key: Parameters<typeof getTranslation>[1]) => {
    return getTranslation(language, key);
  };
};
