# Danh sách Components trong Apron App

Dưới đây là thống kê toàn bộ các trang, modal, popover và combobox (autocomplete) hiện đang được sử dụng trong hệ thống.

## 1. Các trang (Pages)

Được cấu hình trong bộ định tuyến (router) của ứng dụng:

- **DashboardPage** (`/`) - Trang chủ/Bảng điều khiển
- **RecipeListPage** (`/recipes`) - Danh sách công thức
- **NewRecipePage** (`/recipes/new`) - Tạo công thức mới
- **RecipeDetailPage** (`/recipes/:id`) - Chi tiết công thức
- **SavedRecipesPage** (`/saved`) - Danh sách công thức đã lưu
- **MealPlannerPage** (`/meal-planner`) - Lên thực đơn ăn uống
- **ShoppingListPage** (`/shopping-list`) - Danh sách đi chợ
- **SmartFridgePage** (`/smart-fridge`) - Quản lý tủ lạnh thông minh
- **IngredientCatalogPage** (`/catalog`) - Từ điển/Danh mục nguyên liệu
- **TipListPage** (`/tips`) - Danh sách mẹo vặt nhà bếp
- **TipDetailPage** (`/tips/:id`) - Xem chi tiết mẹo vặt
- **CoursesPage** (`/courses`) - Danh sách khoá học
- **CourseDetailPage** (`/courses/:id`) - Xem chi tiết khoá học
- **CourseFormPage** (`/courses/add`, `/courses/edit/:id`) - Thêm hoặc sửa khoá học
- **UnitsPage** (`/units`) - Quản lý đơn vị đo lường
- **DesignSystemPage** (`/design-system`) - UI Kit/Hệ thống thiết kế nội bộ

## 2. Modals (Hộp thoại)

- **TipFormModal** (`src/pages/tips/components/TipFormModal.tsx`) - Thêm/sửa mẹo vặt.
- **TagSelectModal** (`src/pages/recipes/components/TagSelectModal.tsx`) - Chọn tag cho công thức.
- **ParentRecipeSelectModal** (`src/pages/recipes/components/ParentRecipeSelectModal.tsx`) - Chọn công thức cha (nếu là biến thể).
- **MealPlannerSelectModal** (`src/pages/recipes/components/MealPlannerSelectModal.tsx`) - Chọn thực đơn để thêm công thức vào.
- **IngredientFormModal** (nằm trong `IngredientCatalogPage.tsx`) - Form thêm/sửa nguyên liệu.
- **NewRecipeModal** (nằm trong `CourseFormPage.tsx`) - Tạo công thức nhanh từ màn hình tạo khoá học.
- **SettingsModal** (`src/components/settings/SettingsModal.tsx`) - Cài đặt cấu hình ứng dụng.
- **RecipeSnapshotModal** (`src/components/recipes/RecipeSnapshotModal.tsx`) - Xem nhanh ảnh/nội dung công thức.
- **AiAssistModal** (`src/components/recipes/form/AiAssistModal.tsx`) - Modal trợ lý AI sinh công thức.
- **ImagePickerModal** (`src/components/recipes/form/ImagePickerModal.tsx`) - Thư viện ảnh để upload/chọn ảnh.
- **CookingRatingModal** (`src/components/recipes/CookingRatingModal.tsx`) - Form đánh giá và review món ăn sau khi nấu.
- **CookingModeModal** (`src/components/recipes/CookingModeModal.tsx`) - Chế độ hướng dẫn nấu ăn toàn màn hình.

## 3. Popovers & Dropdowns (Khung nổi)

- **IconPicker** (`src/components/shared/IconPicker.tsx`) - Chọn icon cho danh mục/chương học.
- **HierarchicalTagSelect** (`src/components/recipes/form/HierarchicalTagSelect.tsx`) - Chọn thẻ tag phân cấp (dạng cây).
- **TipCard Dropdown** (`src/components/tips/TipCard.tsx`) - Menu tuỳ chọn (Sửa/Xoá) trên card mẹo vặt.
- **SidebarProfile Dropdown** (`src/components/layout/sidebar/SidebarProfile.tsx`) - Menu người dùng nằm ở Sidebar (Theme, Settings).

## 4. Comboboxes & Autocompletes (Tìm kiếm & Chọn lọc)

- **Thêm nguyên liệu tủ lạnh** (`src/pages/smart-fridge/SmartFridgePage.tsx`) - Tìm kiếm và thêm nguyên liệu vào tủ lạnh.
- **Chọn công thức bài học** (`src/pages/courses/CourseFormPage.tsx`) - Tìm kiếm và đính kèm công thức vào một bài học trong khoá học.
- **Chọn công thức liên quan** (`src/components/recipes/form/RelatedRecipesSection.tsx`) - Liên kết các công thức với nhau.
- **Chọn công thức gốc** (`src/components/recipes/form/MetaSection.tsx`) - Tìm công thức gốc khi tạo biến thể.
- **Tìm nguyên liệu công thức** (`src/components/recipes/form/IngredientsSection.tsx`) - Tìm nhanh nguyên liệu khi tạo công thức.
- **Tìm đơn vị đo** (`src/components/recipes/form/IngredientsSection.tsx`) - Tìm nhanh đơn vị khi tạo nguyên liệu cho công thức.

bg-white rounded-2xl border border-default-100
