import type { UserVO } from "./responseVOTypes";

export type UserAuthState = {
  accessToken: string | null;
  refreshToken: string | null;
};

export const useUserAuth = () => {
  return useState<UserAuthState>("userAuth", () => {
    return {
      accessToken: null,
      refreshToken: null,
    };
  });
};

export const useUserInfo = () => {
  return useState<UserVO>("userInfo", () => {
    // TODO: Fetch user info from the server by token
    return { id: "", username: "", email: "" };
  });
};
