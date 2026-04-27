# Tài liệu phát triển Chrome Extension (Manifest V3)

**JavaScript & TypeScript**

---

## 1. Tổng quan

Tài liệu này cung cấp hướng dẫn **chuẩn, rõ ràng và mang tính production** để phát triển Chrome Extension với:

* **JavaScript (JS)** – nhanh, đơn giản
* **TypeScript (TS)** – an toàn kiểu dữ liệu, dễ maintain

Áp dụng theo chuẩn **Manifest V3 (MV3)** – phiên bản mới nhất của Chrome Extension.

---

## 2. Các thành phần cốt lõi

Một Chrome Extension gồm các thành phần chính sau:

| Thành phần                | Mô tả                    |
| ------------------------- | ------------------------ |
| `manifest.json`           | File cấu hình (bắt buộc) |
| Popup UI                  | Giao diện khi click icon |
| Background Service Worker | Xử lý logic nền          |
| Storage                   | Lưu trữ dữ liệu          |
| Permissions               | Quyền truy cập API       |

---

## 3. Cấu trúc project

### 3.1 Dùng JavaScript

```bash
my-extension/
├── manifest.json
├── popup/
│   ├── popup.html
│   └── popup.js
├── background/
│   └── background.js
├── core/        # logic chính (ví dụ: TOTP)
└── utils/       # helper (crypto, encode, ...)
```

---

### 3.2 Dùng TypeScript

```bash
my-extension/
├── src/
│   ├── popup/
│   │   ├── popup.html
│   │   └── popup.ts
│   ├── background/
│   │   └── background.ts
│   ├── core/
│   └── utils/
├── dist/        # output sau khi build
├── manifest.json
├── tsconfig.json
└── package.json
```

---

## 4. manifest.json (bắt buộc)

### Vai trò

* Khai báo thông tin extension
* Định nghĩa entry point
* Cấu hình quyền

---

### Ví dụ tối thiểu

```json
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0",
  "action": {
    "default_popup": "popup/popup.html"
  },
  "background": {
    "service_worker": "background/background.js"
  },
  "permissions": ["storage"]
}
```

---

### Lưu ý

* `manifest_version` bắt buộc là `3`
* Nếu dùng TypeScript → phải trỏ tới file `.js` trong `dist/`

---

## 5. Popup (UI)

### Vai trò

* Giao diện chính cho user
* Chỉ chạy khi mở popup

---

### Ví dụ

#### popup.html

```html
<!DOCTYPE html>
<html>
  <body>
    <h3>Extension</h3>
    <button id="btn">Click</button>
    <script type="module" src="popup.js"></script>
  </body>
</html>
```

#### popup.js / popup.ts

```js
document.getElementById("btn").addEventListener("click", () => {
  console.log("Clicked");
});
```

---

## 6. Background Service Worker

### Vai trò

* Xử lý logic nền
* Lắng nghe event hệ thống
* Không có UI

---

### Ví dụ

```js
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});
```

---

### Lưu ý

* Không có DOM (`document`, `window`)
* Chạy dạng event-driven (có thể bị stop)

---

## 7. Permissions

### Ví dụ

```json
"permissions": ["storage"]
```

---

### Một số quyền phổ biến

| Permission       | Mô tả             |
| ---------------- | ----------------- |
| `storage`        | Lưu dữ liệu local |
| `tabs`           | Truy cập tab      |
| `activeTab`      | Tab hiện tại      |
| `clipboardWrite` | Ghi clipboard     |

---

### Nguyên tắc

> Chỉ xin quyền khi thật sự cần

---

## 8. Quy trình chạy

1. Mở:

```
chrome://extensions
```

2. Bật **Developer mode**
3. Chọn **Load unpacked**
4. Chọn folder project

---

## 9. Workflow với JavaScript

### Ưu điểm

* Không cần build
* Debug đơn giản

### Nhược điểm

* Không có type checking
* Khó maintain project lớn

---

## 10. Workflow với TypeScript

### 10.1 Cài đặt

```bash
npm install typescript --save-dev
npm install @types/chrome --save-dev
```

---

### 10.2 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "sourceMap": true
  }
}
```

---

### 10.3 Build

```bash
npx tsc
```

---

### 10.4 Watch mode

```bash
npx tsc -w
```

---

### Lưu ý quan trọng

* Browser chỉ chạy file `.js`
* `manifest.json` phải trỏ tới `dist/`
* Giữ structure `src` và `dist` giống nhau

---

## 11. Debug

### 11.1 Debug popup

1. Mở `chrome://extensions`
2. Chọn:

```
Inspect views → popup.html
```

---

### 11.2 Debug background

```
Service Worker → Inspect
```

---

### 11.3 Debug TypeScript

* Bật `sourceMap`
* Chrome sẽ map từ `.js` → `.ts`

---

## 12. Bảo mật

### Nguyên tắc

* Không lưu dữ liệu nhạy cảm dạng plain text
* Tách UI và logic
* Hạn chế permission
* Dùng API crypto của browser nếu cần

---

## 13. Kiến trúc đề xuất

| Layer         | Vai trò     |
| ------------- | ----------- |
| `popup/`      | UI          |
| `background/` | điều phối   |
| `core/`       | logic chính |
| `utils/`      | helper      |

---

## 14. Thành phần mở rộng (optional)

| Thành phần     | Mô tả          |
| -------------- | -------------- |
| Content Script | inject vào web |
| Options Page   | trang setting  |
| Icons          | icon extension |
| DevTools Page  | debug nâng cao |

---

## 15. Tổng kết

Để tạo một Chrome Extension cần:

* `manifest.json`
* popup (tuỳ chọn nhưng phổ biến)
* background service worker
* permissions phù hợp
* cấu trúc rõ ràng

---

### So sánh JS vs TS

| Tiêu chí | JavaScript | TypeScript        |
| -------- | ---------- | ----------------- |
| Setup    | nhanh      | cần build         |
| An toàn  | thấp       | cao               |
| Maintain | trung bình | tốt               |
| Debug    | dễ         | phức tạp hơn chút |

---

## 16. Hướng phát triển tiếp

* Implement logic (ví dụ: TOTP)
* Thêm encryption
* Lưu trữ an toàn
* Cải thiện UI

---

**Kết thúc tài liệu**
