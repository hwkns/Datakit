export const logApiCall = (method: string, url: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`🔗 API ${method.toUpperCase()} ${url}`, data ? { data } : '');
  }
};

export const logApiResponse = (url: string, response: any, error?: any) => {
  if (import.meta.env.DEV) {
    if (error) {
      console.error(`❌ API Error ${url}:`, error);
    } else {
      console.log(`API Success ${url}:`, response);
    }
  }
};