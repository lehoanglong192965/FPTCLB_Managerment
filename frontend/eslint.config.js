import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Toàn bộ app fetch dữ liệu bằng useEffect + setLoading/setError thủ công
      // (không dùng React Query/Suspense) — đây là pattern chuẩn React docs vẫn
      // công nhận cho app không có framework, không phải lỗi logic. Rule mới
      // (react-hooks v7) coi mọi setState trực tiếp trong effect là error; giữ
      // cảnh báo thay vì chặn build vì "sửa đúng" nghĩa là viết lại effect fetch
      // ở hàng chục file — rủi ro cao hơn lợi ích ở giai đoạn này.
      "react-hooks/set-state-in-effect": "warn",
      // Các Context (Auth, Toast, Confirm...) export cùng lúc Provider + hook
      // dùng nó (useAuth, useToast...) trong 1 file — chỉ ảnh hưởng độ mượt của
      // Fast Refresh lúc dev, không ảnh hưởng production. Tách file sẽ kéo theo
      // sửa import ở rất nhiều nơi dùng các hook này, không tương xứng lợi ích.
      "react-refresh/only-export-components": "warn",
    },
  },
])
