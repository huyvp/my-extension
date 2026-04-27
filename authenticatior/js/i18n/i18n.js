const translations = {
  en: {
    title: 'Authenticator',
    add_account: 'Add Account',
    export: 'Export Data',
    import: 'Import Data',
    settings: 'Settings',
    remove: 'Remove',
    copy: 'Copied to clipboard',
    empty: 'No accounts yet. Add your first one!',
    issuer: 'Issuer',
    account_name: 'Account Name',
    secret_key: 'Secret Key (Base32)',
    cancel: 'Cancel',
    save: 'Save',
    theme: 'Theme',
    language: 'Language',
    confirm_delete: 'Are you sure you want to delete this account?',
    import_success: 'Accounts imported successfully',
    import_error: 'Invalid file format',
    settings: 'Settings',
    visibility: 'OTP Visibility',
    always_show: 'Always show codes',
    click_to_reveal: 'Click to reveal',
    storage_area: 'Storage Area',
    local_only: 'Local Only (This Device)',
    chrome_sync: 'Chrome Sync (Across Devices)',
    security: 'Security',
    change_pwd: 'Change Master Password',
    data_mgmt: 'Data Management',
    export: 'Export',
    import: 'Import',
    close: 'Close',
    cancel: 'Cancel',
    manual_add: 'Manual',
    uri_add: 'Scan / Link (QR)',
    issuer_ph: 'Issuer (e.g. Google)',
    name_ph: 'Account Name',
    secret_ph: 'Secret Key (Base32)',
    reveal: 'Reveal'
  },
  vi: {
    title: 'Xác thực',
    add_account: 'Thêm tài khoản',
    export: 'Xuất dữ liệu',
    import: 'Nhập dữ liệu',
    settings: 'Cài đặt',
    remove: 'Gỡ bỏ',
    copy: 'Đã sao chép vào bộ nhớ tạm',
    empty: 'Chưa có tài khoản nào. Hãy thêm tài khoản đầu tiên!',
    issuer: 'Nhà cung cấp',
    account_name: 'Tên tài khoản',
    secret_key: 'Mã bí mật (Base32)',
    cancel: 'Hủy',
    save: 'Lưu',
    theme: 'Giao diện',
    language: 'Ngôn ngữ',
    confirm_delete: 'Bạn có chắc chắn muốn xóa tài khoản này không?',
    import_success: 'Nhập tài khoản thành công',
    import_error: 'Định dạng file không hợp lệ',
    settings: 'Cài đặt',
    visibility: 'Hiển thị mã OTP',
    always_show: 'Luôn hiển thị mã',
    click_to_reveal: 'Bấm để xem',
    storage_area: 'Nơi lưu trữ',
    local_only: 'Chỉ lưu trên máy này',
    chrome_sync: 'Đồng bộ qua Chrome Sync',
    security: 'Bảo mật',
    change_pwd: 'Đổi Master Password',
    data_mgmt: 'Quản lý dữ liệu',
    export: 'Xuất dữ liệu',
    import: 'Nhập dữ liệu',
    close: 'Đóng',
    cancel: 'Hủy',
    manual_add: 'Nhập tay',
    uri_add: 'Quét Mã / Link (QR)',
    issuer_ph: 'Nhà cung cấp (VD: Google)',
    name_ph: 'Tên tài khoản',
    secret_ph: 'Secret Key (Base32)',
    reveal: 'Hiện mã'
  }
};

export const i18n = {
  current: 'en',
  async init() {
    const data = await chrome.storage.local.get(['auth_settings']);
    this.current = data.auth_settings?.lang || (navigator.language.startsWith('vi') ? 'vi' : 'en');
  },
  t(key) {
    return translations[this.current][key] || key;
  },
  async setLang(lang) {
    this.current = lang;
    const data = await chrome.storage.local.get(['auth_settings']);
    await chrome.storage.local.set({ auth_settings: { ...data.auth_settings, lang } });
  }
};
