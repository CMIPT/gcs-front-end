export type UserAuthState = {
  accessToken: string | null;
  refreshToken: string | null;
};

export const useUserAuth = () => {
  return useState<UserAuthState>("userAuth", () => {
    return {} as UserAuthState;
  });
};

export const useUserInfo = () => {
  return useState<UserVO>("userInfo", () => {
    return {} as UserVO;
  });
};
