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
const route = useRoute();
const userInfo = useUserInfo();
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const orderBy = ref("GMT_CREATED");
const isAsc = ref(false);
const userSshKeyList = ref<SshKeyVO[]>([]);
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
      if (
        editingIndex.value != null &&
        value === userSshKeyList.value[editingIndex.value].name
      ) {
        formState.name = true;
        cb();
        return;
      }
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

const sshPublicKeyRules: FieldRule[] = [
  {
    validator: async (value, cb) => {
      if (
        editingIndex.value != null &&
        value === userSshKeyList.value[editingIndex.value].publicKey
      ) {
        formState.publicKey = true;
        cb();
        return;
      }
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
  publicKey: sshPublicKeyRules,
};

const isFormValid = computed(() => {
  return Object.values(formState).every((state) => state);
});

const pageSshKeys = async () => {
  const apiURL = new URL(APIPaths.SSH_KEY_PAGE_SSH_KEY_API_PATH, window.origin);
  apiURL.searchParams.append("page", currentPage.value.toString());
  apiURL.searchParams.append("size", pageSize.value.toString());
  apiURL.searchParams.append("orderBy", orderBy.value);
  apiURL.searchParams.append("isAsc", isAsc.value.toString());
  try {
    const response = await fetchWithRetry<PageVO<SshKeyVO>>(apiURL.toString());
    userSshKeyList.value = response.records;
    total.value = response.total;
  } catch (error: any) {
    Message.error({ id: "page-ssh-keys", content: error.data.message });
  }
};

const addSSH = () => {
  editingIndex.value = null;
  formState.name = false;
  formState.publicKey = false;
  form.value.name = "";
  form.value.publicKey = "";
  isModalVisible.value = true;
  formRef.value?.clearValidate();
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
  formRef.value?.clearValidate();
};

const deleteSSH = async (index: number) => {
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
          // When the last SSH key of current page is deleted, the page should decrease by 1.
          if (userSshKeyList.value?.length === 1 && currentPage.value > 1) {
            currentPage.value -= 1;
          }
          pageSshKeys();
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
  if (!isFormValid.value) {
    await formRef.value?.validate();
    if (!isFormValid.value) {
      return false;
    }
  }
  if (editingIndex.value !== null) {
    // Update SSH key
    const apiURL = new URL(
      APIPaths.SSH_KEY_UPDATE_SSH_KEY_API_PATH,
      window.origin,
    );
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
        name: form.value.name === sshKey.name ? null : form.value.name,
        publicKey:
          form.value.publicKey === sshKey.publicKey
            ? null
            : form.value.publicKey,
      },
    })
      .then(() => {
        Message.success({ content: "更新成功" });
        if (editingIndex.value) {
          userSshKeyList.value[editingIndex.value].name = form.value.name;
          userSshKeyList.value[editingIndex.value].publicKey =
            form.value.publicKey;
        }
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
        pageSshKeys();
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
    defaultPageSize: pageSize.value,
    total: total.value,
    current: currentPage.value,
  } as PaginationProps;
});
const handlePageChange = (page: number) => {
  currentPage.value = page;
  pageSshKeys();
};

onMounted(async () => {
  await initialize();
  if (!userInfo.value.id) {
    useRedirectAfterLogin().value = route.fullPath;
    router.push("/login");
    return;
  }
  pageSshKeys();
});
</script>

<template>
  <div class="max-w-screen-lg mx-10">
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
      @page-change="handlePageChange"
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
