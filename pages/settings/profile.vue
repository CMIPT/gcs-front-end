<script setup lang="ts">
import {
  type FormInstance,
  type FieldRule,
  type PaginationProps,
} from "@arco-design/web-vue";

type SshKeyForm = {
  name: string;
  publicKey: string;
};

const isOkButtonLoading = ref(false);
const router = useRouter();
const userInfo = useUserInfo();
const defaultPageSize = ref(10);
const total = ref(0);
const currentPage = ref(1);
const userSshKeyList = ref<SshKeyVO[]>();
const editingIndex = ref<number | null>(null);
const isModalVisible = ref(false);

const form = ref<SshKeyForm>({
  name: "",
  publicKey: "",
});

const formRef = ref<FormInstance>();

const formState = reactive({
  name: false,
  publicKey: false,
});

const sshNameRules: FieldRule[] = [
  {
    validator: async (value, cb) => {
      const name = value || "";
      const apiURL = new URL(
        APIPaths.SSH_KEY_CHECK_SSH_KEY_NAME_VALIDITY_API_PATH,
        window.origin,
      );
      apiURL.searchParams.append("name", name);
      await fetchWithRetry(apiURL.toString())
        .then(() => {
          formState.name = true;
          cb();
        })
        .catch((error) => {
          formState.name = false;
          const message = error.data["message"];
          cb(message);
        });
    },
  },
];

const sshKeyRules: FieldRule[] = [
  {
    validator: async (value, cb) => {
      const publicKey = value || "";
      const apiURL = new URL(
        APIPaths.SSH_KEY_CHECK_SSH_KEY_PUBLIC_KEY_VALIDITY_API_PATH,
        window.origin,
      );
      apiURL.searchParams.append("publicKey", publicKey);
      await fetchWithRetry(apiURL.toString())
        .then(() => {
          formState.publicKey = true;
          cb();
        })
        .catch((error) => {
          formState.publicKey = false;
          const message = error.data["message"];
          cb(message);
        });
    },
  },
];

const formRules = {
  name: sshNameRules,
  publicKey: sshKeyRules,
};

const isFormValid = computed(() => {
  return Object.values(formState).every((state) => state);
});

const fetchSshKeys = async (page: number) => {
  const apiURL = new URL(APIPaths.SSH_KEY_PAGE_SSH_KEY_API_PATH, window.origin);
  apiURL.searchParams.append("id", userInfo.value.id);
  apiURL.searchParams.append("page", page.toString());
  apiURL.searchParams.append("size", defaultPageSize.value.toString());
  try {
    const response = await fetchWithRetry<PageVO<SshKeyVO>>(apiURL.toString());
    userSshKeyList.value = response.records;
    total.value = response.total;
  } catch (error) {
    console.error("Error fetching SSH keys:", error);
  }
};

const addSSH = () => {
  editingIndex.value = null;
  formState.name = false;
  formState.publicKey = false;
  form.value.name = "";
  form.value.publicKey = "";
  isModalVisible.value = true;
  if (formRef.value) {
    formRef.value.clearValidate();
  }
};

const editSSH = (index: number) => {
  if (userSshKeyList.value === undefined) {
    throw new Error("SSH key list is undefined");
  }
  const sshKey = userSshKeyList.value[index];
  formState.name = true;
  formState.publicKey = true;
  form.value.name = sshKey.name;
  form.value.publicKey = sshKey.publicKey;
  editingIndex.value = index;
  isModalVisible.value = true;
  if (formRef.value) {
    formRef.value.clearValidate();
  }
};

const deleteSSH = async (index: number) => {
  if (userSshKeyList.value === undefined) {
    throw new Error("SSH key list is undefined");
  }
  const sshKey = userSshKeyList.value[index];
  Modal.confirm({
    title: "确认删除",
    content: `您确定要删除公钥 "${sshKey.name}" 吗？`,
    onOk: async () => {
      const apiURL = new URL(
        APIPaths.SSH_KEY_DELETE_SSH_KEY_API_PATH,
        window.origin,
      );
      apiURL.searchParams.append("id", sshKey.id);
      await fetchWithRetry(apiURL.toString(), {
        method: "DELETE",
      })
        .then(() => {
          Message.success({ content: "删除成功" });
          // BUG:
          // When the last SSH key of current page is deleted, the page should decrease by 1.
          fetchSshKeys(currentPage.value);
        })
        .catch((error) => {
          const message = error.data["message"];
          Message.error({ id: "delete-ssh-key", content: message });
        });
    },
  });
};

const handleAddOrEditSSHKeyConfirm = async () => {
  if (isOkButtonLoading.value) {
    return;
  }
  isOkButtonLoading.value = true;
  if (editingIndex.value !== null) {
    // Update SSH key
    const apiURL = new URL(
      APIPaths.SSH_KEY_UPDATE_SSH_KEY_API_PATH,
      window.origin,
    );
    if (userSshKeyList.value === undefined) {
      throw new Error("SSH key list is undefined");
    }
    const sshKey = userSshKeyList.value[editingIndex.value];
    // No need to update if the SSH key is not changed
    if (
      form.value.name === sshKey.name &&
      form.value.publicKey === sshKey.publicKey
    ) {
      isModalVisible.value = false;
      isOkButtonLoading.value = false;
      return;
    }
    await fetchWithRetry(apiURL.toString(), {
      method: "POST",
      body: {
        id: sshKey.id,
        name: form.value.name,
        publicKey: form.value.publicKey,
      },
    })
      .then(() => {
        Message.success({ content: "更新成功" });
        isModalVisible.value = false;
        fetchSshKeys(currentPage.value);
      })
      .catch((error) => {
        const message = error.data["message"];
        Message.error({ id: "update-ssh-key", content: message });
      });
  } else {
    // Add new SSH key
    const apiURL = new URL(
      APIPaths.SSH_KEY_UPLOAD_SSH_KEY_API_PATH,
      window.origin,
    );
    await fetchWithRetry(apiURL.toString(), {
      method: "POST",
      body: {
        name: form.value.name,
        publicKey: form.value.publicKey,
      },
    })
      .then(() => {
        Message.success({ content: "添加成功" });
        isModalVisible.value = false;
        fetchSshKeys(currentPage.value);
      })
      .catch((error) => {
        const message = error.data["message"];
        Message.error({ id: "add-ssh-key", content: message });
      });
  }
  isOkButtonLoading.value = false;
};

const handleAddOrEditSSHKeyCancel = () => {
  isModalVisible.value = false;
};

const paginationProps = computed(() => {
  return {
    defaultPageSize: defaultPageSize.value,
    total: total.value,
    current: currentPage.value,
    onChange: (page: number) => {
      currentPage.value = page;
      fetchSshKeys(page);
    },
  } as PaginationProps;
});

onMounted(async () => {
  await initialize();
  if (!userInfo.value.id) {
    router.push("/");
  }
  fetchSshKeys(currentPage.value);
});
</script>

<template>
  <h1>Profile</h1>
  <a-button type="primary" @click="addSSH">添加公钥</a-button>
  <a-list
    :bordered="false"
    :data="userSshKeyList"
    :pagination-props="paginationProps"
  >
    <template #item="{ item, index }">
      <a-list-item
        class="list-demo-item"
        action-layout="vertical"
        @click="editSSH(index)"
      >
        <a-list-item-meta :title="item.name" :description="item.publicKey" />
        <template #actions>
          <icon-edit />
          <a-button type="text" @click.stop="deleteSSH(index)">
            <icon-delete />
          </a-button>
        </template>
      </a-list-item>
    </template>
  </a-list>
  <a-modal
    title="添加公钥"
    :visible="isModalVisible"
    @ok="handleAddOrEditSSHKeyConfirm"
    :ok-button-props="{ disabled: !isFormValid }"
    @cancel="handleAddOrEditSSHKeyCancel"
  >
    <a-form :model="form" :rules="formRules" layout="vertical" ref="formRef">
      <a-form-item field="name" label="标题" validate-trigger="blur">
        <a-input v-model="form.name" placeholder="请输入标题" />
      </a-form-item>
      <a-form-item field="publicKey" label="公钥" validate-trigger="blur">
        <a-input v-model="form.publicKey" placeholder="请输入公钥" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style scoped>
.list-demo-item {
  cursor: pointer;
  transition: background-color 0.3s;
}

.list-demo-item:hover {
  background-color: #f5f5f5;
}

.list-demo-item a-icon {
  margin-left: auto;
  color: #1890ff;
  transition: color 0.3s;
}

.list-demo-item:hover a-icon {
  color: #40a9ff;
}

a-button {
  margin-left: 8px;
}
</style>
