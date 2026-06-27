# 📋 HƯỚNG DẪN PHÂN QUYỀN HỆ THỐNG TVU-ITAM

## 🔐 Các loại tài khoản

Hệ thống có 3 loại tài khoản với quyền hạn khác nhau:

---

## 1️⃣ SUPERADMIN (Quản trị viên cấp cao)

**Tài khoản:** `superadmin` / `Admin@123`

### ✅ Quyền hạn đầy đủ:

#### 👥 Quản lý Người dùng:
- ✅ Xem **TẤT CẢ** người dùng trong mọi phòng ban
- ✅ **Tạo mới** người dùng
- ✅ Chỉnh sửa thông tin người dùng
- ✅ **Đặt lại mật khẩu** cho bất kỳ ai
- ✅ **Khóa/Mở khóa** tài khoản người dùng
- ✅ Phân quyền (superadmin/admin/user)

#### 🖥️ Quản lý Thiết bị:
- ✅ Xem tất cả thiết bị
- ✅ Thêm thiết bị mới
- ✅ Chỉnh sửa thiết bị
- ✅ **XÓA thiết bị** (chỉ superadmin mới có quyền này)

#### 🔧 Quản lý Bảo trì:
- ✅ Xem, thêm, sửa, xóa lịch bảo trì

#### 🏢 Quản lý Phòng ban:
- ✅ Toàn quyền quản lý phòng ban

---

## 2️⃣ ADMIN (Quản trị viên)

**Tài khoản:** `admin` / `Admin@123`

### ⚠️ Quyền hạn bị giới hạn:

#### 👥 Quản lý Người dùng:
- ⚠️ Chỉ xem người dùng **TRONG PHÒNG BAN CỦA MÌNH**
- ❌ **KHÔNG thể** tạo người dùng mới
- ✅ Chỉnh sửa thông tin người dùng (trong phòng ban)
- ❌ **KHÔNG thể** đặt lại mật khẩu
- ❌ **KHÔNG thể** khóa/mở khóa tài khoản
- ❌ Nút "**+ Thêm người dùng**" bị ẩn

#### 🖥️ Quản lý Thiết bị:
- ✅ Xem tất cả thiết bị
- ✅ Thêm thiết bị mới
- ✅ Chỉnh sửa thiết bị
- ❌ **KHÔNG thể XÓA** thiết bị (nút 🗑️ bị ẩn)

#### 🔧 Quản lý Bảo trì:
- ✅ Xem, thêm, sửa, xóa lịch bảo trì

#### 🏢 Quản lý Phòng ban:
- ✅ Xem và sửa phòng ban hiện có
- ❌ Không thể tạo mới phòng ban
- ❌ User không có quyền

---

## 3️⃣ USER (Người dùng thường)

**Tài khoản:** `user01` / `Admin@123`

### 🔒 Quyền hạn hạn chế nhất:

#### 👁️ Chỉ xem:
- ✅ Xem Dashboard
- ✅ Xem danh sách thiết bị
- ✅ Xem chi tiết thiết bị
- ✅ Xem lịch bảo trì
- ✅ Xem và báo cáo sự cố

#### ❌ Không có quyền:
- ❌ Menu "**Quản trị**" bị ẩn hoàn toàn
- ❌ Không thấy menu "Người dùng"
- ❌ Không thấy menu "Phòng ban"
- ❌ Không có nút "Thêm", "Sửa", "Xóa" bất kỳ dữ liệu nào
- ❌ Chỉ có thể xem thông tin

---

## 📊 Bảng so sánh chi tiết

| Chức năng | Superadmin | Admin | User |
|-----------|:----------:|:-----:|:----:|
| **NGƯỜI DÙNG** |
| Xem tất cả người dùng | ✅ | ⚠️ Chỉ phòng ban mình | ❌ |
| Tạo người dùng mới | ✅ | ❌ | ❌ |
| Sửa thông tin người dùng | ✅ | ✅ | ❌ |
| Đặt lại mật khẩu | ✅ | ❌ | ❌ |
| Khóa/Mở khóa tài khoản | ✅ | ❌ | ❌ |
| **THIẾT BỊ** |
| Xem thiết bị | ✅ | ✅ | ✅ |
| Thêm thiết bị | ✅ | ✅ | ❌ |
| Sửa thiết bị | ✅ | ✅ | ❌ |
| Xóa thiết bị | ✅ | ❌ | ❌ |
| **BẢO TRÌ** |
| Xem lịch bảo trì | ✅ | ✅ | ✅ |
| Thêm/Sửa/Xóa bảo trì | ✅ | ✅ | ❌ |
| **PHÒNG BAN** |
| Quản lý phòng ban | ✅ | ✅ | ❌ |
| **MENU** |
| Menu "Quản trị" | ✅ Hiện | ✅ Hiện | ❌ Ẩn |
| Menu "Người dùng" | ✅ Hiện | ✅ Hiện | ❌ Ẩn |
| Menu "Phòng ban" | ✅ Hiện | ✅ Hiện | ❌ Ẩn |

---

## 🎨 Phân biệt bằng màu sắc

Mỗi loại tài khoản có badge màu khác nhau:

- **Superadmin**: 🔵 Gradient xanh dương-tím (nổi bật nhất)
- **Admin**: 🟢 Màu xanh lá
- **User**: ⚪ Màu xám

---

## 🧪 Cách kiểm tra

1. **Đăng nhập bằng `superadmin`:**
   - Vào trang "Người dùng" → Thấy nút "**+ Thêm người dùng**"
   - Vào trang "Thiết bị" → Thấy nút "**🗑️ Xóa**" ở mỗi thiết bị
   - Thấy tất cả người dùng trong mọi phòng ban

2. **Đăng nhập bằng `admin`:**
   - Vào trang "Người dùng" → **KHÔNG** thấy nút "**+ Thêm người dùng**"
   - Vào trang "Thiết bị" → **KHÔNG** thấy nút "**🗑️ Xóa**"
   - Chỉ thấy người dùng trong phòng ban "Phòng CNTT"

3. **Đăng nhập bằng `user01`:**
   - **KHÔNG** thấy menu "Quản trị", "Người dùng", "Phòng ban"
   - Chỉ xem được thông tin, không có nút thao tác nào

---

## 🔄 Làm mới trang web

Sau khi cập nhật code, hãy:
1. Nhấn **Ctrl + Shift + R** (hoặc Cmd + Shift + R trên Mac) để xóa cache
2. Hoặc mở **DevTools** (F12) → Tab **Network** → Tick "**Disable cache**"
3. Đăng xuất và đăng nhập lại

---

## 📝 Ghi chú kỹ thuật

### Backend (API):
- File: `myduyen/backend/middleware/auth.js` - Xác thực và phân quyền
- File: `myduyen/backend/routes/*.js` - Định nghĩa quyền cho từng endpoint

### Frontend (Giao diện):
- File: `myduyen/frontend/assets/js/app.js` - Ẩn/hiện menu theo role
- File: `myduyen/frontend/assets/js/pages/users.js` - Ẩn/hiện nút theo role
- File: `myduyen/frontend/assets/js/pages/devices.js` - Ẩn/hiện nút xóa theo role
- File: `myduyen/frontend/assets/css/main.css` - Màu sắc badge role

---

**Cập nhật:** 10/05/2026
