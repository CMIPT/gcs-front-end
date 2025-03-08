export const APIPaths = {
  USER_CREATE_USER_API_PATH: "/api/gcs/user/create",
  USER_UPDATE_USER_PASSWORD_WITH_OLD_PASSWORD_API_PATH:
    "/api/gcs/user/update-password-with-old-password",
  USER_GET_USER_API_PATH: "/api/gcs/user/get",
  REPOSITORY_PAGE_REPOSITORY_API_PATH: "/api/gcs/repository/page",
  REPOSITORY_ADD_COLLABORATOR_API_PATH: "/api/gcs/repository/add-collaborator",
  REPOSITORY_CHECK_REPOSITORY_NAME_VALIDITY_API_PATH:
    "/api/gcs/repository/repository-name",
  USER_CHECK_USERNAME_VALIDITY_API_PATH: "/api/gcs/user/username",
  USER_DELETE_USER_API_PATH: "/api/gcs/user/delete",
  REPOSITORY_UPDATE_REPOSITORY_API_PATH: "/api/gcs/repository/update",
  REPOSITORY_PAGE_COLLABORATOR_API_PATH:
    "/api/gcs/repository/page/collaborator",
  REPOSITORY_DELETE_REPOSITORY_API_PATH: "/api/gcs/repository/delete",
  USER_UPDATE_USER_API_PATH: "/api/gcs/user/update",
  SSH_KEY_CHECK_SSH_KEY_PUBLIC_KEY_VALIDITY_API_PATH:
    "/api/gcs/ssh/ssh-key-publickey",
  SSH_KEY_UPLOAD_SSH_KEY_API_PATH: "/api/gcs/ssh/upload",
  AUTHENTICATION_SIGN_IN_API_PATH: "/api/gcs/auth/signin",
  SSH_KEY_CHECK_SSH_KEY_NAME_VALIDITY_API_PATH: "/api/gcs/ssh/ssh-key-name",
  AUTHENTICATION_SIGN_OUT_API_PATH: "/api/gcs/auth/signout",
  DEVELOPMENT_GET_VO_AS_TS_API_PATH: "/api/gcs/developer/vo-as-ts",
  USER_CHECK_USER_PASSWORD_VALIDITY_API_PATH: "/api/gcs/user/user-password",
  SSH_KEY_UPDATE_SSH_KEY_API_PATH: "/api/gcs/ssh/update",
  SSH_KEY_DELETE_SSH_KEY_API_PATH: "/api/gcs/ssh/delete",
  REPOSITORY_GET_REPOSITORY_API_PATH: "/api/gcs/repository/get",
  REPOSITORY_REMOVE_COLLABORATION_API_PATH:
    "/api/gcs/repository/remove-collaborator",
  AUTHENTICATION_SEND_EMAIL_VERIFICATION_CODE_API_PATH:
    "/api/gcs/auth/send-email-verification-code",
  REPOSITORY_CREATE_REPOSITORY_API_PATH: "/api/gcs/repository/create",
  SSH_KEY_PAGE_SSH_KEY_API_PATH: "/api/gcs/ssh/page",
  AUTHENTICATION_REFRESH_API_PATH: "/api/gcs/auth/refresh",
  USER_CHECK_EMAIL_VALIDITY_API_PATH: "/api/gcs/user/email",
  USER_UPDATE_USER_PASSWORD_WITH_EMAIL_VERIFICATION_CODE_API_PATH:
    "/api/gcs/user/update-password-with-email-verification-code",
  DEVELOPMENT_GET_ERROR_MESSAGE_API_PATH: "/api/gcs/developer/error",
  DEVELOPMENT_GET_API_MAP_API_PATH: "/api/gcs/developer/api",
};

export const APIErrorCodes = {
  SSH_KEY_UPLOAD_FAILED: 26,
  ILLOGICAL_OPERATION: 35,
  WRONG_SIGN_IN_INFORMATION: 5,
  USER_CREATE_FAILED: 11,
  TOKEN_NOT_FOUND: 8,
  REPOSITORY_UPDATE_FAILED: 18,
  SSH_KEY_DELETE_FAILED: 28,
  INVALID_EMAIL_VERIFICATION_CODE: 36,
  ACCESS_DENIED: 7,
  SERVER_ERROR: 34,
  USERNAME_RESERVED: 2,
  USER_DELETE_FAILED: 13,
  REPOSITORY_CREATE_FAILED: 17,
  SSH_KEY_NOT_FOUND: 29,
  VALIDATION_ERROR: 1,
  REPOSITORY_NOT_FOUND: 15,
  REPOSITORY_PATH_NOT_FOUND: 21,
  USER_NOT_FOUND: 10,
  COLLABORATION_ADD_FAILED: 22,
  SSH_KEY_NAME_ALREADY_EXISTS: 32,
  WRONG_UPDATE_PASSWORD_INFORMATION: 14,
  COLLABORATION_NOT_FOUND: 25,
  USER_UPDATE_FAILED: 12,
  SSH_KEY_UPDATE_FAILED: 27,
  REPOSITORY_REF_NOT_FOUND: 20,
  COLLABORATION_ALREADY_EXISTS: 24,
  SSH_KEY_PUBLIC_KEY_ALREADY_EXISTS: 31,
  OPERATION_NOT_IMPLEMENTED: 33,
  INVALID_TOKEN: 6,
  MESSAGE_CONVERSION_ERROR: 9,
  SSH_KEY_PUBLIC_KEY_INVALID: 30,
  REPOSITORY_ALREADY_EXISTS: 16,
  REPOSITORY_DELETE_FAILED: 19,
  COLLABORATION_REMOVE_FAILED: 23,
  USERNAME_ALREADY_EXISTS: 3,
  EMAIL_ALREADY_EXISTS: 4,
};

export const HTTPStatus = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};
