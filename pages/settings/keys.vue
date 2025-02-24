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
    onBeforeOk: async () => {
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
      return true;
    },
  });
};

const handleAddOrEditSSHKeyConfirm = async () => {
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
      return true;
    }
    return await fetchWithRetry(apiURL.toString(), {
      method: "POST",
      body: {
        id: sshKey.id,
        name: form.value.name,
        publicKey: form.value.publicKey,
      },
    })
      .then(() => {
        Message.success({ content: "更新成功" });
        fetchSshKeys(currentPage.value);
        return true;
      })
      .catch((error) => {
        const message = error.data["message"];
        Message.error({ id: "update-ssh-key", content: message });
        return false;
      });
  } else {
    // Add new SSH key
    const apiURL = new URL(
      APIPaths.SSH_KEY_UPLOAD_SSH_KEY_API_PATH,
      window.origin,
    );
    return await fetchWithRetry(apiURL.toString(), {
      method: "POST",
      body: {
        name: form.value.name,
        publicKey: form.value.publicKey,
      },
    })
      .then(() => {
        Message.success({ content: "添加成功" });
        fetchSshKeys(currentPage.value);
        return true;
      })
      .catch((error) => {
        const message = error.data["message"];
        Message.error({ id: "add-ssh-key", content: message });
        return false;
      });
  }
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
    return
  }
  fetchSshKeys(currentPage.value);
});
</script>

<template>
  <div class="max-w-screen-lg mx-auto">
    <a-typography-title :heading="3" v-if="userInfo.username">
      <a-row justify="space-between">
        <a-col flex="none"> {{ userInfo.username }}的公钥 </a-col>
        <a-col flex="none">
          <a-button type="primary" @click="addSSH">添加公钥</a-button>
        </a-col>
      </a-row>
    </a-typography-title>
    <a-list
      :bordered="false"
      :data="userSshKeyList"
      :pagination-props="paginationProps"
    >
      <template #item="{ item, index }">
        <a-list-item action-layout="vertical">
          <a-list-item-meta :title="item.name" :description="item.publicKey" />
          <template #actions>
            <icon-edit @click="editSSH(index)" />
            <icon-delete @click="deleteSSH(index)" />
          </template>
        </a-list-item>
      </template>
    </a-list>
  </div>
  <a-modal
    title="添加公钥"
    v-model:visible="isModalVisible"
    :on-before-ok="handleAddOrEditSSHKeyConfirm"
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
