<script setup lang="ts">
import { type PaginationProps, Message, Modal } from "@arco-design/web-vue";
import type { LabelVO } from "~/utils/responseVOTypes";
import { useLabelApi } from "~/composables/api/label";
import { tryThrowAndShowError } from "~/utils/errorHandler";
import GCSColorPicker from "~/components/GCSColorPicker.vue";

const props = defineProps<{
  repository: RepositoryDetailVO;
}>();

const repository = props.repository;
const { getLabels, createLabel, updateLabel, deleteLabel, checkLabelName } = useLabelApi();

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const labels = ref<LabelVO[]>([]);
const currentPage = ref<number>(1);
const pageSize = ref<number>(10);
const total = ref<number>(0);
const orderBy = ref("GMT_CREATED");
const isAsc = ref(false);

const createDialogVisible = ref(false);
const editDialogVisible = ref(false);

const createLabelForm = reactive({
  name: '',
  hexColor: '#409EFF',
  description: ''
});

const editForm = reactive({
  id: '',
  name: '',
  hexColor: '',
  description: ''
});

const rules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在1到20个字符', trigger: 'blur' },
    { 
      validator: async (value: string, cb: any) => {
        if (!value || !repository) {
          cb();
          return;
        }
        try {
          await checkLabelName(value, repository.id);
          cb();
        } catch (error) {
          cb('标签名称已存在');
        }
      }, 
      trigger: 'blur' 
    }
  ],
  hexColor: [
    { required: true, message: '请选择标签颜色', trigger: 'blur' },
    { 
      validator: (value: string, cb: any) => {
        if (!/^#[0-9A-F]{6}$/i.test(value)) {
          cb('请输入有效的颜色值（如：#409EFF）');
        } else {
          cb();
        }
      }, 
      trigger: 'blur' 
    }
  ]
};

// 分页查询标签列表
const fetchLabels = async () => {
  if (!repository) {
    return;
  }
  
  loading.value = true;
  try {
    const response = await getLabels(
      repository.id,
      currentPage.value,
      pageSize.value,
      orderBy.value,
      isAsc.value
    );
    labels.value = response.records;
    total.value = response.total;
  } catch (error) {
    tryThrowAndShowError(error, '获取标签列表失败');
  } finally {
    loading.value = false;
  }
};

// 显示创建对话框
const showCreateDialog = () => {
  createLabelForm.name = '';
  createLabelForm.hexColor = '#409EFF';
  createLabelForm.description = '';
  createDialogVisible.value = true;
};

// 创建标签
const handleCreate = async () => {
  if (!repository) return;

  try {
    await createLabel({
      name: createLabelForm.name,
      hexColor: createLabelForm.hexColor,
      description: createLabelForm.description,
      repositoryId: repository.id
    });
    
    Message.success('创建标签成功');
    createDialogVisible.value = false;
    await fetchLabels();
  } catch (error) {
    tryThrowAndShowError(error, '创建标签失败');
  }
};

// 显示编辑对话框
const showEditDialog = (label: LabelVO) => {
  editForm.id = label.id;
  editForm.name = label.name;
  editForm.hexColor = label.hexColor;
  editForm.description = label.description;
  editDialogVisible.value = true;
};

// 更新标签
const handleUpdate = async () => {
  if (!repository) return;

  try {
    await updateLabel({
      id: editForm.id,
      name: editForm.name,
      hexColor: editForm.hexColor,
      description: editForm.description,
      repositoryId: repository.id
    });
    
    Message.success('更新标签成功');
    editDialogVisible.value = false;
    await fetchLabels();
  } catch (error) {
    tryThrowAndShowError(error, '更新标签失败');
  }
};

const handleTagClick = (row: LabelVO) => {
  router.push({
    name: 'repository-issues',
    params: {
      username: route.params.username,
      repositoryName: route.params.repositoryName
    },
    query: {
      labels: row.name
    }
  });
};

// 删除标签
const handleDelete = async (id: string) => {
  try {
    await Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个标签吗？',
      onBeforeOk: async () => {
        await deleteLabel(id);
        Message.success('删除标签成功');
        await fetchLabels();
        return true;
      }
    });
  } catch (error) {
    tryThrowAndShowError(error, '删除标签失败');
    }
};

// 分页处理
const paginationProps = computed(() => {
  return {
    defaultPageSize: pageSize.value,
    total: total.value,
    current: currentPage.value,
    showPageSize: true,
    showJumper: true,
    showTotal: true,
  } as PaginationProps;
});

const handlePageSizeChange = (size: number) => {
  currentPage.value = (pageSize.value * (currentPage.value - 1)) / size + 1;
  pageSize.value = size;
  fetchLabels();
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchLabels();
};

onMounted(() => {
  fetchLabels();
});
</script>

<template>
  <div class="repository-settings-labels">
    <a-typography-title :heading="3">标签管理</a-typography-title>

    <div class="label-actions">
      <a-button type="primary" @click="showCreateDialog">新建标签</a-button>
    </div>

    <a-table :data="labels" :loading="loading" :pagination="false">
      <template #columns>
        <a-table-column title="名称" data-index="name">
          <template #cell="{ record }">
            <a-tag :color="record.hexColor" @click="handleTagClick(record)">{{ record.name }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="描述" data-index="description" />
        <a-table-column title="操作" :width="180">
          <template #cell="{ record }">
            <a-button size="small" @click="showEditDialog(record)">编辑</a-button>
            <a-button size="small" status="danger" @click="handleDelete(record.id)">删除</a-button>
        </template>
        </a-table-column>
        </template>
    </a-table>

    <!-- 分页组件 -->
    <div class="pagination-container">
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

    <!-- 创建标签对话框 -->
    <a-modal v-model:visible="createDialogVisible" title="新建标签" width="500px">
      <a-form :model="createLabelForm" :rules="rules">
        <a-form-item field="name" label="名称">
          <a-input 
            v-model="createLabelForm.name" 
            placeholder="请输入标签名称"
          />
        </a-form-item>
        <a-form-item field="hexColor" label="颜色">
          <GCSColorPicker v-model="createLabelForm.hexColor" />
        </a-form-item>
        <a-form-item field="description" label="描述">
          <a-textarea 
            v-model="createLabelForm.description" 
            placeholder="请输入标签描述（可选）"
            :rows="3"
          />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="createDialogVisible = false">取消</a-button>
        <a-button type="primary" @click="handleCreate">确定</a-button>
      </template>
    </a-modal>

    <!-- 编辑标签对话框 -->
    <a-modal v-model:visible="editDialogVisible" title="编辑标签" width="500px">
      <a-form :model="editForm" :rules="rules">
        <a-form-item field="name" label="名称">
          <a-input 
            v-model="editForm.name" 
            placeholder="请输入标签名称"
          />
        </a-form-item>
        <a-form-item field="hexColor" label="颜色">
          <GCSColorPicker v-model="editForm.hexColor" />
        </a-form-item>
        <a-form-item field="description" label="描述">
          <a-textarea 
            v-model="editForm.description" 
            placeholder="请输入标签描述（可选）"
            :rows="3"
          />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="editDialogVisible = false">取消</a-button>
        <a-button type="primary" @click="handleUpdate">确定</a-button>
      </template>
    </a-modal>
  </div>
</template>

<style scoped>
.repository-settings-labels {
  padding: 20px;
}

.label-actions {
  margin-bottom: 20px;
}

.a-tag {
  color: white;
  cursor: pointer;
}

.a-tag:hover {
  opacity: 0.8;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
