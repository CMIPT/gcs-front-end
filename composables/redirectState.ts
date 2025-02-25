export const useRedirectAfterLogin = () => {
  return useState<string>("redirectAfterLogin", () => {
    return "/";
  });
};
