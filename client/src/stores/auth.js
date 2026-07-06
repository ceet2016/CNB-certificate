import { defineStore } from 'pinia';
import api from '../api';
import JSEncrypt from 'jsencrypt';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('cnb_token') || '',
    user: JSON.parse(localStorage.getItem('cnb_user') || 'null'),
    rsaPublicKey: '',
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    isApproved: (state) => state.user?.status === 'approved' || state.user?.role === 'admin',
  },

  actions: {
    async fetchPublicKey() {
      if (this.rsaPublicKey) return this.rsaPublicKey;
      const { data } = await api.get('/auth/public-key');
      this.rsaPublicKey = data.publicKey;
      return this.rsaPublicKey;
    },

    encryptPassword(password) {
      const encrypt = new JSEncrypt();
      const pem = `-----BEGIN PUBLIC KEY-----\n${this.rsaPublicKey}\n-----END PUBLIC KEY-----`;
      encrypt.setPublicKey(pem);
      const encrypted = encrypt.encrypt(password);
      if (!encrypted) throw new Error('RSA加密失败');
      return encrypted;
    },

    // Register — does NOT set token, user must wait for approval
    async register(data) {
      const { data: res } = await api.post('/auth/register', data);
      // Registration returns { message, pending, username } — no token
      return res;
    },

    async login(credentials) {
      await this.fetchPublicKey();
      const encryptedPassword = this.encryptPassword(credentials.password);

      const { data: res } = await api.post('/auth/login', {
        username: credentials.username,
        password: encryptedPassword,
        encrypted: true,
        captcha_id: credentials.captcha_id,
        captcha_answer: credentials.captcha_answer,
      });

      this.token = res.token;
      this.user = res.user;
      localStorage.setItem('cnb_token', res.token);
      localStorage.setItem('cnb_user', JSON.stringify(res.user));
      return res;
    },

    async fetchMe() {
      try {
        const { data: res } = await api.get('/auth/me');
        this.user = res.user;
        localStorage.setItem('cnb_user', JSON.stringify(res.user));
      } catch {
        this.logout();
      }
    },

    async updateProfile(data) {
      const { data: res } = await api.put('/auth/profile', data);
      this.user = res.user;
      localStorage.setItem('cnb_user', JSON.stringify(res.user));
      return res;
    },

    logout() {
      this.token = '';
      this.user = null;
      localStorage.removeItem('cnb_token');
      localStorage.removeItem('cnb_user');
    },
  },
});
