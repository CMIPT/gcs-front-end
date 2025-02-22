function initializeToken() {
  useUserAuth().value = {
    accessToken: sessionStorage.getItem("access-token"),
    refreshToken: localStorage.getItem("refresh-token"),
  };
}

export function initialize() {
  initializeToken();
}
