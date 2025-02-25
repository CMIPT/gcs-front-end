export async function fetchWithRetry<T>(url: string, options: any = {}) {
  const userAuth = useUserAuth();
  if (!options.headers) {
    options.headers = {};
  }
  if (userAuth.value.accessToken) {
    options.headers["access-token"] = userAuth.value.accessToken;
  }
  try {
    return await $fetch<T>(url, options);
  } catch (error: any) {
    if (
      error.response?.status === HTTPStatus.UNAUTHORIZED ||
      (error.response?.status === HTTPStatus.BAD_REQUEST &&
        error.data?.code === APIErrorCodes.TOKEN_NOT_FOUND)
    ) {
      await refreshAccessToken();
      if (userAuth.value.accessToken) {
        sessionStorage.setItem("access-token", userAuth.value.accessToken);
        options.headers["access-token"] = userAuth.value.accessToken;
        return await $fetch<T>(url, options);
      } else {
        sessionStorage.removeItem("access-token");
        localStorage.removeItem("refresh-token");
      }
    }
    throw error;
  }
}

async function refreshAccessToken() {
  const userAuth = useUserAuth();
  userAuth.value.accessToken = null;
  if (!userAuth.value.refreshToken) {
    return;
  }
  const apiURL = new URL(
    APIPaths.AUTHENTICATION_REFRESH_API_PATH,
    window.origin,
  );
  await $fetch
    .raw(apiURL.toString(), {
      headers: {
        "refresh-token": userAuth.value.refreshToken,
      },
    })
    .then((resp) => {
      userAuth.value.accessToken = resp.headers.get("access-token");
    })
    .catch((error) => {
      console.error("Failed to refresh access token", error);
    });
}
