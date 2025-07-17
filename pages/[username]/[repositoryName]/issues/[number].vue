<script setup lang="ts">
import type { ActivityFullInfoVO, CommentFullInfoVO, RepositoryDetailVO, LabelVO, CollaboratorVO } from "~/utils/responseVOTypes";
import { useActivityApi } from "~/composables/api/activity";
import { useLabelApi } from "~/composables/api/label";
import { APIPaths } from "~/utils/constant";
import { fetchWithRetry } from "~/utils/fetcher";
import { IconClose, IconPlus, IconExclamationCircleFill, IconCopy, IconSettings, IconLock, IconUnlock, IconCheck, IconEdit, IconDelete, IconEye, IconEyeInvisible } from "@arco-design/web-vue/es/icon";
import { Message, Modal } from "@arco-design/web-vue";
import SubIssuePie from "./SubIssuePie.vue";

const route = useRoute();
const router = useRouter();
const { 
  getActivity, 
  updateActivityContent, 
  updateActivityLockedState, 
  updateActivityClosedState,
  createComment,
  pageComments,
  addLabel,
  removeLabel,
  pageActivityLabels,
  addAssignee,
  removeAssignee,
  checkActivityOperationValidity,
  createSubIssue,
  addSubIssue,
  removeSubIssue,
  pageSubIssues,
  pageActivities,
  updateCommentContent,
  deleteComment,
  updateCommentHiddenState
} = useActivityApi();

const { getLabels } = useLabelApi();

const repository = ref<RepositoryDetailVO>();
const issue = ref<ActivityFullInfoVO>();
const loading = ref(false);
const comments = ref<CommentFullInfoVO[]>([]);
const currentCommentPage = ref(1);
const commentPageSize = ref(10);
const commentTotal = ref(0);

// 编辑状态
const isEditing = ref(false);
const editForm = reactive({
  title: '',
  content: ''
});

// 评论相关
const editingCommentId = ref<string | null>(null);
const editingCommentContent = ref('');

// 新评论
const newComment = ref('');

// 标签相关
const availableLabels = ref<LabelVO[]>([]);
const assignedLabels = ref<ActivityAssignLabelVO[]>([]);
const labelModalVisible = ref(false);

// 负责人相关
const availableAssignees = ref<CollaboratorVO[]>([]);
const assigneeModalVisible = ref(false);

// 子问题相关
const subIssues = ref<IssueVO[]>([]);
const subIssuesLoading = ref(false);
const createSubIssueModalVisible = ref(false);
const addSubIssueModalVisible = ref(false);
const subIssueForm = reactive({
  title: '',
  description: ''
});

// 添加子问题相关
const availableIssues = ref<IssueVO[]>([]);
const availableIssuesLoading = ref(false);
const selectedIssueId = ref<string>('');
const issueSearch = ref('');

// 权限相关
const permissionErrorVisible = ref(false);
const permissionErrorMessage = ref('');
const hasModifyPermission = ref(false);
const hasCommentPermission = ref(false);
const permissionLoading = ref(false);

// 获取仓库信息
const fetchRepositoryDetails = async () => {
  const apiURL = new URL(APIPaths.REPOSITORY_GET_REPOSITORY_API_PATH, window.origin);
  apiURL.searchParams.append("username", route.params.username as string);
  apiURL.searchParams.append("repositoryName", route.params.repositoryName as string);
  
  repository.value = await fetchWithRetry<RepositoryDetailVO>(apiURL.toString()).catch((error) => {
    tryThrowAndShowError(error, "没有找到仓库：" + route.params.repositoryName);
    return undefined;
  });
};

// 获取仓库标签列表
const fetchRepositoryLabels = async () => {
  if (!repository.value) return;
  
  try {
    const response = await getLabels(repository.value.id, 1, 100, 'GMT_CREATED', false);
    availableLabels.value = response.records;
  } catch (error) {
    tryThrowAndShowError(error, '获取标签列表失败');
  }
};

// 获取仓库协作者列表
const fetchRepositoryCollaborators = async () => {
  if (!repository.value) return;
  
  try {
    const apiURL = new URL(APIPaths.REPOSITORY_PAGE_COLLABORATOR_API_PATH, window.origin);
    apiURL.searchParams.append('repositoryId', repository.value.id);
    apiURL.searchParams.append('page', '1');
    apiURL.searchParams.append('size', '100');
    apiURL.searchParams.append('orderBy', 'GMT_CREATED');
    apiURL.searchParams.append('isAsc', 'false');
    
    const response = await fetchWithRetry<{ total: number; records: CollaboratorVO[] }>(apiURL.toString());
    availableAssignees.value = response.records;
    
    // 添加仓库创建者
    availableAssignees.value.unshift({
      id: repository.value.userId,
      collaboratorId: repository.value.userId,
      username: repository.value.username,
      email: '',
      avatarUrl: ''
    });
  } catch (error) {
    tryThrowAndShowError(error, '获取协作者列表失败');
  }
};

// 检查修改权限
const checkModifyPermission = async () => {
  if (!issue.value) return;
  
  permissionLoading.value = true;
  try {
    await checkActivityOperationValidity({
      id: issue.value.id,
      operationType: 'MODIFY'
    });
    hasModifyPermission.value = true;
  } catch (error: any) {
    // 如果是权限错误，设置权限为false
    if (error.data?.code === 7) {
      hasModifyPermission.value = false;
    } else {
      // 其他错误，默认有权限（避免因为网络等问题影响用户体验）
      hasModifyPermission.value = true;
    }
  } finally {
    permissionLoading.value = false;
  }
};

// 检查评论权限
const checkCommentPermission = async () => {
  if (!issue.value) return;
  
  try {
    await checkActivityOperationValidity({
      id: issue.value.id,
      operationType: 'CREATE'
    });
    hasCommentPermission.value = true;
  } catch (error: any) {
    // 如果是权限错误，设置权限为false
    if (error.data?.code === 7) {
      hasCommentPermission.value = false;
    } else {
      // 其他错误，默认有权限（避免因为网络等问题影响用户体验）
      hasCommentPermission.value = true;
    }
  }
};

// 检查评论修改权限
const checkCommentModifyPermission = async (commentId: string) => {
  try {
    // 这里需要检查当前用户是否有权限修改该评论
    // 由于后端API需要activityId，我们需要先获取评论信息
    const comment = comments.value.find(c => c.id === commentId);
    if (!comment) return false;
    
    // 检查是否是评论作者或有修改权限
    const currentUser = useUserInfo().value;
    if (comment.userId === currentUser.id) {
      return true;
    }
    
    // 如果不是作者，检查是否有修改权限
    await checkActivityOperationValidity({
      id: comment.activityId,
      operationType: 'MODIFY'
    });
    return true;
  } catch (error: any) {
    if (error.data?.code === 7) {
      return false;
    }
    return false;
  }
};

// 开始编辑评论
const startEditComment = async (comment: CommentFullInfoVO) => {
  const hasPermission = await checkCommentModifyPermission(comment.id);
  if (!hasPermission) {
    Message.error('您没有权限编辑此评论');
    return;
  }
  
  editingCommentId.value = comment.id;
  editingCommentContent.value = comment.content;
};

// 保存评论编辑
const saveCommentEdit = async () => {
  if (!editingCommentId.value || !editingCommentContent.value.trim()) return;
  
  try {
    await updateCommentContent({
      id: editingCommentId.value,
      content: editingCommentContent.value
    });
    
    Message.success('评论更新成功');
    editingCommentId.value = null;
    editingCommentContent.value = '';
    
    // 重新获取评论列表
    await fetchComments();
  } catch (error: any) {
    if (error.data?.code === 7) {
      Message.error('您没有权限编辑此评论');
    } else {
      tryThrowAndShowError(error, '更新评论失败');
    }
  }
};

// 取消评论编辑
const cancelCommentEdit = () => {
  editingCommentId.value = null;
  editingCommentContent.value = '';
};

// 删除评论
const deleteCommentById = async (commentId: string) => {
  try {
    await Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条评论吗？此操作不可撤销。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { status: 'danger' },
      onBeforeOk: async () => {
        try {
          await deleteComment(commentId);
          Message.success('评论删除成功');
          
          // 重新获取评论列表
          await fetchComments();
          return true; // 返回true表示操作成功，Modal会关闭
        } catch (error: any) {
          if (error.data?.code === 7) {
            Message.error('您没有权限删除此评论');
          } else {
            tryThrowAndShowError(error, '删除评论失败');
          }
          return false; // 返回false表示操作失败，Modal不会关闭
        }
      }
    });
  } catch (error: any) {
    // 这里处理Modal.confirm本身的错误（比如用户取消）
    console.log('用户取消删除操作');
  }
};

// 检查是否可以编辑/删除评论
const canModifyComment = (comment: CommentFullInfoVO) => {
  const currentUser = useUserInfo().value;
  return comment.userId === currentUser.id || hasModifyPermission.value;
};

// 检查是否可以隐藏/显示评论
const canHideComment = (comment: CommentFullInfoVO) => {
  const currentUser = useUserInfo().value;
  // 只有有修改权限的用户可以隐藏评论
  return hasModifyPermission.value;
};

// 获取问题详情
const fetchIssueDetails = async () => {
  if (!repository.value) return;
  
  loading.value = true;
  try {
    issue.value = await getActivity({
      activityNumber: route.params.number as string,
      repositoryId: repository.value.id
    });
    
    // 获取评论
    await fetchComments();
    
    // 获取已分配的标签
    await fetchAssignedLabels();
    
    // 获取子问题列表
    await fetchSubIssues();
    
    // 检查修改权限
    await checkModifyPermission();
    
    // 检查评论权限
    await checkCommentPermission();
  } catch (error) {
    tryThrowAndShowError(error, '获取问题详情失败');
  } finally {
    loading.value = false;
  }
};

// 获取评论
const fetchComments = async () => {
  if (!issue.value) return;
  
  try {
    const response = await pageComments({
      activityId: issue.value.id,
      page: currentCommentPage.value,
      size: commentPageSize.value
    });
    
    comments.value = response.records;
    commentTotal.value = response.total;
  } catch (error) {
    tryThrowAndShowError(error, '获取评论失败');
  }
};

// 获取已分配的标签
const fetchAssignedLabels = async () => {
  if (!issue.value) return;
  
  try {
    const response = await pageActivityLabels({
      activityId: issue.value.id,
      page: 1,
      size: 100
    });
    
    assignedLabels.value = response.records;
  } catch (error) {
    tryThrowAndShowError(error, '获取已分配标签失败');
  }
};

// 获取子问题列表
const fetchSubIssues = async () => {
  if (!issue.value) return;
  
  subIssuesLoading.value = true;
  try {
    const response = await pageSubIssues({
      parentId: issue.value.id,
      page: 1,
      size: 100
    });
    
    subIssues.value = response.records;
  } catch (error) {
    tryThrowAndShowError(error, '获取子问题列表失败');
  } finally {
    subIssuesLoading.value = false;
  }
};

// 创建子问题
const handleCreateSubIssue = async () => {
  if (!issue.value || !subIssueForm.title.trim()) return;
  
  try {
    await createSubIssue({
      title: subIssueForm.title,
      description: subIssueForm.description,
      repositoryId: issue.value.repositoryId,
      parentId: issue.value.id
    });
    
    Message.success('子问题创建成功');
    createSubIssueModalVisible.value = false;
    subIssueForm.title = '';
    subIssueForm.description = '';
    
    // 重新获取子问题列表
    await fetchSubIssues();
  } catch (error: any) {
    if (error.data?.code === 7) {
      showPermissionError('您没有权限创建子问题');
    } else {
      tryThrowAndShowError(error, '创建子问题失败');
    }
  }
};

// 打开添加子问题模态框
const openAddSubIssueModal = async () => {
  addSubIssueModalVisible.value = true;
  selectedIssueId.value = '';
  issueSearch.value = '';
  await fetchAvailableIssues();
};

// 跳转到子问题详情页面
const goToSubIssue = (subIssue: any) => {
  router.push({
    path: `/${route.params.username}/${route.params.repositoryName}/issues/${subIssue.number}`
  });
};

// 添加现有子问题
const addExistingSubIssue = async (subIssueId: string) => {
  if (!issue.value || !subIssueId) return;
  
  try {
    await addSubIssue(issue.value.id, subIssueId);
    Message.success('子问题添加成功');
    addSubIssueModalVisible.value = false;
    selectedIssueId.value = '';
    
    // 重新获取子问题列表
    await fetchSubIssues();
  } catch (error: any) {
    if (error.data?.code === 7) {
      showPermissionError('您没有权限添加子问题');
    } else {
      tryThrowAndShowError(error, '添加子问题失败');
    }
  }
};

// 移除子问题
const removeSubIssueFromIssue = async (subIssueId: string) => {
  try {
    await removeSubIssue(subIssueId);
    Message.success('子问题移除成功');
    
    // 重新获取子问题列表
    await fetchSubIssues();
  } catch (error: any) {
    if (error.data?.code === 7) {
      showPermissionError('您没有权限移除子问题');
    } else {
      tryThrowAndShowError(error, '移除子问题失败');
    }
  }
};

// 计算子问题完成情况
const subIssuesProgress = computed(() => {
  const total = subIssues.value.length;
  const completed = subIssues.value.filter(subIssue => 
    subIssue.gmtClosed && subIssue.gmtClosed !== 'null'
  ).length;
  
  return { total, completed };
});

// 获取仓库问题列表（用于添加子问题）
const fetchAvailableIssues = async () => {
  if (!repository.value) return;
  
  availableIssuesLoading.value = true;
  try {
    const response = await pageActivities({
      page: 1,
      size: 100,
      repositoryId: repository.value.id,
      isPullRequest: false
    });
    
    // 过滤掉当前问题和已经是子问题的问题
    const currentIssueId = issue.value?.id;
    const existingSubIssueIds = subIssues.value.map(sub => sub.id);
    
    availableIssues.value = response.records.filter(issue => 
      issue.id !== currentIssueId && !existingSubIssueIds.includes(issue.id)
    );
  } catch (error) {
    tryThrowAndShowError(error, '获取问题列表失败');
  } finally {
    availableIssuesLoading.value = false;
  }
};

// 过滤可用问题（根据搜索关键词）
const filteredAvailableIssues = computed(() => {
  if (!issueSearch.value) return availableIssues.value;
  
  return availableIssues.value.filter((issue: IssueVO) => 
    issue.title.toLowerCase().includes(issueSearch.value.toLowerCase()) ||
    issue.number.includes(issueSearch.value)
  );
});

// 开始编辑
const startEdit = () => {
  editForm.title = issue.value?.title || '';
  editForm.content = issue.value?.description || '';
  isEditing.value = true;
};

// 保存编辑
const saveEdit = async () => {
  if (!issue.value) return;
  
  try {
    await updateActivityContent({
      id: issue.value.id,
      title: editForm.title,
      description: editForm.content
    });
    
    Message.success('更新成功');
    isEditing.value = false;
    
    // 重新获取问题详情以确保显示最新数据
    await fetchIssueDetails();
  } catch (error: any) {
    // 检查是否是权限错误
    if (error.data?.code === 7) {
      showPermissionError('您没有权限编辑此问题');
    } else {
      tryThrowAndShowError(error, '更新失败');
    }
  }
};

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false;
};

// 切换锁定状态
const toggleLocked = async () => {
  if (!issue.value) return;
  try {
    // 修正锁定状态判断逻辑
    const isCurrentlyLocked = !!(issue.value.gmtLocked && issue.value.gmtLocked !== 'null');
    await updateActivityLockedState(issue.value.id, !isCurrentlyLocked);
    Message.success(isCurrentlyLocked ? '已解锁' : '已锁定');
    await fetchIssueDetails();
    // 重新检查评论权限
    await checkCommentPermission();
  } catch (error: any) {
    // 检查是否是权限错误
    if (error.data?.code === 7) {
      showPermissionError('您没有权限执行此操作');
    } else {
      tryThrowAndShowError(error, '操作失败');
    }
  }
};

// 切换关闭状态
const toggleClosed = async () => {
  if (!issue.value) return;
  
  try {
    // 根据gmtClosed是否有值来判断当前状态
    const isCurrentlyClosed = !!(issue.value.gmtClosed && issue.value.gmtClosed !== 'null');
    console.log('当前状态:', isCurrentlyClosed ? '已关闭' : '开放', 'gmtClosed:', issue.value.gmtClosed);
    
    // 发送相反的状态
    await updateActivityClosedState(issue.value.id, !isCurrentlyClosed);
    Message.success(isCurrentlyClosed ? '已重新打开' : '已关闭');
    
    // 强制刷新数据，添加延迟确保后端处理完成
    setTimeout(async () => {
      await fetchIssueDetails();
      console.log('刷新后状态:', !!(issue.value?.gmtClosed && issue.value?.gmtClosed !== 'null') ? '已关闭' : '开放', 'gmtClosed:', issue.value?.gmtClosed);
      
      // 强制触发响应式更新
      if (issue.value) {
        const temp = { ...issue.value };
        issue.value = temp;
      }
      
      // 重新检查评论权限
      await checkCommentPermission();
    },500);
  } catch (error: any) {
    // 检查是否是权限错误
    if (error.data?.code === 7) {
      showPermissionError('您没有权限执行此操作');
    } else {
      tryThrowAndShowError(error, '操作失败');
    }
  }
};

// 添加评论
const addComment = async () => {
  if (!issue.value || !newComment.value.trim()) return;
  
  if (!hasCommentPermission.value) {
    Message.error('您没有权限添加评论');
    return;
  }
  
  try {
    await createComment({
      content: newComment.value,
      activityId: issue.value.id
    });
    
    Message.success('评论成功');
    newComment.value = '';
    await fetchComments();
  } catch (error: any) {
    // 检查是否是权限错误
    if (error.data?.code === 7) {
      Message.error('您没有权限添加评论');
      // 重新检查评论权限
      await checkCommentPermission();
    } else {
      tryThrowAndShowError(error, '评论失败');
    }
  }
};

// 标签相关方法
const openLabelModal = async () => {
  await fetchRepositoryLabels();
  labelModalVisible.value = true;
};

const closeLabelModal = () => {
  labelModalVisible.value = false;
};

const addLabelToIssue = async (labelId: string) => {
  if (!issue.value) return;
  
  try {
    await addLabel(issue.value.id, String(labelId));
    Message.success('标签添加成功');
    await fetchIssueDetails();
  } catch (error: any) {
    // 检查是否是权限错误
    if (error.data?.code === 7) {
      showPermissionError('您没有权限添加标签');
    } else {
      tryThrowAndShowError(error, '添加标签失败');
    }
  }
};

const removeLabelFromIssue = async (activityAssignLabelId: string) => {
  try {
    await removeLabel(String(activityAssignLabelId));
    Message.success('标签移除成功');
    await fetchIssueDetails();
  } catch (error: any) {
    // 检查是否是权限错误
    if (error.data?.code === 7) {
      showPermissionError('您没有权限移除标签');
    } else {
      tryThrowAndShowError(error, '移除标签失败');
    }
  }
};

// 跳转到标签管理页面
const goToLabelManagement = () => {
  closeLabelModal();
  router.push({
    path: `/${route.params.username}/${route.params.repositoryName}/settings/labels`
  });
};

// 负责人相关方法
const openAssigneeModal = async () => {
  await fetchRepositoryCollaborators();
  assigneeModalVisible.value = true;
};

const closeAssigneeModal = () => {
  assigneeModalVisible.value = false;
};

const addAssigneeToIssue = async (assigneeId: string) => {
  if (!issue.value) return;
  
  try {
    await addAssignee(issue.value.id, assigneeId);
    Message.success('负责人添加成功');
    await fetchIssueDetails();
  } catch (error: any) {
    // 检查是否是权限错误
    if (error.data?.code === 7) {
      showPermissionError('您没有权限添加负责人');
    } else {
      tryThrowAndShowError(error, '添加负责人失败');
    }
  }
};

const removeAssigneeFromIssue = async (assigneeId: string) => {
  try {
    await removeAssignee(assigneeId);
    Message.success('负责人移除成功');
    await fetchIssueDetails();
  } catch (error: any) {
    // 检查是否是权限错误
    if (error.data?.code === 7) {
      showPermissionError('您没有权限移除负责人');
    } else {
      tryThrowAndShowError(error, '移除负责人失败');
    }
  }
};

// 检查标签是否已添加
const isLabelAdded = (labelId: string) => {
  return assignedLabels.value?.some(assignedLabel => assignedLabel.labelId === labelId) || false;
};

// 获取已分配标签的ActivityAssignLabelVO id
const getAssignedLabelId = (labelId: string) => {
  const assignedLabel = assignedLabels.value?.find(assignedLabel => assignedLabel.labelId === labelId);
  return assignedLabel?.id;
};

// 获取已分配负责人的AssigneeVO id
const getAssignedAssigneeId = (collaboratorId: string) => {
  const assignedAssignee = issue.value?.assignees?.find(assignee => assignee.assigneeId === collaboratorId);
  return assignedAssignee?.id;
};

// 检查负责人是否已添加
const isAssigneeAdded = (assigneeId: string) => {
  return issue.value?.assignees?.some(assignee => assignee.assigneeId === assigneeId) || false;
};

// 显示权限错误提示
const showPermissionError = (message: string) => {
  permissionErrorMessage.value = message;
  permissionErrorVisible.value = true;
  // 3秒后自动隐藏
  setTimeout(() => {
    permissionErrorVisible.value = false;
  }, 3000);
};

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN');
};

// 创建新issue
const createNewIssue = () => {
  router.push({
    path: `/${route.params.username}/${route.params.repositoryName}/issues/new`
  });
};

// 复制issue地址
const copyIssueUrl = async () => {
  const issueUrl = window.location.href;
  try {
    await navigator.clipboard.writeText(issueUrl);
    // 可以添加一个提示消息
    console.log('问题地址已复制到剪贴板');
  } catch (err) {
    console.error('复制失败:', err);
  }
};

// 切换评论隐藏状态
const toggleCommentHidden = async (commentId: string) => {
  try {
    const comment = comments.value.find(c => c.id === commentId);
    if (!comment) return;
    
    // 检查权限
    if (!canHideComment(comment)) {
      Message.error('您没有权限修改此评论状态');
      return;
    }
    
    const isCurrentlyHidden = !!(comment.gmtHidden && comment.gmtHidden !== 'null');
    
    await updateCommentHiddenState(commentId, !isCurrentlyHidden);
    Message.success(isCurrentlyHidden ? '评论已显示' : '评论已隐藏');
    
    // 重新获取评论列表
    await fetchComments();
  } catch (error: any) {
    if (error.data?.code === 7) {
      Message.error('您没有权限修改此评论状态');
    } else {
      tryThrowAndShowError(error, '修改评论状态失败');
    }
  }
};

// 检查评论是否隐藏
const isCommentHidden = (comment: CommentFullInfoVO) => {
  return !!(comment.gmtHidden && comment.gmtHidden !== 'null');
};

onMounted(async () => {
  await initialize();
  if (!useUserInfo().value.id) {
    useRedirectAfterLogin().value = route.fullPath;
    router.push("/login");
    return;
  }
  await fetchRepositoryDetails();
  await fetchIssueDetails();
});
</script>

<template>
  <div class="issue-detail-page" v-if="issue">
    <!-- 权限检查加载状态 -->
    <a-spin :loading="permissionLoading" tip="检查权限中..." style="width: 100%;">
      <div class="issue-layout">
        <div class="issue-main-content">
          <!-- 问题头部 -->
          <div class="issue-header">
            <div class="issue-title-section">
              <a-typography-title :heading="2" style="display: flex; align-items: center; gap: 12px;">
                <a-typography-text v-if="!isEditing">{{ issue.title }}</a-typography-text>
                <a-input v-else v-model="editForm.title" placeholder="问题标题" />
                <span v-if="!isEditing" style="font-size: 20px; color: #656d76; font-weight: 400;">#{{ issue.number }}</span>
              </a-typography-title>
              <div class="issue-meta">
                <span
                  class="status-dot"
                  :style="{ background: (issue.gmtClosed && issue.gmtClosed !== 'null') ? '#cf222e' : '#1a7f37', display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', marginRight: '8px', verticalAlign: 'middle' }"
                ></span>
                <a-tag :color="(issue.gmtClosed && issue.gmtClosed !== 'null') ? '#cf222e' : '#1a7f37'" style="border-radius: 12px; font-weight: 500; padding: 2px 8px;">
                  {{ (issue.gmtClosed && issue.gmtClosed !== 'null') ? '已关闭' : '开放' }}
                </a-tag>
                <!-- 子问题饼状图 -->
                <div v-if="subIssuesProgress.total > 0" class="issue-sub-issues-progress">
                  <SubIssuePie 
                    :sub-issues="[]" 
                    :total="subIssuesProgress.total" 
                    :completed="subIssuesProgress.completed"
                  />
                  <span class="issue-sub-issues-count">{{ subIssuesProgress.completed }}/{{ subIssuesProgress.total }}</span>
                </div>
              </div>
            </div>
            
            <div class="issue-actions">
              <a-space>
                <a-button v-if="!isEditing && hasModifyPermission" @click="startEdit">编辑</a-button>
                <a-button v-if="isEditing" type="primary" @click="saveEdit">保存</a-button>
                <a-button v-if="isEditing" @click="cancelEdit">取消</a-button>
                <a-button type="primary" @click="createNewIssue">
                  <template #icon><icon-plus /></template>
                  新建问题
                </a-button>
                <a-button @click="copyIssueUrl">
                  <template #icon><icon-copy /></template>
                  复制地址
                </a-button>
              </a-space>
            </div>
          </div>

          <!-- 问题内容 -->
          <a-card class="issue-content-card">
            <template #title>
              <div style="display: flex; align-items: center; gap: 12px; width: 100%; background: #f1f8ff; border-radius: 6px; padding: 8px 16px;">
                <span style="color: #24292f;">问题描述</span>
                <span style="font-size: 13px; color: #24292f; font-weight: 500;">
                  由 {{ issue.username }} 创建于 {{ formatTime(issue.gmtCreated) }}
                </span>
              </div>
            </template>
            <div v-if="!isEditing" class="issue-content">
              <a-typography-paragraph>{{ issue.description }}</a-typography-paragraph>
            </div>
            <div v-else>
              <a-textarea
                v-model="editForm.content"
                placeholder="问题描述"
                :rows="10"
              />
            </div>
          </a-card>

          <!-- 子问题区域 -->
          <a-card class="sub-issues-card">
            <template #title>
              <div class="sub-issues-header">
                <icon-down style="margin-right: 8px; color: #586069;" />
                <span style="font-weight: 600;">子问题</span>
                <div v-if="subIssuesProgress.total > 0" class="sub-issues-progress" style="display: flex; align-items: center; gap: 4px; margin-left: 12px;">
                  <SubIssuePie 
                    :sub-issues="[]" 
                    :total="subIssuesProgress.total" 
                    :completed="subIssuesProgress.completed"
                  />
                  <span class="sub-issues-count">{{ subIssuesProgress.completed }} of {{ subIssuesProgress.total }}</span>
                </div>
              </div>
            </template>
            
            <a-spin :loading="subIssuesLoading" style="width: 100%;">
              <div v-if="subIssues.length > 0" class="sub-issues-list" style="width: 100%; margin: 0; padding: 0;">
                <div v-for="subIssue in subIssues" :key="subIssue.id" class="sub-issue-item">
                  <div class="sub-issue-status" style="margin-right: 12px;">
                    <span
                      class="status-dot"
                      :style="{ 
                        background: (subIssue.gmtClosed && subIssue.gmtClosed !== 'null') ? '#cf222e' : '#1a7f37',
                        display: 'inline-block', 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        marginRight: '8px', 
                        verticalAlign: 'middle' 
                      }"
                    ></span>
                  </div>
                  <div class="sub-issue-content" @click="goToSubIssue(subIssue)" style="flex: 1; min-width: 0; cursor: pointer;">
                    <div class="sub-issue-title-row" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                      <a-typography-text class="sub-issue-title" style="font-size: 14px; color: #24292f; cursor: pointer;">
                        {{ subIssue.title }} #{{ subIssue.number }}
                      </a-typography-text>
                      <!-- 子问题的子问题饼状图 -->
                      <div v-if="(subIssue as any).subIssueTotalCount && parseInt((subIssue as any).subIssueTotalCount) > 0" class="sub-issue-sub-progress" style="display: flex; align-items: center; gap: 4px; padding: 2px 6px; background: #f1f3f4; border-radius: 12px; font-size: 12px; color: #656d76;">
                        <SubIssuePie 
                          :sub-issues="[]" 
                          :total="parseInt((subIssue as any).subIssueTotalCount)" 
                          :completed="parseInt((subIssue as any).subIssueCompletedCount || '0')"
                        />
                        <span class="sub-issue-sub-count" style="font-size: 12px; color: #656d76; font-weight: 500;">{{ (subIssue as any).subIssueCompletedCount || '0' }}/{{ (subIssue as any).subIssueTotalCount }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="sub-issue-actions" style="margin-left: 12px;">
                    <a-dropdown v-if="hasModifyPermission">
                      <a-button type="text" size="mini">
                        <template #icon><icon-down /></template>
                      </a-button>
                      <template #content>
                        <a-doption @click="removeSubIssueFromIssue(subIssue.id)">
                          <icon-close style="margin-right: 4px;" />
                          移除子问题
                        </a-doption>
                      </template>
                    </a-dropdown>
                  </div>
                </div>
              </div>
              <div v-else class="sub-issues-empty">
                <a-typography-text type="secondary">暂无子问题</a-typography-text>
              </div>
            </a-spin>
            
            <div v-if="hasModifyPermission" class="sub-issues-actions">
              <a-dropdown>
                <a-button type="primary" size="small">
                  创建子问题
                  <template #icon><icon-down /></template>
                </a-button>
                <template #content>
                  <a-doption @click="createSubIssueModalVisible = true">
                    <icon-plus style="margin-right: 4px;" />
                    新建子问题
                  </a-doption>
                  <a-doption @click="openAddSubIssueModal">
                    <icon-plus style="margin-right: 4px;" />
                    添加现有子问题
                  </a-doption>
                </template>
              </a-dropdown>
            </div>
          </a-card>

          <!-- 评论区域 -->
          <a-card class="comments-card">
            <template #title>
              评论 ({{ commentTotal }})
              <span v-if="(issue.gmtLocked && issue.gmtLocked !== 'null')" class="comment-status-locked">
                <icon-lock style="margin-left: 8px; color: #cf222e;" />
                已锁定
              </span>
              <span v-if="(issue.gmtClosed && issue.gmtClosed !== 'null')" class="comment-status-closed">
                <icon-close style="margin-left: 8px; color: #cf222e;" />
                已关闭
              </span>
            </template>
            
            <!-- 添加评论 -->
            <div v-if="hasCommentPermission" class="add-comment">
              <a-textarea
                v-model="newComment"
                placeholder="添加评论..."
                :rows="3"
              />
              <a-button type="primary" class="mt-2" @click="addComment">
                添加评论
              </a-button>
            </div>
            
            <!-- 评论权限提示 -->
            <div v-else class="comment-permission-notice">
              <a-alert
                v-if="(issue.gmtLocked && issue.gmtLocked !== 'null')"
                type="warning"
                :closable="false"
                show-icon
              >
                <template #icon><icon-lock /></template>
                此问题已被锁定，无法添加评论
              </a-alert>
              <a-alert
                v-else-if="(issue.gmtClosed && issue.gmtClosed !== 'null')"
                type="warning"
                :closable="false"
                show-icon
              >
                <template #icon><icon-close /></template>
                此问题已被关闭，无法添加评论
              </a-alert>
              <a-alert
                v-else
                type="warning"
                :closable="false"
                show-icon
              >
                <template #icon><icon-exclamation-circle-fill /></template>
                您没有权限在此问题下添加评论
              </a-alert>
            </div>

            <!-- 评论列表 -->
            <div class="comments-list">
              <div v-for="comment in comments" :key="comment.id" class="comment-item" :class="{ 'comment-hidden': isCommentHidden(comment) }">
                <div class="comment-header">
                  <div class="comment-info">
                    <a-avatar :image-url="comment.avatarUrl" :size="24" />
                    <a-typography-text bold class="ml-2">{{ comment.username }}</a-typography-text>
                    <a-typography-text type="secondary" class="ml-2">
                      {{ formatTime(comment.gmtCreated) }}
                    </a-typography-text>
                    <a-tag v-if="isCommentHidden(comment)" color="#cf222e" size="small" style="border-radius: 12px; font-weight: 500; padding: 2px 8px; border: none; color: #ffffff;">
                      <template #icon><icon-eye-invisible /></template>
                      已隐藏
                    </a-tag>
                  </div>
                  <div class="comment-actions">
                    <a-space>
                      <!-- 隐藏/显示按钮 -->
                      <a-button v-if="canHideComment(comment)" type="text" size="small" @click="toggleCommentHidden(comment.id)" :style="{ color: isCommentHidden(comment) ? '#1a7f37' : '#cf222e' }">
                        <template #icon>
                          <icon-eye v-if="isCommentHidden(comment)" />
                          <icon-eye-invisible v-else />
                        </template>
                        {{ isCommentHidden(comment) ? '显示' : '隐藏' }}
                      </a-button>
                      
                      <!-- 编辑/删除按钮 -->
                      <a-button v-if="canModifyComment(comment) && editingCommentId === comment.id" type="primary" size="small" @click="saveCommentEdit">保存</a-button>
                      <a-button v-if="canModifyComment(comment) && editingCommentId === comment.id" size="small" @click="cancelCommentEdit">取消</a-button>
                      <a-button v-if="canModifyComment(comment) && editingCommentId === comment.id" type="text" size="small" @click="deleteCommentById(comment.id)" style="color: #f53f3f;">
                        <template #icon><icon-delete /></template>
                        删除
                      </a-button>
                      <a-button v-if="canModifyComment(comment) && editingCommentId !== comment.id" type="text" size="small" @click="startEditComment(comment)">
                        <template #icon><icon-edit /></template>
                        编辑
                      </a-button>
                    </a-space>
                  </div>
                </div>
                <div class="comment-content" v-if="!isCommentHidden(comment)">
                  <div v-if="editingCommentId === comment.id" class="comment-edit-form">
                    <a-textarea
                      v-model="editingCommentContent"
                      :rows="3"
                      :max-length="1000"
                      show-word-limit
                      placeholder="编辑评论内容..."
                    />
                  </div>
                  <a-typography-paragraph v-else>{{ comment.content }}</a-typography-paragraph>
                </div>
                <div v-else-if="isCommentHidden(comment)" class="comment-hidden-placeholder">
                  <a-typography-text type="secondary" style="font-style: italic;">
                    此评论已被隐藏
                  </a-typography-text>
                </div>
              </div>
            </div>
          </a-card>
        </div>

        <div class="issue-sidebar">
          <a-typography-title :heading="5" class="sidebar-title">详细信息</a-typography-title>
          
          <!-- 标签 -->
          <div class="sidebar-section">
            <div class="section-header">
              <a-typography-text bold style="font-weight: 700;">标签</a-typography-text>
              <a-button v-if="hasModifyPermission" type="text" size="mini" @click="openLabelModal">
                <template #icon><icon-plus /></template>
              </a-button>
            </div>
            <div class="labels-list">
              <template v-if="assignedLabels && assignedLabels.length > 0">
                <a-tag
                  v-for="assignedLabel in assignedLabels"
                  :key="assignedLabel.id"
                  :color="assignedLabel.labelHexColor"
                  size="small"
                  class="github-style-label"
                  style="border-radius: 12px; font-weight: 500; padding: 2px 8px; border: none; color: #ffffff;"
                >
                  {{ assignedLabel.labelName }}
                </a-tag>
              </template>
              <template v-else>
                <a-typography-text type="secondary" bold>没有标签</a-typography-text>
              </template>
            </div>
          </div>

          <!-- 负责人 -->
          <div class="sidebar-section">
            <div class="section-header">
              <a-typography-text bold style="font-weight: 700;">负责人</a-typography-text>
              <a-button v-if="hasModifyPermission" type="text" size="mini" @click="openAssigneeModal">
                <template #icon><icon-plus /></template>
              </a-button>
            </div>
            <div class="assignees-list">
              <template v-if="issue.assignees && issue.assignees.length > 0">
                <div v-for="assignee in issue.assignees" :key="assignee.id" class="assignee-item">
                  <a-avatar :image-url="assignee.avatarUrl" :size="24" />
                  <a-typography-text class="ml-2">{{ assignee.username }}</a-typography-text>
                </div>
              </template>
              <template v-else>
                <a-typography-text type="secondary" bold>没有负责人</a-typography-text>
              </template>
            </div>
          </div>

          <!-- 操作 -->
          <div class="sidebar-section" v-if="hasModifyPermission">
            <div class="section-header">
              <a-typography-text bold>操作</a-typography-text>
            </div>
            <div class="sidebar-actions">
              <a-button 
                @click="toggleLocked"
                :type="(issue.gmtLocked && issue.gmtLocked !== 'null') ? 'primary' : 'outline'"
                size="large"
                long
                style="border-radius: 6px; font-weight: 500; margin-bottom: 8px; height: 36px;"
              >
                <template #icon>
                  <icon-lock v-if="!(issue.gmtLocked && issue.gmtLocked !== 'null')" />
                  <icon-unlock v-else />
                </template>
                {{ (issue.gmtLocked && issue.gmtLocked !== 'null') ? '解锁问题' : '锁定问题' }}
              </a-button>
              <a-button 
                @click="toggleClosed"
                :type="(issue.gmtClosed && issue.gmtClosed !== 'null') ? 'primary' : 'outline'"
                size="large"
                long
                style="border-radius: 6px; font-weight: 500; height: 36px;"
                status="danger"
                class="mt-2"
              >
                <template #icon>
                  <icon-close v-if="!(issue.gmtClosed && issue.gmtClosed !== 'null')" />
                  <icon-check v-else />
                </template>
                {{ (issue.gmtClosed && issue.gmtClosed !== 'null') ? '重新打开问题' : '关闭问题' }}
              </a-button>
            </div>
          </div>
        </div>
      </div>

    <!-- 标签选择模态框 -->
    <a-modal
      v-model:visible="labelModalVisible"
      title="选择标签"
      width="600px"
      @cancel="closeLabelModal"
      :mask-closable="false"
      :closable="true"
      :footer="false"
    >
      <div class="label-modal-content">
        <!-- 选择现有标签 -->
        <div class="select-label-section">
          <a-typography-title :heading="5" style="font-size: 16px; font-weight: 600; color: #24292f; margin-bottom: 16px;">选择标签</a-typography-title>
          <div class="labels-grid">
            <div
              v-for="label in availableLabels"
              :key="label.id"
              class="label-item"
              :class="{ 'label-selected': isLabelAdded(label.id) }"
              @click="isLabelAdded(label.id) ? (getAssignedLabelId(label.id) ? removeLabelFromIssue(getAssignedLabelId(label.id)!) : null) : addLabelToIssue(label.id)"
            >
              <div class="label-item-content">
                <div class="label-color-dot" :style="{ backgroundColor: label.hexColor, width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0 }"></div>
                <div class="label-info">
                  <span class="label-name">{{ label.name }}</span>
                  <a-typography-text type="secondary" class="label-description">
                    {{ label.description }}
                  </a-typography-text>
                </div>
              </div>
              <div class="label-action">
                <a-tag v-if="isLabelAdded(label.id)" color="#1a7f37" size="small" style="border-radius: 12px; font-weight: 500; padding: 2px 8px; border: none; color: #ffffff;">
                  已添加
                </a-tag>
                <a-tag v-else color="#0969da" size="small" style="border-radius: 12px; font-weight: 500; padding: 2px 8px; border: none; color: #ffffff;">
                  添加
                </a-tag>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 编辑标签链接 -->
        <div class="edit-labels-section">
          <a-divider />
          <div class="edit-labels-content">
            <a-typography-text type="secondary" style="color: #656d76; font-size: 14px;">
              需要创建新标签或编辑现有标签？
            </a-typography-text>
            <a-button 
              type="text" 
              size="small" 
              @click="goToLabelManagement"
              class="edit-labels-button"
              style="color: #0969da; font-weight: 500; font-size: 14px;"
            >
              <template #icon><icon-settings /></template>
              编辑标签
            </a-button>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 负责人选择模态框 -->
    <a-modal
      v-model:visible="assigneeModalVisible"
      title="选择负责人"
      width="500px"
      @cancel="closeAssigneeModal"
      :mask-closable="false"
      :closable="true"
      :footer="false"
    >
      <div class="assignee-modal-content">
        <div class="assignees-grid">
          <div
            v-for="assignee in availableAssignees"
            :key="assignee.id"
            class="assignee-item-modal"
            :class="{ 'assignee-selected': isAssigneeAdded(assignee.collaboratorId) }"
            @click="isAssigneeAdded(assignee.collaboratorId) ? (getAssignedAssigneeId(assignee.collaboratorId) ? removeAssigneeFromIssue(getAssignedAssigneeId(assignee.collaboratorId)!) : null) : addAssigneeToIssue(assignee.collaboratorId)"
          >
            <a-avatar :image-url="assignee.avatarUrl" :size="32" />
            <div class="assignee-info">
              <a-typography-text bold>{{ assignee.username }}</a-typography-text>
              <a-typography-text type="secondary" v-if="assignee.email">
                {{ assignee.email }}
              </a-typography-text>
            </div>
            <div class="assignee-action">
              <a-tag v-if="isAssigneeAdded(assignee.collaboratorId)" color="#1a7f37" size="small" style="border-radius: 12px; font-weight: 500; padding: 2px 8px; border: none; color: #ffffff;">
                已添加
              </a-tag>
              <a-tag v-else color="#0969da" size="small" style="border-radius: 12px; font-weight: 500; padding: 2px 8px; border: none; color: #ffffff;">
                添加
              </a-tag>
            </div>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 创建子问题模态框 -->
    <a-modal
      v-model:visible="createSubIssueModalVisible"
      title="创建子问题"
      width="600px"
      @cancel="createSubIssueModalVisible = false"
    >
      <div class="create-sub-issue-form">
        <div class="form-item">
          <label class="form-label">标题 <span style="color: #f53f3f;">*</span></label>
          <a-input
            v-model="subIssueForm.title"
            placeholder="子问题标题"
            :max-length="100"
            show-word-limit
          />
        </div>
        <div class="form-item">
          <label class="form-label">描述</label>
          <a-textarea
            v-model="subIssueForm.description"
            placeholder="子问题描述"
            :rows="6"
            :max-length="1000"
            show-word-limit
          />
        </div>
      </div>
      <template #footer>
        <a-space>
          <a-button @click="createSubIssueModalVisible = false">取消</a-button>
          <a-button type="primary" @click="handleCreateSubIssue" :disabled="!subIssueForm.title.trim()">
            创建子问题
          </a-button>
        </a-space>
      </template>
    </a-modal>

    <!-- 添加现有子问题模态框 -->
    <a-modal
      v-model:visible="addSubIssueModalVisible"
      title="添加现有子问题"
      width="600px"
      @cancel="addSubIssueModalVisible = false"
      @ok="addExistingSubIssue(selectedIssueId)"
    >
      <div class="add-sub-issue-content">
        <div class="search-section">
          <a-input
            v-model="issueSearch"
            placeholder="搜索问题..."
            allow-clear
            style="margin-bottom: 16px;"
          />
        </div>
        
        <a-spin :loading="availableIssuesLoading">
          <div v-if="filteredAvailableIssues.length > 0" class="issues-list">
            <a-radio-group v-model="selectedIssueId" direction="vertical">
              <div
                v-for="availableIssue in filteredAvailableIssues"
                :key="availableIssue.id"
                class="issue-option"
              >
                <a-radio :value="availableIssue.id">
                  <div class="issue-option-content">
                    <div class="issue-option-header">
                      <span class="issue-option-title">{{ availableIssue.title }}</span>
                      <span class="issue-option-number">#{{ availableIssue.number }}</span>
                    </div>
                    <div class="issue-option-meta">
                      <span
                        class="status-dot"
                        :style="{ 
                          background: (availableIssue.gmtClosed && availableIssue.gmtClosed !== 'null') ? '#cf222e' : '#1a7f37',
                          display: 'inline-block', 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          marginRight: '4px', 
                          verticalAlign: 'middle' 
                        }"
                      ></span>
                      <span class="issue-option-status">
                        {{ (availableIssue.gmtClosed && availableIssue.gmtClosed !== 'null') ? '已关闭' : '开放' }}
                      </span>
                      <span class="issue-option-author">· {{ availableIssue.username }}</span>
                    </div>
                  </div>
                </a-radio>
              </div>
            </a-radio-group>
          </div>
          <div v-else class="no-issues">
            <a-typography-text type="secondary">
              {{ issueSearch ? '没有找到匹配的问题' : '仓库中没有其他问题' }}
            </a-typography-text>
          </div>
        </a-spin>
      </div>
      <template #footer>
        <a-space>
          <a-button @click="addSubIssueModalVisible = false">取消</a-button>
          <a-button 
            type="primary" 
            @click="addExistingSubIssue(selectedIssueId)"
            :disabled="!selectedIssueId"
          >
            添加子问题
          </a-button>
        </a-space>
      </template>
    </a-modal>
    </a-spin>
  </div>

  <!-- 权限错误提示 -->
  <a-modal
    v-model:visible="permissionErrorVisible"
    :closable="false"
    :footer="false"
    :mask-closable="false"
    :width="400"
    :centered="true"
    class="permission-error-modal"
  >
    <div class="permission-error-content">
      <div class="permission-error-icon">
        <icon-exclamation-circle-fill style="font-size: 48px; color: #f53f3f;" />
      </div>
      <div class="permission-error-message">
        {{ permissionErrorMessage }}
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
.issue-detail-page {
  min-height: 100vh;
  background-color: #ffffff;
  padding: 0;
  width: 66.67%;
  overflow-x: hidden;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin: 0 auto;
  box-sizing: border-box;
  flex-direction: column;
}

.issue-layout {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background-color: #ffffff;
  padding: 0;
  box-sizing: border-box;
  max-width: 100%;
  flex: 1;
  min-width: 0;
}

.issue-main-content {
  background-color: #ffffff;
  padding: 0;
  width: 75%;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  max-width: 75%;
  min-width: 0;
}

.issue-sidebar {
  background-color: #f6f8fa;
  border-left: 1px solid #d0d7de;
  padding: 0;
  width: 25%;
  flex-shrink: 0;
  box-sizing: border-box;
  max-width: 25%;
  min-width: 0;
}

.issue-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0;
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid #d0d7de;
  background-color: #ffffff;
  width: 100%;
  box-sizing: border-box;
}

.issue-title-section {
  flex: 1;
  margin-right: 24px;
}

.issue-title-section .arco-typography-title {
  margin-bottom: 12px;
  color: #24292f;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.25;
}

.issue-meta {
  margin-top: 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 14px;
  color: #656d76;
}

.issue-actions {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
}

.issue-actions .arco-btn {
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  height: 32px;
  padding: 0 12px;
}

.issue-content-card {
  margin-bottom: 0;
  border-radius: 0;
  box-shadow: none;
  border: none;
  background-color: #ffffff;
  width: 100%;
  box-sizing: border-box;
}

.issue-content-card .arco-card-header {
  padding: 16px 24px 8px 24px;
  border-bottom: 1px solid #d0d7de;
  background-color: #f6f8fa;
}

.issue-content-card .arco-card-header-title {
  font-size: 16px;
  font-weight: 600;
  color: #24292f;
}

.issue-content {
  white-space: pre-wrap;
  padding: 24px;
  width: 100%;
  font-size: 14px;
  line-height: 1.6;
  color: #24292f;
}

.comments-card {
  margin-bottom: 0;
  border-radius: 0;
  box-shadow: none;
  border: none;
  background-color: #ffffff;
  width: 100%;
  box-sizing: border-box;
}

.comments-card .arco-card-header {
  padding: 16px 24px 8px 24px;
  border-bottom: 1px solid #d0d7de;
  background-color: #f6f8fa;
}

.comments-card .arco-card-header-title {
  font-size: 16px;
  font-weight: 600;
  color: #24292f;
}

.sidebar-title {
  margin-bottom: 0;
  font-size: 16px;
  font-weight: 600;
  color: #24292f;
  padding: 16px 16px 8px 16px;
  border-bottom: 1px solid #d0d7de;
  background-color: #f6f8fa;
  width: 100%;
  box-sizing: border-box;
}

.add-comment {
  margin-bottom: 0;
  padding: 24px;
  background-color: #ffffff;
  border-top: 1px solid #d0d7de;
  width: 100%;
}

.add-comment .arco-textarea {
  margin-bottom: 12px;
  border-radius: 6px;
  border: 1px solid #d0d7de;
}

.add-comment .arco-textarea:focus {
  border-color: #0969da;
  box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
}

.comments-list {
  border-top: none;
  padding-top: 0;
  width: 100%;
}

.comment-item {
  margin-bottom: 0;
  padding: 24px;
  border: none;
  border-top: 1px solid #d0d7de;
  border-radius: 0;
  background-color: #ffffff;
  width: 100%;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.comment-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comment-content {
  margin-left: 32px;
  font-size: 14px;
  line-height: 1.6;
  color: #24292f;
}

.comment-hidden {
  opacity: 0.8;
  background-color: #f6f8fa;
  border-left: 3px solid #cf222e;
}

.comment-hidden-placeholder {
  margin-left: 32px;
  padding: 12px;
  background-color: #f6f8fa;
  border-radius: 6px;
  border: 1px dashed #d0d7de;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comment-actions .arco-btn {
  font-size: 12px;
  height: 24px;
  padding: 0 8px;
  border-radius: 4px;
}

.comment-edit-form {
  margin-bottom: 8px;
}

.comment-edit-form .arco-textarea {
  border-radius: 6px;
  border: 1px solid #d0d7de;
}

.comment-edit-form .arco-textarea:focus {
  border-color: #0969da;
  box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
}

.sidebar-card {
  position: sticky;
  top: 20px;
}

.sidebar-section {
  margin-bottom: 0;
  padding: 16px;
  border: none;
  border-bottom: 1px solid #d0d7de;
  border-radius: 0;
  background-color: #f6f8fa;
  width: 100%;
  box-sizing: border-box;
}

.sidebar-section:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-header .arco-typography-text {
  font-size: 14px;
  font-weight: 600;
  color: #24292f;
}

.labels-list {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.github-style-label {
  border-radius: 12px !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  padding: 2px 8px !important;
  border: none !important;
  box-shadow: none !important;
  color: #ffffff !important;
}

.github-style-label:hover {
  opacity: 0.8;
}

.labels-list .a-tag {
  margin-bottom: 4px;
}

.assignees-list {
  margin-top: 8px;
}

.sidebar-actions {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-actions .arco-btn {
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  height: 32px;
}

.assignee-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.assignee-item:last-child {
  margin-bottom: 0;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #656d76;
  background-color: #f6f8fa;
  border-radius: 6px;
  border: 1px dashed #d0d7de;
}

/* 模态框样式 */
.label-modal-content,
.assignee-modal-content {
  max-height: 400px;
  overflow-y: auto;
}

.create-label-section {
  margin-bottom: 16px;
}

.labels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.label-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.label-item:hover {
  background-color: #f6f8fa;
  border-color: #0969da;
}

.label-item.label-selected {
  background-color: #dafbe1;
  border-color: #1a7f37;
}

.label-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.label-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.label-description {
  display: block;
  font-size: 12px;
  color: #656d76;
}

.label-action {
  flex-shrink: 0;
}

.assignees-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.assignee-item-modal {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.assignee-item-modal:hover {
  background-color: #f6f8fa;
  border-color: #0969da;
}

.assignee-item-modal.assignee-selected {
  background-color: #ddf4ff;
  border-color: #0969da;
}

.assignee-info {
  flex: 1;
  margin-left: 12px;
}

.assignee-action {
  display: flex;
  align-items: center;
}

.sub-issues-list {
  margin: 0;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
}

/* 确保a-spin组件占满宽度 */
.sub-issues-card .arco-spin {
  width: 100% !important;
}

.sub-issues-card .arco-spin .arco-spin-container {
  width: 100% !important;
}

.sub-issue-item {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid #d0d7de;
  width: 100%;
  box-sizing: border-box;
}

.sub-issue-item:last-child {
  border-bottom: none;
}

.sub-issue-status {
  margin-right: 12px;
  flex-shrink: 0;
}

.sub-issue-content {
  flex: 1;
  min-width: 0;
  cursor: pointer;
  padding: 0;
  margin: 0;
}

.sub-issue-content:hover {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 4px;
  margin: -4px;
}

.sub-issue-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  width: 100%;
}

.sub-issue-title {
  font-size: 14px;
  color: #24292f;
  cursor: pointer;
}

.sub-issue-title:hover {
  color: #0969da;
}

.sub-issue-sub-progress {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: #f1f3f4;
  border-radius: 12px;
  font-size: 12px;
  color: #656d76;
  flex-shrink: 0;
}

.sub-issue-sub-count {
  font-size: 12px;
  color: #656d76;
  font-weight: 500;
}

.issue-sub-issues-progress {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  padding: 2px 6px;
  background: #f1f3f4;
  border-radius: 12px;
  font-size: 12px;
  color: #656d76;
}

.issue-sub-issues-count {
  font-size: 12px;
  color: #656d76;
  font-weight: 500;
}

.sub-issue-actions {
  margin-left: 12px;
  flex-shrink: 0;
}

.sub-issues-empty {
  padding: 24px;
  text-align: center;
  color: #656d76;
  width: 100%;
  box-sizing: border-box;
}

.sub-issues-actions {
  margin: 16px 24px 0 24px;
  padding-top: 16px;
  border-top: 1px solid #d0d7de;
  width: calc(100% - 48px);
  box-sizing: border-box;
}

/* 响应式布局 */
@media (max-width: 1600px) {
  .issue-detail-page {
    width: 70%;
  }
  
  .issue-main-content {
    width: 75%;
  }
  
  .issue-sidebar {
    width: 25%;
  }
}

@media (max-width: 1400px) {
  .issue-detail-page {
    width: 75%;
  }
  
  .issue-main-content {
    width: 75%;
  }
  
  .issue-sidebar {
    width: 25%;
  }
}

@media (max-width: 1200px) {
  .issue-detail-page {
    width: 80%;
  }
  
  .issue-main-content {
    width: 70%;
  }
  
  .issue-sidebar {
    width: 30%;
  }
}

@media (max-width: 1024px) {
  .issue-detail-page {
    width: 90%;
  }
  
  .issue-layout {
    flex-direction: column;
    align-items: center;
  }
  
  .issue-main-content {
    width: 100%;
  }
  
  .issue-sidebar {
    width: 100%;
    border-left: none;
    border-top: 1px solid #d0d7de;
  }
}

@media (max-width: 768px) {
  .issue-main-content {
    max-width: 100%;
  }
  
  .issue-sidebar {
    max-width: 100%;
  }
  
  .issue-header {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  
  .issue-content {
    padding: 16px;
  }
  
  .add-comment {
    padding: 16px;
  }
  
  .comment-item {
    padding: 16px;
  }
  
  .sidebar-title {
    padding: 12px 12px 8px 12px;
  }
  
  .sidebar-section {
    padding: 12px;
  }
  
  .issue-actions {
    align-self: flex-start;
  }
}

/* 确保在小屏幕上也有适当的边距 */
@media (max-width: 640px) {
  .issue-layout {
    padding: 0 8px;
  }
  
  .issue-header {
    padding: 12px;
  }
  
  .issue-content {
    padding: 12px;
  }
  
  .add-comment {
    padding: 12px;
  }
  
  .comment-item {
    padding: 12px;
  }
  
  .sidebar-title {
    padding: 8px 8px 6px 8px;
  }
  
  .sidebar-section {
    padding: 8px;
  }
}

/* 权限错误提示样式 */
.permission-error-modal {
  .arco-modal-content {
    padding: 0;
  }
}

.permission-error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
}

.permission-error-icon {
  margin-bottom: 16px;
}

.permission-error-message {
  font-size: 16px;
  font-weight: 500;
  color: #24292f;
  line-height: 1.5;
}

/* 编辑标签链接样式 */
.edit-labels-section {
  margin-top: 16px;
}

.edit-labels-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
}

.edit-labels-button {
  color: #0969da;
  font-weight: 500;
}

.edit-labels-button:hover {
  color: #1a7f37;
}

/* 评论状态样式 */
.comment-status-locked,
.comment-status-closed {
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
}

.comment-status-locked {
  color: #cf222e;
}

.comment-status-closed {
  color: #cf222e;
}

.comment-permission-notice {
  padding: 16px 24px;
  border-bottom: 1px solid #d0d7de;
}

.comment-permission-notice .arco-alert {
  margin-bottom: 0;
}

/* 子问题样式 */
.sub-issues-card {
  margin-bottom: 0;
  border-radius: 0;
  box-shadow: none;
  border: none;
  background-color: #ffffff;
  width: 100%;
  box-sizing: border-box;
}

.sub-issues-card .arco-card-header {
  padding: 16px 24px 8px 24px;
  border-bottom: 1px solid #d0d7de;
  background-color: #f6f8fa;
}

.sub-issues-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #24292f;
}

.sub-issues-progress {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 12px;
}

.sub-issues-count {
  font-size: 12px;
  color: #656d76;
  font-weight: 500;
}

.sub-issue-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  width: 100%;
}

.sub-issue-title {
  font-size: 14px;
  color: #24292f;
  cursor: pointer;
}

.sub-issue-title:hover {
  color: #0969da;
}

.sub-issue-sub-progress {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: #f1f3f4;
  border-radius: 12px;
  font-size: 12px;
  color: #656d76;
  flex-shrink: 0;
}

/* 创建子问题表单样式 */
.create-sub-issue-form {
  padding: 16px 0;
}

.form-item {
  margin-bottom: 16px;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #24292f;
}

.add-sub-issue-content {
  padding: 16px 0;
}

.search-section {
  margin-bottom: 16px;
}

.issues-list {
  max-height: 400px;
  overflow-y: auto;
}

.issue-option {
  padding: 12px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.issue-option:hover {
  background-color: #f6f8fa;
  border-color: #0969da;
}

.issue-option:last-child {
  margin-bottom: 0;
}

.issue-option-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.issue-option-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.issue-option-title {
  font-size: 14px;
  font-weight: 500;
  color: #24292f;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.issue-option-number {
  font-size: 12px;
  color: #656d76;
  flex-shrink: 0;
}

.issue-option-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #656d76;
}

.issue-option-status {
  font-size: 12px;
  color: #656d76;
}

.issue-option-author {
  font-size: 12px;
  color: #656d76;
}

.no-issues {
  padding: 24px;
  text-align: center;
  color: #656d76;
}
</style> 