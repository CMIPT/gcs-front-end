export async function loginAndRedirect(
  usernameOrEmail: string,
  password: string,
  redirectToOnFail: string | null,
) {
  if (usernameOrEmail === "" || password === "") {
    Message.error({ id: "sign-in", content: "登录信息不能为空" });
    return false;
  }
  const apiURL = new URL(
    APIPaths.AUTHENTICATION_SIGN_IN_API_PATH,
    window.origin,
  );
  try {
    const username =
      usernameOrEmail.indexOf("@") === -1 ? usernameOrEmail : null;
    const email = usernameOrEmail.indexOf("@") === -1 ? null : usernameOrEmail;
    const resp = await $fetch.raw(apiURL.toString(), {
      method: "POST",
      body: JSON.stringify({
        username: username,
        email: email,
        userPassword: password,
      }),
    });
    const accessToken = resp.headers.get("access-token");
    const refreshToken = resp.headers.get("refresh-token");
    if (!accessToken || !refreshToken) {
      throw new Error();
    }
    sessionStorage.setItem("access-token", accessToken);
    localStorage.setItem("refresh-token", refreshToken);
    useUserAuth().value = {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
    useUserInfo().value = resp._data as UserVO;
    Message.success({ id: "sign-in", content: "登录成功，正在跳转……" });
    const target = useRedirectAfterLogin().value;
    useRedirectAfterLogin().value = "/";
    useRouter().push(target);
    return true;
  } catch (error: any) {
    console.error(error);
    if (!error.data) {
      Message.error({ id: "sign-in", content: "登录失败" });
    } else {
      const message = error.data["message"];
      Message.error({ id: "sign-in", content: message });
    }
    if (redirectToOnFail) {
      useRouter().push(redirectToOnFail);
    }
    return false;
  }
}
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
  await refreshAccessToken();
  const auth = useUserAuth();
  if (!auth.value.accessToken) {
    return;
  }
  const apiURL = new URL(APIPaths.USER_GET_USER_API_PATH, window.origin);
  apiURL.searchParams.append("user", auth.value.accessToken);
  apiURL.searchParams.append("userType", "TOKEN");
  useUserInfo().value = await $fetch<UserVO>(apiURL.toString(), {
    headers: {
      "access-token": auth.value.accessToken,
    },
  }).catch(() => {
    sessionStorage.removeItem("access-token");
    localStorage.removeItem("refresh-token");
    return {} as UserVO;
  });
}
