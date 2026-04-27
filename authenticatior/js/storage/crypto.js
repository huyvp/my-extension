/**
 * Crypto Module
 * Sử dụng Web Crypto API (AES-GCM) để mã hóa dữ liệu bằng Master Password.
 */

export const cryptoUtils = {
  // Tạo Key từ mật khẩu và Salt
  async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },

  // Mã hóa chuỗi JSON
  async encrypt(data, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(password, salt);
    
    const encoder = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(JSON.stringify(data))
    );

    // Trả về salt + iv + encrypted data dưới dạng base64
    return {
      salt: btoa(String.fromCharCode(...salt)),
      iv: btoa(String.fromCharCode(...iv)),
      data: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
    };
  },

  // Giải mã chuỗi JSON
  async decrypt(encryptedObj, password) {
    try {
      const salt = new Uint8Array(atob(encryptedObj.salt).split('').map(c => c.charCodeAt(0)));
      const iv = new Uint8Array(atob(encryptedObj.iv).split('').map(c => c.charCodeAt(0)));
      const data = new Uint8Array(atob(encryptedObj.data).split('').map(c => c.charCodeAt(0)));
      
      const key = await this.deriveKey(password, salt);
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decrypted));
    } catch (e) {
      throw new Error('Mật khẩu không chính xác');
    }
  }
};
