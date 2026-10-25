import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { defaultI18nResources } from '@apron/core';

// Legacy flat keys for backward compatibility
const legacyEn = {
  "Home": "Home",
  "Saved": "Saved",
  "Shopping List": "Shopping List",
  "Menus": "Menus",
  "Courses": "Courses",
  "Smart Fridge": "Smart Fridge",
  "Meal Planner": "Meal Planner",
  "Tips": "Tips",
  "Units": "Units",
  "Add Recipe": "Add Recipe",
  "Local Device": "Local Storage",
  "Settings & Sync": "Settings & Sync",
  "Import Data": "Import Data",
  "Export Data": "Export Data",
  "Settings": "Settings",
  "Appearance": "Appearance",
  "Language": "Language",
  "Light": "Light",
  "Dark": "Dark",
  "System": "System",
  "Close": "Close",
};

const legacyVi = {
  "Home": "Trang chủ",
  "Saved": "Đã lưu",
  "Shopping List": "Đi chợ",
  "Menus": "Danh mục",
  "Courses": "Khóa học",
  "Smart Fridge": "Tủ lạnh thông minh",
  "Meal Planner": "Lên kế hoạch",
  "Tips": "Mẹo nhà bếp",
  "Units": "Đơn vị tính",
  "Add Recipe": "Thêm Công Thức",
  "Local Device": "Bộ nhớ máy",
  "Settings & Sync": "Cài đặt & Đồng bộ",
  "Import Data": "Nhập dữ liệu (JSON)",
  "Export Data": "Sao lưu dữ liệu",
  "Settings": "Cài đặt",
  "Appearance": "Giao diện",
  "Language": "Ngôn ngữ",
  "Light": "Sáng",
  "Dark": "Tối",
  "System": "Hệ thống",
  "Close": "Đóng",
};

const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('app_language') || 'vi' : 'vi';

const resources = {
  en: {
    translation: {
      ...legacyEn,
      ...defaultI18nResources.en.translation,
    },
  },
  vi: {
    translation: {
      ...legacyVi,
      ...defaultI18nResources.vi.translation,
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('app_language', lng);
  }
});

export default i18n;
