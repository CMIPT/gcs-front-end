<script setup lang="ts">
import type { PaginationProps } from "@arco-design/web-vue";

type UserSshKey = {
  id: string;
  name: string;
  publicKey: string;
};

const defaultPageSize = ref(1);
const total = ref(0);
const currentPage = ref(1);
const userSshKeyList = ref<UserSshKey>([]);
const sshName = ref('');
const sshKey = ref('');
const editingIndex = ref<number | null>(null);
const isModalVisible = ref(false);

const fetchSshKeys = async (page: number) => {
    // TODO:
}

const addSSH = () => {
  editingIndex.value = null;
  sshName.value = '';
  sshKey.value = '';
  isModalVisible.value = true;
};

const editSSH = (index: number) => {
  editingIndex.value = index;
  sshName.value = userSshKeyList.value[index].name;
  sshKey.value = userSshKeyList.value[index].publicKey;
  isModalVisible.value = true;
};

const handleOk = async () => {
  try {
    if (editingIndex.value !== null) {
      // Update existing SSH key
    // TODO:
    } else {
      // Add new SSH key
    // TODO:
    }
    fetchSshKeys(currentPage.value);
  } catch (error) {
    console.error("Error saving SSH key:", error);
  } finally {
    isModalVisible.value = false;
  }
};

const handleCancel = () => {
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
  };
});

onMounted(async () => {
    fetchSshKeys(currentPage.value);
});
</script>

<template>
    <h1>Profile</h1>
    <a-button type="primary" @click="addSSH">Add SSH</a-button>
    <a-list
          :bordered="false"
          :data="userSshKeyList"
          :pagination-props="paginationProps"
          @item-click="editSSH"
    >
      <template #item="{ item }">
        <a-list-item class="list-demo-item" action-layout="vertical">
            <a-list-item-meta
                :title="item.name"
                :description="item.publicKey"
            />
        </a-list-item>
      </template>
    </a-list>
    <a-modal
      title="Add SSH Key"
      v-model:visible="isModalVisible"
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <a-form>
        <a-form-item label="Name">
          <a-input v-model="sshName" placeholder="Enter SSH name" />
        </a-form-item>
        <a-form-item label="Public Key">
          <a-input v-model="sshKey" placeholder="Enter SSH public key" />
        </a-form-item>
      </a-form>
    </a-modal>
</template>
