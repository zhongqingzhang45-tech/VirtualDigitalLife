export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  timestamp: string;
}

export function success<T>(data?: T, message = 'success'): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function error(code: number, message: string): ApiResponse {
  return {
    code,
    message,
    timestamp: new Date().toISOString(),
  };
}
