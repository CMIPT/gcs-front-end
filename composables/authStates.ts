export type UserAuthState = {
  accessToken?: string;
  refreshToken?: string;
};

export const useUserAuth = () => {
  return useState<UserAuthState>("userAuth", () => {
    return {};
  });
};

export type UserInfoState = {
  id: string;
  username: string;
  email: string;
};

export const useUserInfo = () => {
  return useState<UserInfoState>("userInfo", () => {
    return { id: "", username: "", email: "" };
  });
};
