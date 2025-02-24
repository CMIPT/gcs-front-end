<script setup lang="ts">
import type { FieldRule } from "@arco-design/web-vue";

const formMaxWidth = "1000px";

type NewRepositoryForm = {
  name: string;
  description: string;
  isPrivate: boolean;
};

const userInfo = useUserInfo();
const router = useRouter();

const form = reactive<NewRepositoryForm>({
  name: "",
  description: "",
  isPrivate: false,
});

type NewRepositoryFormState = {
  name: boolean;
};

const formState = reactive<NewRepositoryFormState>({
  name: false,
});

const nameRules: FieldRule[] = [
  {
    validator: async (value, cb) => {
      const repositoryName = value || "";
      const apiURL = new URL(
        APIPaths.REPOSITORY_CHECK_REPOSITORY_NAME_VALIDITY_API_PATH,
        window.origin,
      );
      apiURL.searchParams.append("repositoryName", repositoryName);
      apiURL.searchParams.append("userId", userInfo.value.id);
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

const formRules = {
  name: nameRules,
};

onMounted(async () => {
  await initialize();
  if (!userInfo.value.id) {
    router.push("/");
  }
});

const handleNewRepository = async () => {
  Message.loading({ id: "new-repository", content: "正在新建仓库..." });
  const apiURL = new URL(
    APIPaths.REPOSITORY_CREATE_REPOSITORY_API_PATH,
    window.origin,
  );
  await fetchWithRetry(apiURL.toString(), {
    method: "POST",
    body: JSON.stringify({
      repositoryName: form.name,
      repositoryDescription: form.description,
      isPrivate: form.isPrivate,
    }),
  })
    .then(() => {
      Message.success({
        id: "new-repository",
        content: "创建成功，跳转到主页",
      });
      router.push("/");
    })
    .catch((error) => {
      const message = error.data["message"];
      Message.error({ id: "new-repository", content: message });
    });
};
</script>

<template>
  <a-typography-title :heading="2"> 新建仓库 </a-typography-title>
  <div class="flex flex-col items-center mx-auto my-10">
    <a-form
      :model="form"
      layout="vertical"
      :rules="formRules"
      :style="{ maxWidth: formMaxWidth }"
      @submit-success="handleNewRepository"
    >
      <a-form-item field="name" label="仓库名">
        <a-input v-model="form.name" />
      </a-form-item>
      <a-form-item field="description" label="仓库描述">
        <a-input v-model="form.description" />
      </a-form-item>
      <a-divider />
      <a-form-item field="isPrivate">
        <a-radio-group direction="vertical" v-model="form.isPrivate">
          <a-radio :value="false">
            <div class="flex items-center gap-2 ml-2">
              <Icon name="fa6-solid:book-bookmark" size="24" />
              <div class="flex flex-col">
                <ATypographyText class="text-base font-bold">
                  公开仓库
                </ATypographyText>
                <ATypographyText>
                  任何人都可以查看这个仓库，由你控制代码提交。
                </ATypographyText>
              </div>
            </div>
          </a-radio>
          <a-radio :value="true">
            <div class="flex items-center gap-2 ml-2">
              <Icon name="fa6-solid:lock" size="24" />
              <div class="flex flex-col">
                <ATypographyText class="text-base font-bold">
                  私密仓库
                </ATypographyText>
                <ATypographyText>
                  由你控制仓库查看和代码提交的权利。
                </ATypographyText>
              </div>
            </div>
          </a-radio>
        </a-radio-group>
      </a-form-item>
      <a-divider />
      <a-form-item>
        <a-button
          class="ml-auto"
          type="primary"
          html-type="submit"
          :disabled="!formState.name"
        >
          创建仓库
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
