export function getErrorMessage(err) {
  if (!err.response) return 'Ошибка соединения с сервером';

  const data = err.response.data;

  if (data.errors && data.errors.length > 0) {
    return data.errors.join('. ');
  }

  if (data.message) {
    return data.message;
  }

  if (typeof data === 'string') {
    return data;
  }

  return 'Произошла неизвестная ошибка';
}
