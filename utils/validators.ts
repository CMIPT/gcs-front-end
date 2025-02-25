export async function passwordValidator(value: string, cb: any) {
  const password = value || "";
  const apiURL = new URL(
    APIPaths.USER_CHECK_USER_PASSWORD_VALIDITY_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("userPassword", password);
  return await $fetch(apiURL.toString())
    .then(() => {
      cb();
      return true;
    })
    .catch((error) => {
      const message = error.data["message"];
      cb(message);
      return false;
    });
}

export async function emailValidator(value: string, cb: any, reverse = false) {
  const email = value || "";
  const apiURL = new URL(
    APIPaths.USER_CHECK_EMAIL_VALIDITY_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("email", email);
  return await $fetch(apiURL.toString())
    .then(() => {
      if (reverse) {
        cb("邮箱未被注册");
        return false;
      }
      cb();
      return true;
    })
    .catch((error) => {
      if (reverse && error.data?.code === APIErrorCodes.EMAIL_ALREADY_EXISTS) {
        cb();
        return true;
      }
      const message = error.data["message"];
      cb(message);
      return false;
    });
}

export function verificationCodeValidator(value: string, cb: any) {
  if (/^\d{6}$/.test(value)) {
    cb();
    return true;
  } else {
    cb("请输入6位验证码");
    return false;
  }
}
