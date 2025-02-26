export type ErrorVO = {
  code: number;
  message: string;
};
export type PageVO<T> = {
  pages: number;
  total: number;
  records: Array<T>;
};
export type UserVO = {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
};
export type SshKeyVO = {
  id: string;
  userId: string;
  name: string;
  publicKey: string;
};
export type RepositoryVO = {
  id: string;
  repositoryName: string;
  repositoryDescription: string;
  isPrivate: boolean;
  userId: string;
  username: string;
  avatarUrl: string;
  star: number;
  fork: number;
  watcher: number;
  httpsUrl: string;
  sshUrl: string;
};
