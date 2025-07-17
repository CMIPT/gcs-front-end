<script setup lang="ts">
import { useActivityApi } from "~/composables/api/activity";

const route = useRoute();
const router = useRouter();
const { createActivity } = useActivityApi();

const repository = ref<RepositoryDetailVO>();
const loading = ref(false);

// 表单数据
const form = reactive({
  title: '',
  content: '',
  parentId: undefined as string | undefined
});

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入问题标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度在1到100个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入问题描述', trigger: 'blur' }
  ]
};

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

// 创建问题
const handleCreate = async () => {
  if (!repository.value) return;
  
  loading.value = true;
  try {
    await createActivity({
      title: form.title,
      description: form.content,
      isPullRequest: false,
      repositoryId: repository.value.id,
      parentId: form.parentId
    });
    
    Message.success('创建问题成功');
    router.push(`/${route.params.username}/${route.params.repositoryName}/issues`);
  } catch (error) {
    tryThrowAndShowError(error, '创建问题失败');
  } finally {
    loading.value = false;
  }
};

// 取消创建
const handleCancel = () => {
  router.push(`/${route.params.username}/${route.params.repositoryName}/issues`);
};

onMounted(async () => {
  await initialize();
  if (!useUserInfo().value.id) {
    useRedirectAfterLogin().value = route.fullPath;
    router.push("/login");
    return;
  }
  await fetchRepositoryDetails();
});
</script>

<template>
  <div class="new-issue-page">
    <div class="new-issue-header">
      <a-typography-title :heading="3">新建问题</a-typography-title>
    </div>

    <a-card>
      <a-form
        :model="form"
        :rules="rules"
        layout="vertical"
        @submit="handleCreate"
      >
        <a-form-item field="title" label="标题">
          <a-input
            v-model="form.title"
            placeholder="请输入问题标题"
            :max-length="100"
            show-word-limit
          />
        </a-form-item>

        <a-form-item field="content" label="描述">
          <a-textarea
            v-model="form.content"
            placeholder="请详细描述您遇到的问题..."
            :rows="10"
            :max-length="5000"
            show-word-limit
          />
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit" :loading="loading">
              创建问题
            </a-button>
            <a-button @click="handleCancel">取消</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<style scoped>
.new-issue-page {
  padding: 20px;
}

.new-issue-header {
  margin-bottom: 20px;
}
</style> 