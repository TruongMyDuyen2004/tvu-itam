# Hướng dẫn build App Android cho TVU-ITAM

## Yêu cầu
- Node.js 18+
- Android Studio (có SDK)
- Java JDK 17+

## Các bước thực hiện

### 1. Cài đặt Capacitor
```bash
cd KLTN_QLTSS
npm install
```

### 2. Khởi tạo Capacitor
```bash
npx cap init TVU-ITAM edu.tvu.itam --web-dir frontend
```

### 3. Thêm Android platform
```bash
npx cap add android
```

### 4. Đồng bộ web code
Mỗi khi sửa code frontend, chạy:
```bash
npx cap copy android
```

### 5. Cập nhật server URL (quan trọng)
Sửa file `capacitor.config.json`, thay `192.168.1.6` bằng IP thật của máy chủ:
```json
"server": {
    "url": "http://192.168.1.X:5000",
    "cleartext": true
}
```

### 6. Build APK
```bash
cd android
gradlew assembleDebug
```
Hoặc mở Android Studio:
```bash
npx cap open android
```
→ Build → Build APK

APK sẽ được tạo tại: `android/app/build/outputs/apk/debug/app-debug.apk`

### 7. Cài đặt trên điện thoại
- Copy file APK sang điện thoại
- Bật "Cài đặt ứng dụng từ nguồn không xác định"
- Cài đặt và mở app
- Trong app, vào Cài đặt → nhập đúng IP máy chủ
