/** @type {import('next-pwa').PWAConfig} */
module.exports = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
};
