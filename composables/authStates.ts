import type { UserVO } from "./responseVOTypes";

export type UserAuthState = {
  accessToken?: string;
  refreshToken?: string;
};

export const useUserAuth = () => {
  return useState<UserAuthState>("userAuth", () => {
    return {};
  });
};

export const useUserInfo = () => {
  return useState<UserVO>("userInfo", () => {
    return { id: "", username: "", email: "" };
  });
};
