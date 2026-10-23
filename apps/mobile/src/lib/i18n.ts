import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
  en: {
    translation: {
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
      "Local Device": "Local Device",
      "Settings & Sync": "Settings & Sync",
      "Import Data": "Import Data",
      "Export Data": "Export Data",
      "Settings": "Settings",
      "Appearance": "Appearance",
      "Language": "Language",
      "Light": "Light",
      "Dark": "Dark",
      "System": "System",
      "Close": "Close"
    }
  },
  vi: {
    translation: {
      "Home": "Trang chủ",
      "Saved": "Đã lưu",
      "Shopping List": "Đi chợ",
      "Menus": "Danh mục",
      "Courses": "Khóa học",
      "Smart Fridge": "Dọn tủ lạnh",
      "Meal Planner": "Lên kế hoạch",
      "Tips": "Mẹo nhà bếp",
      "Units": "Đơn vị tính",
      "Add Recipe": "Thêm Công Thức",
      "Local Device": "Thiết bị cục bộ",
      "Settings & Sync": "Cài đặt & Đồng bộ",
      "Import Data": "Nhập dữ liệu (JSON)",
      "Export Data": "Sao lưu dữ liệu",
      "Settings": "Cài đặt",
      "Appearance": "Giao diện",
      "Language": "Ngôn ngữ",
      "Light": "Sáng",
      "Dark": "Tối",
      "System": "Hệ thống",
      "Close": "Đóng"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
