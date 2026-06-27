# 📘 QUY TRÌNH CHI TIẾT HỆ THỐNG TVU-ITAM - 3 VAI TRÒ

---

## 👑 **1. SUPERADMIN - Quản Trị Viên Cấp Cao**

**Tài khoản:** `superadmin` / **Mật khẩu:** `Admin@123`

### 🎯 Vị trí & Trách nhiệm
- Quản trị toàn bộ hệ thống
- Quản lý tất cả người dùng trong trường
- Phân quyền và kiểm soát truy cập
- Quản lý tài sản toàn trường

---

### 📊 **QCÁCH SUPERADMIN SỬ DỤNG HỆ THỐNG**

```
┌─ ĐĂNG NHẬP
│  ├─ Nhập: superadmin
│  ├─ Mật khẩu: Admin@123
│  └─ Vào Dashboard
│
├─ 👥 QUẢN LÝ NGƯỜI DÙNG (Menu → Quản trị → Người dùng)
│  ├─ 📋 Xem danh sách: TẤT CẢ người dùng toàn trường
│  ├─ ➕ Tạo người dùng mới
│  │  ├─ Nhập: Họ tên, Email, Tài khoản, Mật khẩu
│  │  ├─ Chọn: Phòng ban, Vai trò (superadmin/admin/user)
│  │  └─ Nhấn "Lưu"
│  ├─ ✏️ Sửa thông tin người dùng
│  │  ├─ Click vào người dùng
│  │  ├─ Chỉnh sửa: Họ tên, Email, Vai trò, Phòng ban
│  │  └─ Nhấn "Cập nhật"
│  ├─ 🔐 Đặt lại mật khẩu cho bất kỳ ai
│  │  └─ Click "🔑 Đặt lại mật khẩu" → Nhập mật khẩu mới
│  ├─ 🔒 Khóa/Mở khóa tài khoản
│  │  └─ Click "🔒 Khóa/Mở khóa tài khoản"
│  └─ 🗑️ Xóa người dùng (nếu không sử dụng)
│
├─ 🖥️ QUẢN LÝ THIẾT BỊ (Menu → Quản lý Thiết bị)
│  ├─ 📋 Xem danh sách: TẤT CẢ thiết bị toàn trường
│  ├─ 🔍 Tìm kiếm: Theo mã, tên, trạng thái, phòng ban
│  ├─ ➕ Thêm thiết bị mới
│  │  ├─ Nhập: Mã thiết bị, Tên, Brand, Model, Serial
│  │  ├─ Chọn: Loại, Phòng ban, Người dùng
│  │  ├─ Nhập: Giá, Ngày mua, Bảo hành, Cấu hình
│  │  └─ Nhấn "Lưu" → Hệ thống tự tạo QR Code
│  ├─ ✏️ Sửa thông tin thiết bị
│  │  ├─ Click vào thiết bị
│  │  ├─ Chỉnh sửa thông tin (tên, trạng thái, người dùng)
│  │  └─ Nhấn "Cập nhật"
│  ├─ 🗑️ XÓA thiết bị (CHỈ SUPERADMIN CÓ QUYỀN)
│  │  ├─ Click nút "🗑️ Xóa"
│  │  └─ Xác nhận xóa
│  └─ 📱 Tạo/Tải QR Code
│     ├─ Click vào thiết bị → "📱 Xem QR Code"
│     └─ Tải PNG hoặc In trực tiếp
│
├─ 🔧 QUẢN LÝ BẢO TRÌ (Menu → Bảo trì)
│  ├─ 📋 Xem danh sách: TẤT CẢ lịch bảo trì
│  ├─ ➕ Lập lịch bảo trì mới
│  │  ├─ Chọn thiết bị
│  │  ├─ Chọn loại: Định kỳ, Sửa chữa, Kiểm tra, Nâng cấp
│  │  ├─ Chọn ngày, độ ưu tiên
│  │  ├─ Ghi mô tả công việc
│  │  └─ Nhấn "Lưu"
│  ├─ ✏️ Cập nhật kết quả bảo trì
│  │  ├─ Click vào lịch bảo trì
│  │  ├─ Nhập: Ngày thực tế, Kết quả, Chi phí
│  │  └─ Nhấn "Cập nhật"
│  └─ 🗑️ Xóa lịch bảo trì (không cần nữa)
│
├─ 🏢 QUẢN LÝ PHÒNG BAN (Menu → Quản trị → Phòng ban)
│  ├─ 📋 Xem danh sách: TẤT CẢ phòng ban
│  ├─ ➕ Tạo phòng ban mới
│  │  ├─ Nhập: Tên, Mã, Vị trí, Mô tả
│  │  ├─ Chọn: Người quản lý (nếu có)
│  │  └─ Nhấn "Lưu"
│  ├─ ✏️ Sửa thông tin phòng ban
│  │  └─ Cập nhật: Tên, Mô tả, Người quản lý
│  └─ 🗑️ Xóa phòng ban (nếu không sử dụng)
│
├─ 🚨 QUẢN LÝ SỰ CỐ (Menu → Sự cố)
│  ├─ 📋 Xem danh sách: TẤT CẢ sự cố
│  ├─ 🔍 Lọc theo: Trạng thái, Mức độ, Thiết bị
│  └─ ✏️ Cập nhật trạng thái, gán kỹ thuật viên
│
├─ 📦 QUẢN LÝ ĐIỀU CHUYỂN (Menu → Điều chuyển)
│  ├─ 📋 Xem danh sách: TẤT CẢ yêu cầu điều chuyển
│  ├─ ✏️ Phê duyệt yêu cầu
│  │  ├─ Click vào yêu cầu
│  │  ├─ Xem chi tiết: Thiết bị, Từ, Tới
│  │  ├─ Chọn: Phê duyệt hoặc Từ chối
│  │  └─ Nhấn "Gửi"
│  │     → Thiết bị tự động cập nhật vị trí
│  └─ 🗑️ Xóa yêu cầu không cần thiết
│
├─ 📊 XEM BÁNG CÁO & THỐNG KÊ (Menu → Báng Cáo)
│  ├─ 📈 Biểu đồ phân bố thiết bị (theo loại, phòng ban)
│  ├─ 💰 Thống kê chi phí bảo trì
│  ├─ ⏰ Thiết bị sắp hết bảo hành
│  └─ 📋 Xuất Excel báo cáo
│
├─ ⚙️ CẤU HÌNH & CÀI ĐẶT (Menu → Cài đặt)
│  ├─ 🎨 Tuỳ chỉnh giao diện
│  ├─ 🔔 Quản lý thông báo
│  ├─ 📧 Cấu hình Email (nếu cần)
│  └─ 💾 Sao lưu dữ liệu
│
└─ 🚪 ĐĂNG XUẤT
   └─ Click Avatar → "Đăng xuất"
```

---

### 💡 **Ví Dụ Quy Trình: Superadmin Tạo Người Dùng Mới**

```
1. Đăng nhập → Dashboard
2. Menu → Quản trị → Người dùng
3. Nhấn "➕ Thêm người dùng"
4. Nhập thông tin:
   - Họ tên: "Nguyễn Văn A"
   - Email: "nguyenvana@tvu.edu.vn"
   - Tài khoản: "nguyenvana"
   - Mật khẩu: "Anh@123"
   - Phòng ban: "Phòng CNTT"
   - Vai trò: "admin" (nếu là quản lý) hoặc "user"
5. Nhấn "Lưu"
6. Thông báo: "✅ Người dùng tạo thành công"
7. Người dùng mới có thể đăng nhập ngay
```

---

---

## 👨‍💼 **2. ADMIN - Quản Trị Viên Phòng Ban**

**Tài khoản:** `admin` / **Mật khẩu:** `Admin@123`

### 🎯 Vị trí & Trách nhiệm
- Quản lý thiết bị của phòng ban mình
- Xem người dùng trong phòng ban
- Lập lịch bảo trì
- Phê duyệt yêu cầu điều chuyển

---

### 📊 **QUY TRÌNH ADMIN SỬ DỤNG HỆ THỐNG**

```
┌─ ĐĂNG NHẬP
│  ├─ Nhập: admin
│  ├─ Mật khẩu: Admin@123
│  └─ Vào Dashboard
│
├─ 👥 QUẢN LÝ NGƯỜI DÙNG (Menu → Quản trị → Người dùng)
│  ├─ 📋 Xem danh sách: CHỈ NGƯỜI DÙNG TRONG PHÒNG BAN "Phòng CNTT"
│  ├─ ⚠️ KHÔNG THỂ:
│  │  ├─ ❌ Tạo người dùng mới (nút bị ẩn)
│  │  ├─ ❌ Đặt lại mật khẩu
│  │  ├─ ❌ Khóa/Mở khóa tài khoản
│  │  └─ ❌ Xóa người dùng
│  └─ ✅ CÓ THỂ:
│     └─ Xem chi tiết, sửa thông tin cơ bản
│
├─ 🖥️ QUẢN LÝ THIẾT BỊ (Menu → Quản lý Thiết bị)
│  ├─ 📋 Xem danh sách: TẤT CẢ thiết bị (hỗ trợ tìm kiếm)
│  ├─ ➕ Thêm thiết bị mới
│  │  ├─ Nhập: Mã thiết bị, Tên, Brand, Model, Serial
│  │  ├─ Chọn: Loại, Phòng ban, Người dùng
│  │  ├─ Nhập: Giá, Ngày mua, Bảo hành, Cấu hình
│  │  └─ Nhấn "Lưu" → Tự tạo QR Code
│  ├─ ✏️ Sửa thông tin thiết bị
│  │  ├─ Click vào thiết bị
│  │  ├─ Chỉnh sửa: Tên, Trạng thái, Người dùng, Vị trí
│  │  └─ Nhấn "Cập nhật"
│  ├─ ⚠️ KHÔNG THỂ XÓA (nút 🗑️ bị ẩn)
│  │  └─ Chỉ Superadmin mới có quyền xóa
│  └─ 📱 Tạo/Tải QR Code
│     ├─ Click vào thiết bị → "📱 Xem QR Code"
│     └─ Tải PNG hoặc In trực tiếp
│
├─ 🔧 QUẢN LÝ BẢO TRÌ (Menu → Bảo trì)
│  ├─ 📋 Xem danh sách: TẤT CẢ lịch bảo trì
│  ├─ ➕ Lập lịch bảo trì
│  │  ├─ Chọn thiết bị
│  │  ├─ Chọn loại: Định kỳ, Sửa chữa, Kiểm tra, Nâng cấp
│  │  ├─ Chọn ngày, độ ưu tiên
│  │  ├─ Ghi mô tả công việc
│  │  └─ Nhấn "Lưu"
│  ├─ ✏️ Cập nhật kết quả bảo trì
│  │  ├─ Click vào lịch bảo trì
│  │  ├─ Nhập: Ngày thực tế, Kết quả, Chi phí
│  │  └─ Nhấn "Cập nhật"
│  └─ 🗑️ Xóa lịch bảo trì (không cần nữa)
│
├─ 🏢 QUẢN LÝ PHÒNG BAN (Menu → Quản trị → Phòng ban)
│  ├─ 📋 Xem: Thông tin phòng ban hiện có
│  ├─ ✏️ Sửa: Tên, Mô tả, Người quản lý
│  ├─ ❌ KHÔNG THỂ:
│  │  ├─ Tạo phòng ban mới
│  │  └─ Xóa phòng ban
│  └─ → Chỉ Superadmin mới quản lý phòng ban
│
├─ 🚨 QUẢN LÝ SỰ CỐ (Menu → Sự cố)
│  ├─ 📋 Xem danh sách: TẤT CẢ sự cố
│  ├─ 🔍 Lọc theo: Trạng thái, Mức độ, Thiết bị
│  └─ ✏️ Cập nhật trạng thái, gán kỹ thuật viên
│
├─ 📦 QUẢN LÝ ĐIỀU CHUYỂN (Menu → Điều chuyển)
│  ├─ 📋 Xem danh sách: Yêu cầu điều chuyển
│  ├─ ✏️ Phê duyệt/Từ chối yêu cầu
│  │  ├─ Click vào yêu cầu
│  │  ├─ Xem chi tiết: Thiết bị, Từ, Tới
│  │  ├─ Chọn: Phê duyệt hoặc Từ chối
│  │  └─ Nhấn "Gửi"
│  │     → Thiết bị tự động cập nhật vị trí
│  └─ 📝 Tạo yêu cầu điều chuyển
│     ├─ Chọn thiết bị
│     ├─ Chọn: Phòng ban/Người dùng nhận
│     ├─ Ghi chú
│     └─ Nhấn "Tạo"
│
├─ 📊 XEM BÁNG CÁO (Menu → Báng Cáo)
│  ├─ 📈 Biểu đồ phân bố thiết bị
│  ├─ 💰 Thống kê chi phí bảo trì
│  ├─ ⏰ Thiết bị sắp hết bảo hành
│  └─ 📋 Xuất Excel báo cáo
│
├─ 🔔 THÔNG BÁO (Menu → Thông báo)
│  ├─ 📬 Xem danh sách thông báo
│  │  ├─ 🔧 Bảo trì sắp đến hạn
│  │  ├─ ⏰ Bảo hành sắp hết
│  │  ├─ 🚨 Sự cố chưa xử lý
│  │  └─ 📋 Yêu cầu chờ phê duyệt
│  └─ ✔️ Đánh dấu đã xem, xóa thông báo
│
└─ 🚪 ĐĂNG XUẤT
   └─ Click Avatar → "Đăng xuất"
```

---

### 💡 **Ví Dụ Quy Trình: Admin Thêm Thiết Bị & Lập Lịch Bảo Trì**

```
**Bước 1: Thêm Thiết Bị Mới**
1. Menu → Quản lý Thiết bị
2. Nhấn "➕ Thêm thiết bị"
3. Nhập thông tin:
   - Mã: "TVU-PC-004"
   - Tên: "Máy tính bàn phòng CNTT #4"
   - Brand: "Dell"
   - Model: "OptiPlex 3080"
   - Serial: "SN-DELL-004"
   - Loại: "Máy tính"
   - Phòng: "Phòng CNTT"
   - Người dùng: "Chọn từ danh sách"
   - Giá: 15.000.000 VNĐ
   - Ngày mua: 2026-05-24
   - Bảo hành: 2027-05-24
4. Nhấn "Lưu"
5. Thông báo: "✅ Thiết bị tạo thành công"
   → QR Code tự động được tạo

**Bước 2: Lập Lịch Bảo Trì**
1. Menu → Bảo trì
2. Nhấn "➕ Thêm lịch bảo trì"
3. Nhập thông tin:
   - Thiết bị: "Chọn TVU-PC-004"
   - Loại: "Định kỳ"
   - Ngày: "2026-06-24"
   - Ưu tiên: "Trung bình"
   - Mô tả: "Vệ sinh, kiểm tra phần cứng, cập nhật"
4. Nhấn "Lưu"
5. Thông báo: "✅ Lịch bảo trì tạo thành công"
```

---

---

## 👤 **3. USER - Người Dùng Thường**

**Tài khoản:** `user01` / **Mật khẩu:** `Admin@123`

### 🎯 Vị trí & Trách nhiệm
- Xem thiết bị được giao
- Báo cáo sự cố
- Xem lịch bảo trì
- Yêu cầu điều chuyển (nếu cần)

---

### 📊 **QUY TRÌNH USER SỬ DỤNG HỆ THỐNG**

```
┌─ ĐĂNG NHẬP
│  ├─ Nhập: user01
│  ├─ Mật khẩu: Admin@123
│  └─ Vào Dashboard
│
├─ 📊 XEM DASHBOARD (Trang chủ)
│  ├─ 📈 Thống kê tổng quan:
│  │  ├─ Số thiết bị được giao
│  │  ├─ Thiết bị đang bảo trì
│  │  ├─ Thiết bị hỏng cần báo cáo
│  │  └─ Bảng hết bảo hành
│  └─ 🔔 Thông báo mới (nếu có)
│
├─ 🖥️ XEM DANH SÁCH THIẾT BỊ (Menu → Quản lý Thiết bị)
│  ├─ 📋 Xem danh sách: THIẾT BỊ CỦA MÌNH + PHÒNG BAN
│  ├─ 🔍 Tìm kiếm: Theo mã, tên, trạng thái
│  ├─ 👁️ Xem chi tiết từng thiết bị:
│  │  ├─ Thông tin cơ bản (tên, brand, model)
│  │  ├─ Serial number, cấu hình
│  │  ├─ Trạng thái, người quản lý
│  │  ├─ Giá mua, ngày mua, bảo hành
│  │  ├─ 📱 QR Code (nếu cần quét lại)
│  │  └─ 📝 Lịch sử sửa chữa
│  ├─ ⚠️ KHÔNG THỂ:
│  │  ├─ ❌ Thêm thiết bị
│  │  ├─ ❌ Sửa thông tin
│  │  ├─ ❌ Xóa thiết bị
│  │  └─ ❌ Tạo QR Code mới
│  └─ ✅ CÓ THỂ:
│     └─ Xem và tải QR Code để in/quét
│
├─ 📝 BÁNG CÁO SỰ CỐ (Menu → Sự cố)
│  ├─ 📋 Xem danh sách: Sự cố do mình báng cáo
│  ├─ ➕ BÁO CÁO SỰ CỐ MỚI
│  │  ├─ Chọn thiết bị: "Chọn từ danh sách"
│  │  ├─ Nhập: Tiêu đề sự cố
│  │  ├─ Chọn: Mức độ nghiêm trọng
│  │  │  ├─ 🟢 Thấp (có thể chờ)
│  │  │  ├─ 🟡 Trung bình (nên sớm)
│  │  │  └─ 🔴 Cao (khẩn cấp)
│  │  ├─ Nhập: Mô tả chi tiết sự cố
│  │  └─ Nhấn "Gửi báng cáo"
│  │     → Quản trị viên sẽ được thông báo
│  ├─ 👁️ Xem chi tiết sự cố
│  │  ├─ Trạng thái xử lý
│  │  ├─ Người được gán xử lý
│  │  ├─ Bình luận/Cập nhật tiến độ
│  │  └─ Ngày báng cáo & Ngày giải quyết
│  └─ 📝 Thêm bình luận vào sự cố
│     └─ "Thiết bị đã tốt hơn" hoặc "Vẫn có vấn đề..."
│
├─ 🔧 XEM LỊCH BẢO TRÌ (Menu → Bảo trì)
│  ├─ 📋 Xem danh sách: LỊC BẢO TRÌ CỦA THIẾT BỊ MÌNH
│  ├─ 👁️ Xem chi tiết từng lịch:
│  │  ├─ Thiết bị nào được bảo trì
│  │  ├─ Loại bảo trì (định kỳ, sửa chữa, kiểm tra)
│  │  ├─ Ngày bảo trì
│  │  ├─ Mô tả công việc
│  │  ├─ Kỹ thuật viên phụ trách
│  │  ├─ Kết quả bảo trì (nếu đã hoàn thành)
│  │  └─ Chi phí (nếu có)
│  ├─ ⚠️ KHÔNG THỂ:
│  │  ├─ ❌ Tạo lịch bảo trì
│  │  ├─ ❌ Sửa lịch bảo trì
│  │  └─ ❌ Xóa lịch bảo trì
│  └─ ✅ CÓ THỂ:
│     └─ Xem thông tin để biết khi nào đem bảo trì
│
├─ 📦 YÊU CẦU ĐIỀU CHUYỂN (Menu → Điều chuyển)
│  ├─ 📋 Xem danh sách: Yêu cầu điều chuyển của mình
│  ├─ ➕ TẠO YÊU CẦU ĐIỀU CHUYỂN MỚI
│  │  ├─ Chọn thiết bị: "Cần chuyển thiết bị nào?"
│  │  ├─ Chọn: Điều chuyển tới (phòng ban/người dùng)
│  │  ├─ Nhập: Lý do (điều chuyển công tác, bàn giao...)
│  │  └─ Nhấn "Gửi yêu cầu"
│  │     → Quản lý sẽ phê duyệt
│  ├─ 👁️ Xem chi tiết yêu cầu
│  │  ├─ Thiết bị nào được chuyển
│  │  ├─ Từ đâu sang đâu
│  │  ├─ Trạng thái (Chờ phê duyệt, Đã phê duyệt, Từ chối)
│  │  ├─ Lý do từ chối (nếu từ chối)
│  │  └─ Ngày tạo & Ngày phê duyệt
│  └─ ⚠️ KHÔNG THỂ:
│     ├─ ❌ Chỉnh sửa yêu cầu sau khi tạo
│     ├─ ❌ Xóa yêu cầu
│     └─ ❌ Phê duyệt yêu cầu
│
├─ 🔔 XEM THÔNG BÁO (Menu → Thông báo)
│  ├─ 📬 Xem danh sách thông báo:
│  │  ├─ 🔧 "Bảo trì định kỳ sắp đến"
│  │  ├─ ⏰ "Bảo hành sắp hết (30 ngày nữa)"
│  │  ├─ 🚨 "Sự cố của bạn đã được gán cho KTV..."
│  │  ├─ ✅ "Sự cố của bạn đã được giải quyết"
│  │  └─ 📋 "Yêu cầu điều chuyển đã được phê duyệt"
│  ├─ ✔️ Đánh dấu đã xem
│  └─ 🗑️ Xóa thông báo
│
├─ 👤 XEM THÔNG TIN CÁ NHÂN (Avatar → Hồ sơ cá nhân)
│  ├─ 👁️ Xem thông tin:
│  │  ├─ Tên, Email, Tài khoản
│  │  ├─ Phòng ban, Vai trò
│  │  └─ Ngày tham gia
│  ├─ ✏️ Sửa thông tin:
│  │  ├─ Đổi ảnh đại diện
│  │  ├─ Cập nhật số điện thoại
│  │  └─ Cập nhật thông tin cá nhân
│  └─ 🔐 Đổi mật khẩu
│     ├─ Nhập: Mật khẩu cũ
│     ├─ Nhập: Mật khẩu mới (2 lần)
│     └─ Nhấn "Cập nhật"
│
├─ ⚙️ CẤU HÌNH & CÀI ĐẶT (Avatar → Cài đặt)
│  ├─ 🎨 Tuỳ chỉnh giao diện:
│  │  ├─ Chế độ sáng/tối
│  │  └─ Kích thước chữ
│  ├─ 🔔 Cấu hình thông báo:
│  │  ├─ Bật/Tắt thông báo
│  │  └─ Chọn loại thông báo
│  └─ ⌚ Chọn múi giờ
│
└─ 🚪 ĐĂNG XUẤT
   └─ Avatar → "Đăng xuất"
```

---

### 💡 **Ví Dụ Quy Trình: User Báo Cáo Sự Cố**

```
**Tình huống:** Máy tính của bạn bị lỗi khởi động

1. Đăng nhập vào hệ thống
   → Tài khoản: user01 / Mật khẩu: Admin@123

2. Menu → Sự cố

3. Nhấn "➕ Báng cáo sự cố mới"

4. Nhập thông tin:
   - Thiết bị: "Chọn máy tính TVU-PC-001"
   - Tiêu đề: "Máy tính không khởi động được"
   - Mức độ: "Cao" (vì không dùng được)
   - Mô tả: "Máy bật nguồn nhưng không vào Windows,
            màn hình đen không có tín hiệu"

5. Nhấn "Gửi báng cáo"

6. Thông báo: "✅ Báng cáo sự cố thành công"
   → Quản trị viên sẽ nhận được thông báo
   → Người dùng được gán để xử lý

7. Bạn có thể theo dõi tiến độ:
   - Vào Menu → Sự cố
   - Xem trạng thái: "Chờ xử lý" → "Đang xử lý" → "Đã giải quyết"
   - Xem bình luận từ kỹ thuật viên
```

---

---

## 📊 **SO SÁNH NHANH 3 VAI TRÒ**

| Chức Năng | Superadmin | Admin | User |
|-----------|:----------:|:-----:|:----:|
| **NGƯỜI DÙNG** | | | |
| Xem TẤT CẢ người dùng | ✅ | ⚠️ Chỉ phòng ban | ❌ |
| Tạo người dùng | ✅ | ❌ | ❌ |
| Đặt lại mật khẩu | ✅ | ❌ | ❌ |
| Khóa/Mở tài khoản | ✅ | ❌ | ❌ |
| **THIẾT BỊ** | | | |
| Xem thiết bị | ✅ | ✅ | ✅ |
| Thêm thiết bị | ✅ | ✅ | ❌ |
| Sửa thiết bị | ✅ | ✅ | ❌ |
| **XÓA** thiết bị | ✅ | ❌ | ❌ |
| Tạo QR Code | ✅ | ✅ | ❌ |
| **BẢO TRÌ** | | | |
| Xem lịch bảo trì | ✅ | ✅ | ✅ |
| Tạo lịch bảo trì | ✅ | ✅ | ❌ |
| Cập nhật kết quả | ✅ | ✅ | ❌ |
| **SỰ CỐ** | | | |
| Xem sự cố | ✅ | ✅ | ⚠️ Của mình |
| Báng cáo sự cố | ✅ | ✅ | ✅ |
| Gán xử lý | ✅ | ✅ | ❌ |
| **ĐIỀU CHUYỂN** | | | |
| Xem yêu cầu | ✅ | ✅ | ⚠️ Của mình |
| Tạo yêu cầu | ✅ | ✅ | ✅ |
| Phê duyệt | ✅ | ✅ | ❌ |
| **PHÒNG BAN** | | | |
| Quản lý phòng ban | ✅ | ✅ | ❌ |
| **MENU QUẢN TRỊ** | ✅ Hiện | ✅ Hiện | ❌ Ẩn |

---

## 🔑 **QUYỀN HẠN CHÍNH YẾU**

### 🔵 **Superadmin:**
- Toàn quyền hệ thống
- Xóa thiết bị, người dùng
- Tạo người dùng mới
- Quản lý phòng ban

### 🟢 **Admin:**
- Quản lý thiết bị & bảo trì
- Phê duyệt yêu cầu
- Xem người dùng trong phòng ban
- **Không thể:** Xóa, tạo người dùng

### ⚪ **User:**
- Xem thông tin
- Báng cáo sự cố
- Yêu cầu điều chuyển
- **Không thể:** Tạo, sửa, xóa bất cứ dữ liệu nào

---

## 📞 **CẦN HỖ TRỢ?**

Nếu gặp vấn đề:
1. Kiểm tra xem bạn đã đăng nhập đúng vai trò chưa
2. Làm mới trang: **Ctrl + Shift + R**
3. Liên hệ Quản trị viên cấp cao (Superadmin)
4. Kiểm tra thông báo lỗi để xem chi tiết vấn đề
