import type { 
  ActivityFullInfoVO,  
  CommentFullInfoVO, 
  ActivityAssignLabelVO, 
  AssigneeVO, 
  PageVO 
} from '@/utils/responseVOTypes'
import { fetchWithRetry } from '@/utils/fetcher'
import { APIPaths } from '@/utils/constant'

export const useActivityApi = () => {
  // 获取Activity详细信息
  const getActivity = async (params: {
    id?: string
    activityNumber?: string
    repositoryId?: string
  }) => {
    const apiURL = new URL(APIPaths.ACTIVITY_GET_ACTIVITY_API_PATH, window.origin)
    if (params.id) apiURL.searchParams.append('id', params.id)
    if (params.activityNumber) apiURL.searchParams.append('activityNumber', params.activityNumber)
    if (params.repositoryId) apiURL.searchParams.append('repositoryId', params.repositoryId)
    
    return await fetchWithRetry<ActivityFullInfoVO>(apiURL.toString())
  }

  // 创建Activity
  const createActivity = async (data: {
    title: string
    description: string
    isPullRequest: boolean
    repositoryId: string
    parentId?: string
  }) => {
    return await fetchWithRetry(APIPaths.ACTIVITY_CREATE_ACTIVITY_API_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  }

  // 更新Activity内容
  const updateActivityContent = async (data: {
    id: string
    title: string
    description: string
    parentId?: string
  }) => {
    return await fetchWithRetry(APIPaths.ACTIVITY_UPDATE_ACTIVITY_CONTENT_API_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  }

  // 更新Activity锁定状态
  const updateActivityLockedState = async (id: string, isLocked: boolean) => {
    const apiURL = new URL(APIPaths.ACTIVITY_UPDATE_ACTIVITY_LOCKED_STATE_API_PATH, window.origin)
    apiURL.searchParams.append('id', id)
    apiURL.searchParams.append('isLocked', isLocked.toString())
    
    return await fetchWithRetry(apiURL.toString(), {
      method: 'POST'
    })
  }

  // 更新Activity关闭状态
  const updateActivityClosedState = async (id: string, isClosed: boolean) => {
    const apiURL = new URL(APIPaths.ACTIVITY_UPDATE_ACTIVITY_CLOSED_STATE_API_PATH, window.origin)
    apiURL.searchParams.append('id', id)
    apiURL.searchParams.append('isClosed', isClosed.toString())
    
    return await fetchWithRetry(apiURL.toString(), {
      method: 'POST'
    })
  }

  // 分页获取Activity列表
  const pageActivities = async (params: {
    page: number
    size: number
    repositoryId: string
    isPullRequest?: boolean
    isClosed?: boolean
    labels?: string[]
    assignees?: string[]
    author?: string
    orderBy?: string
    isAsc?: boolean
  }) => {
    const apiURL = new URL(APIPaths.ACTIVITY_PAGE_ACTIVITY_API_PATH, window.origin)
    apiURL.searchParams.append('page', params.page.toString())
    apiURL.searchParams.append('size', params.size.toString())
    
    return await fetchWithRetry<PageVO<ActivityFullInfoVO>>(apiURL.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        repositoryId: params.repositoryId,
        isPullRequest: params.isPullRequest,
        isClosed: params.isClosed,
        labels: params.labels,
        assignees: params.assignees,
        author: params.author,
        orderBy: params.orderBy,
        isAsc: params.isAsc
      })
    })
  }

  // 创建子问题
  const createSubIssue = async (data: {
    title: string
    description: string
    repositoryId: string
    parentId: string
  }) => {
    return await fetchWithRetry(APIPaths.ACTIVITY_CREATE_SUB_ISSUE_API_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...data,
        isPullRequest: false
      })
    })
  }

  // 添加子问题
  const addSubIssue = async (parentId: string, subIssueId: string) => {
    const apiURL = new URL(APIPaths.ACTIVITY_ADD_SUB_ISSUE_API_PATH, window.origin)
    apiURL.searchParams.append('parentId', parentId)
    apiURL.searchParams.append('subIssueId', subIssueId)
    
    return await fetchWithRetry(apiURL.toString(), {
      method: 'POST'
    })
  }

  // 移除子问题
  const removeSubIssue = async (subIssueId: string) => {
    const apiURL = new URL(APIPaths.ACTIVITY_REMOVE_SUB_ISSUE_API_PATH, window.origin)
    apiURL.searchParams.append('subIssueId', subIssueId)
    
    return await fetchWithRetry(apiURL.toString(), {
      method: 'DELETE'
    })
  }

  // 分页获取子问题
  const pageSubIssues = async (params: {
    page: number
    size: number
    parentId: string
  }) => {
    const apiURL = new URL(APIPaths.ACTIVITY_PAGE_SUB_ISSUE_API_PATH, window.origin)
    apiURL.searchParams.append('page', params.page.toString())
    apiURL.searchParams.append('size', params.size.toString())
    apiURL.searchParams.append('parentId', params.parentId)
    
    return await fetchWithRetry<PageVO<ActivityFullInfoVO>>(apiURL.toString())
  }

  // 创建评论
  const createComment = async (data: {
    content: string
    activityId: string
    replyToId?: string
  }) => {
    return await fetchWithRetry(APIPaths.ACTIVITY_CREATE_COMMENT_API_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  }

  // 更新评论内容
  const updateCommentContent = async (data: {
    id: string
    content: string
  }) => {
    return await fetchWithRetry(APIPaths.ACTIVITY_UPDATE_COMMENT_CONTENT_API_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  }

  // 更新评论解决状态
  const updateCommentResolvedState = async (id: string, isResolved: boolean) => {
    const apiURL = new URL(APIPaths.ACTIVITY_UPDATE_COMMENT_RESOLVED_STATE_API_PATH, window.origin)
    apiURL.searchParams.append('id', id)
    apiURL.searchParams.append('isResolved', isResolved.toString())
    
    return await fetchWithRetry(apiURL.toString(), {
      method: 'POST'
    })
  }

  // 更新评论隐藏状态
  const updateCommentHiddenState = async (id: string, isHidden: boolean) => {
    const apiURL = new URL(APIPaths.ACTIVITY_UPDATE_COMMENT_HIDDEN_STATE_API_PATH, window.origin)
    apiURL.searchParams.append('id', id)
    apiURL.searchParams.append('isHidden', isHidden.toString())
    
    return await fetchWithRetry(apiURL.toString(), {
      method: 'POST'
    })
  }

  // 删除评论
  const deleteComment = async (id: string) => {
    const apiURL = new URL(APIPaths.ACTIVITY_DELETE_COMMENT_API_PATH, window.origin)
    apiURL.searchParams.append('id', id)
    
    return await fetchWithRetry(apiURL.toString(), {
      method: 'DELETE'
    })
  }

  // 分页获取评论
  const pageComments = async (params: {
    activityId: string
    page: number
    size: number
  }) => {
    const apiURL = new URL(APIPaths.ACTIVITY_PAGE_COMMENT_API_PATH, window.origin)
    apiURL.searchParams.append('activityId', params.activityId)
    apiURL.searchParams.append('page', params.page.toString())
    apiURL.searchParams.append('size', params.size.toString())
    
    return await fetchWithRetry<PageVO<CommentFullInfoVO>>(apiURL.toString())
  }

  // 分页获取子评论
  const pageSubComments = async (params: {
    activityId: string
    replyToId: string
    page: number
    size: number
  }) => {
    const apiURL = new URL(APIPaths.ACTIVITY_PAGE_SUB_COMMENT_API_PATH, window.origin)
    apiURL.searchParams.append('activityId', params.activityId)
    apiURL.searchParams.append('replyToId', params.replyToId)
    apiURL.searchParams.append('page', params.page.toString())
    apiURL.searchParams.append('size', params.size.toString())
    
    return await fetchWithRetry<PageVO<CommentFullInfoVO>>(apiURL.toString())
  }

  // 添加标签
  const addLabel = async (activityId: string, labelId: string) => {
    const apiURL = new URL(APIPaths.ACTIVITY_ADD_LABEL_API_PATH, window.origin)
    apiURL.searchParams.append('activityId', activityId)
    apiURL.searchParams.append('labelId', labelId)
    
    return await fetchWithRetry(apiURL.toString(), {
      method: 'POST'
    })
  }

  // 移除标签
  const removeLabel = async (id: string) => {
    const apiURL = new URL(APIPaths.ACTIVITY_REMOVE_LABEL_API_PATH, window.origin)
    apiURL.searchParams.append('id', id)
    
    return await fetchWithRetry(apiURL.toString(), {
      method: 'DELETE'
    })
  }

  // 分页获取Activity的标签
  const pageActivityLabels = async (params: {
    activityId: string
    page: number
    size: number
  }) => {
    const apiURL = new URL(APIPaths.ACTIVITY_PAGE_LABEL_API_PATH, window.origin)
    apiURL.searchParams.append('activityId', params.activityId)
    apiURL.searchParams.append('page', params.page.toString())
    apiURL.searchParams.append('size', params.size.toString())
    
    return await fetchWithRetry<PageVO<ActivityAssignLabelVO>>(apiURL.toString())
  }

  // 添加负责人
  const addAssignee = async (activityId: string, assigneeId: string) => {
    const apiURL = new URL(APIPaths.ACTIVITY_ADD_ASSIGNEE_API_PATH, window.origin)
    apiURL.searchParams.append('activityId', activityId)
    apiURL.searchParams.append('assigneeId', assigneeId)
    
    return await fetchWithRetry(apiURL.toString(), {
      method: 'POST'
    })
  }

  // 移除负责人
  const removeAssignee = async (id: string) => {
    const apiURL = new URL(APIPaths.ACTIVITY_REMOVE_ASSIGNEE_API_PATH, window.origin)
    apiURL.searchParams.append('id', id)
    
    return await fetchWithRetry(apiURL.toString(), {
      method: 'DELETE'
    })
  }

  // 分页获取Activity的负责人
  const pageActivityAssignees = async (params: {
    activityId: string
    page: number
    size: number
  }) => {
    const apiURL = new URL(APIPaths.ACTIVITY_PAGE_ASSIGNEE_API_PATH, window.origin)
    apiURL.searchParams.append('activityId', params.activityId)
    apiURL.searchParams.append('page', params.page.toString())
    apiURL.searchParams.append('size', params.size.toString())
    
    return await fetchWithRetry<PageVO<AssigneeVO>>(apiURL.toString())
  }

  // 检查Activity操作权限
  const checkActivityOperationValidity = async (params: {
    id: string
    operationType: 'MODIFY_ACTIVITY' | 'MODIFY_COMMENT' | 'READ' | 'ATTACH_ACTIVITY'|'ATTACH_COMMENT'
  }) => {
    const apiURL = new URL(APIPaths.ACTIVITY_CHECK_OPERATION_VALIDITY_API_PATH, window.origin)
    apiURL.searchParams.append('id', params.id)
    apiURL.searchParams.append('operationType', params.operationType)
    
    return await fetchWithRetry(apiURL.toString())
  }

  // 检查评论操作权限
  const checkCommentOperationValidity = async (params: {
    id: string
    operationType: 'MODIFY_COMMENT' | 'READ' | 'ATTACH_COMMENT'
  }) => {
    const apiURL = new URL(APIPaths.ACTIVITY_CHECK_COMMENT_OPERATION_VALIDITY_API_PATH, window.origin)
    apiURL.searchParams.append('id', params.id)
    apiURL.searchParams.append('operationType', params.operationType)
    
    return await fetchWithRetry(apiURL.toString())
  }

  return {
    getActivity,
    createActivity,
    updateActivityContent,
    updateActivityLockedState,
    updateActivityClosedState,
    pageActivities,
    createSubIssue,
    addSubIssue,
    removeSubIssue,
    pageSubIssues,
    createComment,
    updateCommentContent,
    updateCommentResolvedState,
    updateCommentHiddenState,
    deleteComment,
    pageComments,
    pageSubComments,
    addLabel,
    removeLabel,
    pageActivityLabels,
    addAssignee,
    removeAssignee,
    pageActivityAssignees,
    checkActivityOperationValidity,
    checkCommentOperationValidity
  }
} 