# 🍳 Apron — Trợ lý Bếp Thông minh & Lập Kế hoạch Bữa ăn

Apron là ứng dụng quản lý công thức nấu ăn, thực đơn tuần, tủ lạnh thông minh và danh sách đi chợ theo triết lý **Local-First & BYOS (Bring Your Own Storage)**. Ứng dụng hỗ trợ đa nền tảng (Desktop & Mobile) với kiến trúc Monorepo hiện đại.

---

## 🏛️ Kiến trúc Monorepo

Dự án được quản lý bằng `pnpm workspaces`:

```
apron/
├── apps/
│   ├── desktop/         # Ứng dụng Desktop (Tauri v2 + React 19 + HeroUI + TailwindCSS v4)
│   └── mobile/          # Ứng dụng Mobile (Capacitor + React 19 + HeroUI + TailwindCSS v4)
├── packages/
│   ├── core/            # Business Logic, DB Repositories, Zustand Stores, Parsers, Type Definitions
│   ├── ui/              # Design System, Shared UI Components (HeroUI / TailwindCSS)
│   └── eslint-config/   # Shared ESLint & Linter Configurations
└── .github/
    └── workflows/       # CI/CD Workflows (GitHub Actions)
```

### Điểm nổi bật về kiến trúc
- **Shared Zustand Stores (`@apron/core/store`)**: Toàn bộ 9 store nghiệp vụ (`useRecipeStore`, `useMealPlanStore`, `useShoppingListStore`, `usePantryStore`, `useTipStore`, `useCourseStore`, `useIngredientCatalogStore`, `useUnitStore`, `useSettingsStore`) được chia sẻ 100% giữa Desktop và Mobile, đảm bảo tính nhất quán và nguyên lý DRY.
- **Local-First & BYOS**: Dữ liệu lưu dưới dạng JSON và tệp tin đa phương tiện trong thư mục người dùng chọn hoặc App Data Dir, không phụ thuộc vào máy chủ trung gian.
- **Garbage Collection & Media Cleaner**: Tự động dọn dẹp ảnh mồ côi khi xoá công thức hoặc chạy thủ công qua mục Cài đặt.
- **Ảo hoá danh sách (Virtual List)**: Tích hợp `@tanstack/react-virtual` và `React.memo` giúp render mượt mà hàng ngàn công thức ở tốc độ 60 FPS.

---

## 🚀 Bắt đầu nhanh

### Yêu cầu hệ thống
- **Node.js**: `>= 18.0.0`
- **pnpm**: `>= 9.0.0`
- **Rust & C++ Build Tools** (nếu build Desktop với Tauri): [Hướng dẫn cài đặt Tauri v2](https://v2.tauri.app/start/prerequisites/)

### Cài đặt dependencies

```bash
pnpm install
```

### Chạy môi trường phát triển (Development)

```bash
# Chạy Desktop (web preview)
pnpm dev:desktop

# Chạy Desktop kèm Tauri native window
pnpm tauri:dev

# Chạy Mobile (web preview)
pnpm dev:mobile
```

### Kiểm tra mã nguồn (Lint & Typecheck)

```bash
# Kiểm tra linter toàn dự án (OxLint)
pnpm lint

# Kiểm tra kiểu dữ liệu TypeScript không sinh file
pnpm -r exec tsc --noEmit
```

### Chạy Unit Test

Kiểm thử tự động với Vitest cho `@apron/core`:

```bash
pnpm test
```

### Đóng gói ứng dụng (Build)

```bash
# Build desktop web assets
pnpm build:desktop

# Build mobile web assets
pnpm build:mobile

# Đóng gói bộ cài Desktop (.msi / .exe trên Windows, .dmg trên macOS)
pnpm tauri:build
```

---

## 🧪 Kiểm thử (Testing)

Bộ test case của `@apron/core` bao gồm:
- **`ingredientParser.test.ts`**: Phân loại tự động danh mục nguyên liệu (Rau củ, Thịt cá, Bơ sữa, Gia vị, Tinh bột) và phân tích chuỗi nguyên liệu (`parseIngredientLine`).
- **`recipeRepository.test.ts`**: Kiểm thử CRUD, sắp xếp ngày tạo, tạo slug tự động và cơ chế hook xoá ảnh đính kèm.
- **`useRecipeStore.test.ts`**: Kiểm thử cập nhật trạng thái store, thêm/sửa/xoá và cascade cập nhật/xoá nguyên liệu.
- **`useShoppingListStore.test.ts`**: Kiểm thử thêm món vào giỏ đi chợ, phân loại tự động và hoàn tất mục mua sắm.

---

## 🛡️ Bảo mật & Tối ưu hoá

- Sử dụng `pnpm.overrides` để vá các lỗ hổng bảo mật được cảnh báo trong `dompurify`, `vite`, `prosemirror-view`.
- Sử dụng OxLint siêu nhanh và quy chuẩn ESLint cho toàn bộ codebase.
- Áp dụng `React.memo` và virtualization giảm thiểu tối đa tình trạng re-render và DOM overhead.

---

## 📄 Bản quyền

Dự án thuộc bản quyền phát triển Apron Team.
