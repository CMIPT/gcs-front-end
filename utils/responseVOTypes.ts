export type ErrorVO = {
  code: number;
  message: string;
};
export type PageVO<T> = {
  total: number;
  records: Array<T>;
};
export type RepositoryDetailVO = {
  id: string;
  repositoryName: string;
  repositoryDescription: string;
  isPrivate: boolean;
  gmtCreated: string;
  userId: string;
  username: string;
  avatarUrl: string;
  star: number;
  fork: number;
  watcher: number;
  httpsUrl: string;
  sshUrl: string;
  branchList: Array<string>;
  tagList: Array<string>;
  defaultRef: string;
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
export type RepositoryFileVO = {
  name: string;
  isDirectory: boolean;
};
export type RepositoryFileDetailVO = {
  isDirectory: boolean;
  content: string;
  readmeContent: string;
  licenseContent: string;
  directoryList: Array<RepositoryFileVO>;
};
export type RepositoryVO = {
  id: string;
  repositoryName: string;
  repositoryDescription: string;
  isPrivate: boolean;
  gmtCreated: string;
  username: string;
  avatarUrl: string;
  star: number;
  fork: number;
  watcher: number;
};
export type CollaboratorVO = {
  id: string;
  collaboratorId: string;
  username: string;
  email: string;
  avatarUrl: string;
};

export type LabelVO = {
    id: string;
    name: string;
    hexColor: string;
    description: string;
}



export type ActivityFullInfoVO = {
    id: string;
    number: string;
    repositoryId: string;
    repositoryName: string;
    title: string;
    description: string;
    labels: LabelVO[];
    username: string;
    assignees: AssigneeVO[];
    commentCnt: string;
    gmtCreated: string;
    gmtUpdated: string;
    gmtClosed: string;
    gmtLocked: string;
}

export type CommentVO = {
    id: string;
    activityId: string;
    userId: string;
    content: string;
    codePath?: string;
    codeLine?: number;
    replyToId?: string;
    gmtCreated: string;
    gmtUpdated: string;
    gmtResolved?: string;
    gmtHidden?: string;
}

export type CommentFullInfoVO = {
    id: string;
    activityId: string;
    userId: string;
    username: string;
    email: string;
    avatarUrl: string;
    content: string;
    codePath?: string;
    codeLine?: number;
    replyToId?: string;
    gmtCreated: string;
    gmtUpdated: string;
    gmtResolved?: string;
    gmtHidden?: string;
}

export type ActivityAssignLabelVO = {
    id: string;
    userId: string;
    labelId: string;
    labelName: string;
    labelDescription: string;
    labelHexColor: string;
    gmtCreated: string;
}

export type AssigneeVO = {
    id: string;
    assigneeId: string;
    username: string;
    email: string;
    avatarUrl: string;
    gmtCreated: string;
}

export type IssueVO = ActivityFullInfoVO;
