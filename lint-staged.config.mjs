const config = {
  "*.{js,jsx,mjs,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,css,md,yml,yaml}": ["prettier --write"],
};

export default config;
