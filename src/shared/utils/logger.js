const IS_PROD = import.meta.env.PROD || import.meta.env.MODE === 'production';

export const logger = {
  log: (...args) => {
    if (!IS_PROD) {
      console.log(...args);
    }
  },
  info: (...args) => {
    if (!IS_PROD) {
      console.info(...args);
    }
  },
  warn: (...args) => {
    if (!IS_PROD) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    // We keep error logging in production for diagnostics, but can be customized here
    console.error(...args);
  }
};

export default logger;
