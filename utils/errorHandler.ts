import type { NuxtError } from '#app';

export function tryThrowAndShowError(error: any, defaultMessage: string) {
  console.error(error);
  if (error.response?.status === HTTPStatus.NOT_FOUND) {
    throw showError({
      statusCode: HTTPStatus.NOT_FOUND,
      statusMessage: error.data?.message || defaultMessage,
    } as NuxtError);
  }
}
