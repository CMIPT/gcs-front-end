<template>
  <div class="issue-list-page">
    <!-- 顶部搜索和操作栏 -->
    <div class="issue-list-header">
      <a-input-search
        v-model="search"
        placeholder="搜索问题..."
        style="width: 320px"
        @search="handleSearch"
        allow-clear
      />
      <div class="issue-list-header-actions">
        <a-button @click="handleLabels"><icon-tag /> 标签</a-button>
        <a-button type="primary" @click="handleCreate"><icon-plus /> 新建问题</a-button>
      </div>
    </div>

    <!-- 状态切换 -->
    <div class="issue-list-tabs">
              <a-button
          :type="filterState === 'open' ? 'primary' : 'text'"
          @click="setFilter('open')"
        >
          <span class="status-dot open"></span>
          开放 {{ openCount }}
        </a-button>
        <a-button
          :type="filterState === 'closed' ? 'primary' : 'text'"
          @click="setFilter('closed')"
        >
          <span class="status-dot closed"></span>
          已关闭 {{ closedCount }}
        </a-button>
    </div>

    <!-- 筛选选项 -->
    <div class="issue-filters">
      <!-- Author筛选 -->
      <a-dropdown>
        <a-button type="text" :class="{ 'filter-active': selectedAuthor }">
          作者 <icon-down />
          <a-badge v-if="selectedAuthor" :count="1" />
        </a-button>
        <template #content>
          <div class="filter-dropdown-content">
            <div class="filter-header">
              <a-typography-text bold>按作者筛选</a-typography-text>
            </div>
            <div class="filter-search">
              <a-input v-model="authorSearch" placeholder="筛选作者" size="small" />
            </div>
            <div class="filter-options">
              <a-radio-group v-model="selectedAuthor" direction="vertical">
                <div
                  v-for="author in filteredAuthors"
                  :key="author.id"
                  class="filter-option"
                >
                  <a-radio :value="author.username">
                    <div class="author-option">
                      <a-avatar :image-url="author.avatarUrl" :size="24" />
                      <div class="author-info">
                        <span class="author-name">{{ author.username }}</span>
                        <span v-if="author.fullName" class="author-full-name">{{ author.fullName }}</span>
                      </div>
                    </div>
                  </a-radio>
                </div>
              </a-radio-group>
            </div>
            <div class="filter-actions">
              <a-button size="small" @click="clearAuthorFilter">清除</a-button>
              <a-button size="small" type="primary" @click="applyAuthorFilter">应用</a-button>
            </div>
          </div>
        </template>
      </a-dropdown>
      
      <!-- 标签筛选 -->
      <a-dropdown>
        <a-button type="text" :class="{ 'filter-active': selectedLabels.length > 0 }">
          标签 <icon-down />
          <a-badge v-if="selectedLabels.length > 0" :count="selectedLabels.length" />
        </a-button>
        <template #content>
          <div class="filter-dropdown-content">
            <div class="filter-header">
              <a-typography-text bold>按标签筛选</a-typography-text>
            </div>
            <div class="filter-search">
              <a-input v-model="labelSearch" placeholder="搜索标签" size="small" />
            </div>
            <div class="filter-options">
              <a-checkbox-group v-model="selectedLabels">
                <div
                  v-for="label in filteredLabels"
                  :key="label.id"
                  class="filter-option"
                >
                  <a-checkbox :value="label.name">
                    <div class="label-option">
                      <a-tag :color="label.hexColor" size="small">{{ label.name }}</a-tag>
                      <span class="label-description">{{ label.description }}</span>
                    </div>
                  </a-checkbox>
                </div>
              </a-checkbox-group>
            </div>
            <div class="filter-actions">
              <a-button size="small" @click="clearLabelFilters">清除</a-button>
              <a-button size="small" type="primary" @click="applyLabelFilters">应用</a-button>
            </div>
          </div>
        </template>
      </a-dropdown>
      
      <!-- 项目筛选（已删除） -->
      
      <!-- 负责人筛选 -->
      <a-dropdown>
        <a-button type="text" :class="{ 'filter-active': selectedAssignees.length > 0 }">
          负责人 <icon-down />
          <a-badge v-if="selectedAssignees.length > 0" :count="selectedAssignees.length" />
        </a-button>
        <template #content>
          <div class="filter-dropdown-content">
            <div class="filter-header">
              <a-typography-text bold>按负责人筛选</a-typography-text>
            </div>
            <div class="filter-search">
              <a-input v-model="assigneeSearch" placeholder="搜索负责人" size="small" />
            </div>
            <div class="filter-options">
              <a-checkbox-group v-model="selectedAssignees">
                <div
                  v-for="assignee in filteredAssignees"
                  :key="assignee.id"
                  class="filter-option"
                >
                  <a-checkbox :value="assignee.username">
                    <div class="assignee-option">
                      <a-avatar :image-url="assignee.avatarUrl" :size="24" />
                      <span class="assignee-name">{{ assignee.username }}</span>
                    </div>
                  </a-checkbox>
                </div>
              </a-checkbox-group>
            </div>
            <div class="filter-actions">
              <a-button size="small" @click="clearAssigneeFilters">清除</a-button>
              <a-button size="small" type="primary" @click="applyAssigneeFilters">应用</a-button>
            </div>
          </div>
        </template>
      </a-dropdown>
      
      <!-- 排序功能 -->
      <a-dropdown>
        <a-button type="text" :class="{ 'filter-active': sortField !== 'newest' || sortOrder !== 'desc' }">
          排序方式 <icon-down />
        </a-button>
        <template #content>
          <div class="filter-dropdown-content">
            <div class="filter-header">
              <a-typography-text bold>排序方式</a-typography-text>
            </div>
            <div class="filter-options">
              <div class="sort-option">
                <a-radio-group v-model="sortField" direction="vertical">
                  <a-radio value="newest">
                    <div class="sort-option-content">
                      <div class="sort-option-title">最新</div>
                      <div class="sort-option-desc">按创建时间排序</div>
                    </div>
                  </a-radio>
                  <a-radio value="updated">
                    <div class="sort-option-content">
                      <div class="sort-option-title">最近更新</div>
                      <div class="sort-option-desc">按最后更新时间排序</div>
                    </div>
                  </a-radio>
                </a-radio-group>
              </div>
              <a-divider />
              <div class="sort-order">
                <a-radio-group v-model="sortOrder" direction="vertical">
                                  <a-radio value="desc">最新优先</a-radio>
                <a-radio value="asc">最早优先</a-radio>
                </a-radio-group>
              </div>
            </div>
            <div class="filter-actions">
              <a-button size="small" @click="clearSortFilters">清除</a-button>
              <a-button size="small" type="primary" @click="applySortFilters">应用</a-button>
            </div>
          </div>
        </template>
      </a-dropdown>
    </div>

    <!-- 活动筛选标签 -->
    <div v-if="hasActiveFilters" class="active-filters">
      <a-typography-text type="secondary">当前筛选:</a-typography-text>
      <div class="filter-tags">
        <a-tag
          v-for="labelName in selectedLabels"
          :key="`label-${labelName}`"
          closable
          @close="removeLabelFilter(labelName)"
        >
          {{ labelName }}
        </a-tag>
        <a-tag
          v-for="assigneeName in selectedAssignees"
          :key="`assignee-${assigneeName}`"
          closable
          @close="removeAssigneeFilter(assigneeName)"
        >
          {{ assigneeName }}
        </a-tag>
        <a-tag
          v-if="selectedAuthor"
          closable
          @close="clearAuthorFilter"
        >
          作者: {{ selectedAuthor }}
        </a-tag>
        <a-tag
          v-if="sortField !== 'newest' || sortOrder !== 'desc'"
          closable
          @close="clearSortFilters"
        >
          {{ sortField === 'newest' ? '最新' : '最近更新' }}
        </a-tag>
      </div>
      <a-button type="text" size="small" @click="clearAllFilters">清除全部</a-button>
    </div>

    <!-- 列表 -->
    <div class="issue-list-container">
      <a-spin :loading="loading" style="width: 100%;">
        <div v-if="issues.length" class="issue-list">
        <div
          v-for="item in issues"
          :key="item.id"
          class="issue-list-item"
          @click="handleClickIssue(item)"
        >
          <!-- 复选框 -->
          <div class="issue-checkbox">
            <a-checkbox />
          </div>
          
          <!-- 状态指示器 -->
          <div class="issue-status">
            <span
              class="status-dot"
              :style="{ background: (item.gmtClosed && item.gmtClosed !== 'null') ? '#cf222e' : '#1a7f37' }"
            ></span>
          </div>
          
          <!-- 主要内容区域 -->
          <div class="issue-main">
            <div class="issue-title-row">
              <span class="issue-title">{{ item.title }}</span>
              <!-- 子问题饼状图 -->
              <div v-if="subIssuesData.get(item.id) && subIssuesData.get(item.id)!.total > 0" class="sub-issue-pie">
                <SubIssuePie 
                  :sub-issues="[]" 
                  :total="subIssuesData.get(item.id)!.total" 
                  :completed="subIssuesData.get(item.id)!.completed"
                />
                <span class="sub-issue-count">{{ subIssuesData.get(item.id)!.completed }}/{{ subIssuesData.get(item.id)!.total }}</span>
              </div>
              <!-- 标签区域 - 移到标题右侧 -->
              <div v-if="item.labels && item.labels.length" class="issue-labels">
                <a-tag
                  v-for="label in item.labels"
                  :key="label.id"
                  :color="label.hexColor"
                  size="small"
                  class="issue-label"
                  style="border-radius: 12px; font-weight: 500; padding: 2px 8px; border: none; color: #ffffff;"
                >{{ label.name }}</a-tag>
              </div>
            </div>
            
            <!-- 元信息 -->
            <div class="issue-meta-row">
               <span class="issue-meta">
                #{{ item.number }} · {{ item.creatorUsername }} 创建于 {{ formatDate(item.gmtCreated) }}
              </span>
              <!-- 可以添加更多元信息，如assignees等 -->
            </div>
          </div>
          
          <!-- 右侧信息 -->
          <div class="issue-right">
            <!-- 评论数 -->
            <div class="issue-comments">             <icon-message />
              <span>{{ parseInt(item.commentCnt) || 0 }}</span>
            </div>
          </div>
        </div>
              </div>
        <a-empty v-else description="未找到问题" />
      </a-spin>
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="pagination-container">
      <a-pagination
        :current="currentPage"
        :page-size="pageSize"
        :total="total"
        :show-page-size="true"
        :show-jumper="true"
        :show-total="true"
        @change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useActivityApi } from '~/composables/api/activity'
import { useLabelApi } from '~/composables/api/label'
import { APIPaths } from '~/utils/constant'
import { fetchWithRetry } from '~/utils/fetcher'
import type { RepositoryDetailVO, LabelVO, CollaboratorVO } from '~/utils/responseVOTypes'
import { IconPlus, IconMessage, IconTag, IconDown } from '@arco-design/web-vue/es/icon'
import SubIssuePie from './SubIssuePie.vue'

const route = useRoute()
const router = useRouter()
const { pageActivities, pageSubIssues } = useActivityApi()
const { getLabels } = useLabelApi()

const repository = ref<RepositoryDetailVO>()
const issues = ref<ActivityFullInfoVO[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
// 子问题数据
const subIssuesData = ref<Map<string, { total: number; completed: number }>>(new Map())
const search = ref('')
const filterState = ref<'open' | 'closed'>('open')
const openCount = ref(0)
const closedCount = ref(0)

// 筛选相关状态
const availableLabels = ref<LabelVO[]>([])
const availableAssignees = ref<CollaboratorVO[]>([])
const availableAuthors = ref<{ id: string; username: string; avatarUrl: string; fullName?: string }[]>([])
const selectedLabels = ref<string[]>([]) // 存储标签名字
const selectedAssignees = ref<string[]>([]) // 存储用户名
const selectedAuthor = ref<string>('') // 存储选中的作者用户名
const labelSearch = ref('')
const assigneeSearch = ref('')
const authorSearch = ref('')
const sortField = ref<'newest' | 'updated'>('newest')
const sortOrder = ref<'asc' | 'desc'>('desc')

// 计算属性
const filteredLabels = computed(() => {
  if (!labelSearch.value) return availableLabels.value
  return availableLabels.value.filter(label => 
    label.name.toLowerCase().includes(labelSearch.value.toLowerCase()) ||
    label.description.toLowerCase().includes(labelSearch.value.toLowerCase())
  )
})

const filteredAssignees = computed(() => {
  if (!assigneeSearch.value) return availableAssignees.value
  return availableAssignees.value.filter(assignee => 
    assignee.username.toLowerCase().includes(assigneeSearch.value.toLowerCase())
  )
})

const hasActiveFilters = computed(() => {
  return selectedLabels.value.length > 0 || 
         selectedAssignees.value.length > 0 || 
         selectedAuthor.value !== '' ||
         sortField.value !== 'newest' || 
         sortOrder.value !== 'desc'
})

const filteredAuthors = computed(() => {
  if (!authorSearch.value) return availableAuthors.value
  return availableAuthors.value.filter(author => 
    author.username.toLowerCase().includes(authorSearch.value.toLowerCase()) ||
    (author.fullName && author.fullName.toLowerCase().includes(authorSearch.value.toLowerCase()))
  )
})

const fetchRepositoryDetails = async () => {
  const apiURL = new URL(APIPaths.REPOSITORY_GET_REPOSITORY_API_PATH, window.origin)
  apiURL.searchParams.append('username', route.params.username as string)
  apiURL.searchParams.append('repositoryName', route.params.repositoryName as string)
  repository.value = await fetchWithRetry<RepositoryDetailVO>(apiURL.toString()).catch(() => undefined)
}

// 获取仓库标签列表
const fetchRepositoryLabels = async () => {
  if (!repository.value) return
  
  try {
    const response = await getLabels(repository.value.id, 1, 100, 'GMT_CREATED', false)
    availableLabels.value = response.records
  } catch (error) {
    console.error('获取标签列表失败:', error)
  }
}

// 获取仓库协作者列表
const fetchRepositoryCollaborators = async () => {
  if (!repository.value) return
  
  try {
    const apiURL = new URL(APIPaths.REPOSITORY_PAGE_COLLABORATOR_API_PATH, window.origin)
    apiURL.searchParams.append('repositoryId', repository.value.id)
    apiURL.searchParams.append('page', '1')
    apiURL.searchParams.append('size', '100')
    apiURL.searchParams.append('orderBy', 'GMT_CREATED')
    apiURL.searchParams.append('isAsc', 'false')
    
    const response = await fetchWithRetry<{ total: number; records: CollaboratorVO[] }>(apiURL.toString())
    availableAssignees.value = response.records
    
    // 添加仓库创建者
    availableAssignees.value.unshift({
      id: repository.value.userId,
      collaboratorId: repository.value.userId,
      username: repository.value.username,
      email: '',
      avatarUrl: ''
    })
  } catch (error) {
    console.error('获取协作者列表失败:', error)
  }
}

// 获取作者列表（当前用户 + 仓库创建者 + 协作者）
const fetchAuthors = async () => {
  if (!repository.value) return
  
  try {
    const authors: { id: string; username: string; avatarUrl: string; fullName?: string }[] = []
    
    // 添加当前用户
    const currentUser = useUserInfo().value
    if (currentUser.username) {
      authors.push({
        id: currentUser.id,
        username: currentUser.username,
        avatarUrl: currentUser.avatarUrl,
        fullName: currentUser.email
      })
    }
    
    // 添加仓库创建者
    authors.push({
      id: repository.value.userId,
      username: repository.value.username,
      avatarUrl: repository.value.avatarUrl || ''
    })
    
    // 添加协作者
    const apiURL = new URL(APIPaths.REPOSITORY_PAGE_COLLABORATOR_API_PATH, window.origin)
    apiURL.searchParams.append('repositoryId', repository.value.id)
    apiURL.searchParams.append('page', '1')
    apiURL.searchParams.append('size', '100')
    apiURL.searchParams.append('orderBy', 'GMT_CREATED')
    apiURL.searchParams.append('isAsc', 'false')
    
    const response = await fetchWithRetry<{ total: number; records: CollaboratorVO[] }>(apiURL.toString())
    response.records.forEach(collaborator => {
      authors.push({
        id: collaborator.id,
        username: collaborator.username,
        avatarUrl: collaborator.avatarUrl,
        fullName: collaborator.email
      })
    })
    
    // 去重（按用户名）
    const uniqueAuthors = authors.filter((author, index, self) => 
      index === self.findIndex(a => a.username === author.username)
    )
    
    availableAuthors.value = uniqueAuthors
  } catch (error) {
    console.error('获取作者列表失败:', error)
  }
}

// 获取单个问题的子问题数据
const fetchSubIssuesForIssue = async (issueId: string) => {
  try {
    const res = await pageSubIssues({
      page: 1,
      size: 100, // 获取所有子问题
      parentId: issueId
    })
    
    const total = res.total
    const completed = res.records.filter(subIssue => 
      subIssue.gmtClosed && subIssue.gmtClosed !== 'null'
    ).length
    
    subIssuesData.value.set(issueId, { total, completed })
  } catch (error) {
    console.error(`获取问题 ${issueId} 的子问题失败:`, error)
    // 如果获取失败，设置为0
    subIssuesData.value.set(issueId, { total: 0, completed: 0 })
  }
}

// 获取所有问题的子问题数据
const fetchAllSubIssues = async (issueIds: string[]) => {
  // 清空之前的数据
  subIssuesData.value.clear()
  
  // 并发获取所有问题的子问题数据
  const promises = issueIds.map(issueId => fetchSubIssuesForIssue(issueId))
  await Promise.all(promises)
}

const fetchIssues = async () => {
  if (!repository.value) return
  loading.value = true
  try {
    // 构建排序参数
    let orderBy = 'GMT_CREATED'
    if (sortField.value === 'updated') {
      orderBy = 'GMT_UPDATED'
    }
    
    const res = await pageActivities({
      page: currentPage.value,
      size: pageSize.value,
      repositoryId: repository.value.id,
      isPullRequest: false,
      isClosed: filterState.value === 'closed',
      labels: selectedLabels.value.length > 0 ? selectedLabels.value : undefined,
      assignees: selectedAssignees.value.length > 0 ? selectedAssignees.value : undefined,
      author: selectedAuthor.value || undefined,
      orderBy: orderBy,
      isAsc: sortOrder.value === 'asc'
    })
    console.log('分页查询返回数据:', res.records)
    issues.value = res.records
    total.value = res.total
    
    // 获取所有问题的子问题数据
    const issueIds = res.records.map(issue => issue.id)
    await fetchAllSubIssues(issueIds)
  } finally {
    loading.value = false
  }
}

const fetchCounts = async () => {
  if (!repository.value) return
  try {
    // open数量
    const openRes = await pageActivities({
      page: 1,
      size: 1,
      repositoryId: repository.value.id,
      isPullRequest: false,
      isClosed: false,
    })
    openCount.value = openRes.total
    // closed数量
    const closedRes = await pageActivities({
      page: 1,
      size: 1,
      repositoryId: repository.value.id,
      isPullRequest: false,
      isClosed: true,
    })
    closedCount.value = closedRes.total
  } catch (error) {
    console.error('获取数量统计失败:', error)
  }
}

// 筛选相关方法
const applyLabelFilters = () => {
  currentPage.value = 1
  fetchIssues()
}

const clearLabelFilters = () => {
  selectedLabels.value = []
  currentPage.value = 1
  fetchIssues()
}

const applyAssigneeFilters = () => {
  currentPage.value = 1
  fetchIssues()
}

const clearAssigneeFilters = () => {
  selectedAssignees.value = []
  currentPage.value = 1
  fetchIssues()
}

const applySortFilters = () => {
  currentPage.value = 1
  fetchIssues()
}

const clearSortFilters = () => {
  sortField.value = 'newest'
  sortOrder.value = 'desc'
  currentPage.value = 1
  fetchIssues()
}

const clearAllFilters = () => {
  selectedLabels.value = []
  selectedAssignees.value = []
  selectedAuthor.value = ''
  sortField.value = 'newest'
  sortOrder.value = 'desc'
  currentPage.value = 1
  fetchIssues()
}

// 作者筛选相关方法
const applyAuthorFilter = () => {
  currentPage.value = 1
  fetchIssues()
}

const clearAuthorFilter = () => {
  selectedAuthor.value = ''
  currentPage.value = 1
  fetchIssues()
}

const removeLabelFilter = (labelName: string) => {
  selectedLabels.value = selectedLabels.value.filter(name => name !== labelName)
  currentPage.value = 1
  fetchIssues()
}

const removeAssigneeFilter = (assigneeName: string) => {
  selectedAssignees.value = selectedAssignees.value.filter(name => name !== assigneeName)
  currentPage.value = 1
  fetchIssues()
}



const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchIssues()
}
const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchIssues()
}
const handleCreate = () => {
  router.push({
    path: `/${route.params.username}/${route.params.repositoryName}/issues/new`
  })
}
const handleClickIssue = (item: any) => {
  router.push({
    path: `/${route.params.username}/${route.params.repositoryName}/issues/${item.number}`
  })
}
const handleLabels = () => {
  router.push({
    path: `/${route.params.username}/${route.params.repositoryName}/settings/labels`
  })
}
const handleSearch = () => {
  currentPage.value = 1
  fetchIssues()
}
const setFilter = (state: 'open' | 'closed') => {
  filterState.value = state
  currentPage.value = 1
  fetchIssues()
}
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 监听搜索框内容变化，解析条件
watch(search, (val) => {
  // 只在用户手动输入时解析（防止筛选项反向同步时死循环）
  if (val === buildSearchStringFromFilters()) return;
  // 解析条件
  const isIssue = /is:issue/.test(val);
  const stateMatch = val.match(/state:(open|closed)/);
  const labelMatches = [...val.matchAll(/label:([^\s]+)/g)].map(m => m[1]);
  const assigneeMatches = [...val.matchAll(/assignee:([^\s]+)/g)].map(m => m[1]);
  const authorMatch = val.match(/author:([^\s]+)/);
  // 状态
  if (stateMatch) {
    filterState.value = stateMatch[1] as any;
  } else {
    filterState.value = 'open';
  }
  // 标签
  selectedLabels.value = labelMatches;
  // 负责人
  selectedAssignees.value = assigneeMatches;
  // 作者
  selectedAuthor.value = authorMatch ? authorMatch[1] : '';
});

// 监听筛选项变化，自动拼接条件到搜索框
watch([filterState, selectedLabels, selectedAssignees, selectedAuthor], () => {
  const newStr = buildSearchStringFromFilters();
  if (search.value !== newStr) {
    search.value = newStr;
  }
});

function buildSearchStringFromFilters() {
  let arr = ['is:issue'];
  arr.push(`state:${filterState.value}`);
  selectedLabels.value.forEach(l => arr.push(`label:${l}`));
  selectedAssignees.value.forEach(a => arr.push(`assignee:${a}`));
  if (selectedAuthor.value) arr.push(`author:${selectedAuthor.value}`);
  return arr.join(' ');
}

onMounted(async () => {
  await fetchRepositoryDetails()
  await Promise.all([
    fetchCounts(), 
    fetchIssues(), 
    fetchRepositoryLabels(), 
    fetchRepositoryCollaborators(),
    fetchAuthors()
  ])
})
</script>

<style scoped>
.issue-list-page {
  background-color: #ffffff;
  min-height: 100vh;
  padding: 24px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

.issue-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #d0d7de;
}

.issue-list-header .arco-input-search {
  width: 320px;
}

.issue-list-header .arco-input-search .arco-input {
  border-radius: 6px;
  border: 1px solid #d0d7de;
}

.issue-list-header .arco-input-search .arco-input:focus {
  border-color: #0969da;
  box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
}

.issue-list-header-actions {
  display: flex;
  gap: 8px;
}

.issue-list-header-actions .arco-btn {
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  height: 32px;
  padding: 0 12px;
}

.issue-list-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  border-bottom: 1px solid #d0d7de;
}

.issue-list-tabs .arco-btn {
  border-radius: 0;
  border: none;
  border-bottom: 2px solid transparent;
  font-weight: 500;
  font-size: 14px;
  height: 40px;
  padding: 0 16px;
  color: #656d76;
  background: transparent;
}

.issue-list-tabs .arco-btn:hover {
  background-color: #f6f8fa;
  color: #24292f;
}

.issue-list-tabs .arco-btn.arco-btn-primary {
  color: #24292f;
  border-bottom-color: #cf222e;
  background: transparent;
}

.issue-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f6f8fa;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  flex-wrap: wrap;
}

.issue-filters .arco-btn {
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  height: 32px;
  padding: 0 12px;
  color: #656d76;
  border: 1px solid #d0d7de;
  background: #ffffff;
}

.issue-filters .arco-btn:hover {
  background-color: #f6f8fa;
  border-color: #0969da;
  color: #0969da;
}

.issue-filters .arco-btn.filter-active {
  background-color: #0969da;
  border-color: #0969da;
  color: #ffffff;
}

.active-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background-color: #f6f8fa;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  flex-wrap: wrap;
}

.active-filters .arco-typography-text {
  color: #656d76;
  font-size: 14px;
  font-weight: 500;
}

.filter-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.filter-tags .arco-tag {
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  background-color: #ffffff;
  border: 1px solid #d0d7de;
  color: #24292f;
}

.filter-dropdown-content {
  min-width: 300px;
  max-height: 400px;
  overflow-y: auto;
  background-color: #ffffff;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(140, 149, 159, 0.2);
}

.filter-header {
  padding: 12px 16px;
  border-bottom: 1px solid #d0d7de;
  background-color: #f6f8fa;
}

.filter-header .arco-typography-text {
  font-size: 14px;
  font-weight: 600;
  color: #24292f;
}

.filter-search {
  padding: 12px 16px;
  border-bottom: 1px solid #d0d7de;
}

.filter-search .arco-input {
  border-radius: 6px;
  border: 1px solid #d0d7de;
}

.filter-search .arco-input:focus {
  border-color: #0969da;
  box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
}

.filter-options {
  padding: 8px 0;
  max-height: 200px;
  overflow-y: auto;
}

.filter-option {
  padding: 8px 16px;
}

.filter-option:hover {
  background-color: #f6f8fa;
}

.label-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-description {
  font-size: 12px;
  color: #656d76;
}

.assignee-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assignee-name {
  font-size: 14px;
  color: #24292f;
}

.author-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-size: 14px;
  font-weight: 500;
  color: #24292f;
}

.author-full-name {
  font-size: 12px;
  color: #656d76;
}

.sort-option {
  padding: 8px 16px;
}

.sort-option-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sort-option-title {
  font-weight: 500;
  font-size: 14px;
  color: #24292f;
}

.sort-option-desc {
  font-size: 12px;
  color: #656d76;
}

.sort-order {
  padding: 8px 16px;
}

.filter-actions {
  padding: 12px 16px;
  border-top: 1px solid #d0d7de;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  background-color: #f6f8fa;
}

.filter-actions .arco-btn {
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  height: 32px;
  padding: 0 12px;
}

.status-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
}

.status-dot.open { 
  background: #1a7f37; 
}

.status-dot.closed { 
  background: #cf222e; 
}

.issue-list-container {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.issue-list {
  background: transparent;
  border-radius: 6px;
  box-shadow: none;
  padding: 0;
  border: 1px solid #d0d7de;
  overflow: hidden;
  width: 100%;
  flex: 1;
  min-width: 0;
}

.issue-list-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border-bottom: 1px solid #d0d7de;
  background: #ffffff;
  border-radius: 0;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 80px;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}

.issue-list-item:last-child {
  border-bottom: none;
}

.issue-list-item:hover {
  background: #f6f8fa;
}

.issue-checkbox {
  margin-right: 8px;
  margin-top: 2px;
}

.issue-status {
  margin-right: 12px;
  margin-top: 4px;
}

.issue-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.issue-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.issue-title {
  font-weight: 600;
  font-size: 16px;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #24292f;
  min-width: 0;
}

.issue-title:hover {
  color: #0969da;
}

.issue-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  flex-shrink: 0;
}

.issue-label {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
  border: none;
  color: #ffffff;
}

.sub-issue-pie {
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

.sub-issue-count {
  font-size: 12px;
  color: #656d76;
  font-weight: 500;
}

.sub-issue-progress {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  background: #f1f3f4;
  padding: 2px;
  border-radius: 12px;
  font-size: 12px;
  color: #656d76;
}

.progress-text {
  font-size: 12px;
  color: #656d76;
}

.issue-meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #656d76;
  font-size: 13px;
}

.issue-meta {
  color: #656d76;
  font-size: 13px;
}

.issue-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  margin-left: 16px;
}

.issue-comments {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #656d76;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 6px;
  background: #f6f8fa;
  border: 1px solid #d0d7de;
}

.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid #d0d7de;
}

.pagination-container .arco-pagination {
  background-color: #ffffff;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  padding: 8px;
}

.pagination-container .arco-pagination .arco-pagination-item {
  border-radius: 6px;
  border: 1px solid #d0d7de;
  margin: 0 2px;
}

.pagination-container .arco-pagination .arco-pagination-item:hover {
  border-color: #0969da;
  color: #0969da;
}

.pagination-container .arco-pagination .arco-pagination-item.arco-pagination-item-active {
  background-color: #0969da;
  border-color: #0969da;
  color: #ffffff;
}
</style> 