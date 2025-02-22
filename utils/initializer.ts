export async function initialize() {
  initializeToken();
  await initializeUserInfo();
}

function initializeToken() {
  useUserAuth().value = {
    accessToken: sessionStorage.getItem("access-token"),
    refreshToken: localStorage.getItem("refresh-token"),
  };
}

async function initializeUserInfo() {
  if (useUserInfo().value.id) {
    return;
  }
  const apiURL = new URL(APIPaths.USER_GET_USER_API_PATH, window.origin);
  apiURL.searchParams.append("userType", "token");
  useUserInfo().value = await fetchWithRetry<UserVO>(apiURL.toString()).catch(
    () => {
      useUserAuth().value = {} as UserAuthState;
      return {} as UserVO;
    },
  );
}
