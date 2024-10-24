<script setup>
const newRepositoryWidth = "600px";

const newRepositoryForm = reactive({
  repositoryName: "",
  repositoryDescription: "",
});

const repositoryIsPrivate = ref(false);

const userAuth = useState("userAuth");
const userInfo = useState("userInfo");

const handleNewRepository = async () => {
  const config = useRuntimeConfig();
  try {
    Message.loading("正在新建仓库...");
    const apiURL = new URL(
      APIPaths.REPOSITORY_CREATE_REPOSITORY_API_PATH,
      config.public.apiBaseURL
    );
    await $fetch(apiURL, {
      method: "POST",
      body: JSON.stringify({
        repositoryName: newRepositoryForm.repositoryName,
        repositoryDescription: newRepositoryForm.repositoryDescription,
        isPrivate: repositoryIsPrivate.value,
      }),
      headers: {
        "access-token": userAuth.value.accessToken,
      },
      onResponse({ _, response }) {
        Message.clear();
        const message = response._data["message"];
        if (response.status === HTTPStatusCode.OK) {
          Message.success(message);
          router.push("/");
        } else {
          Message.error(message);
        }
      },
    });
  } catch (e) {
    console.error(e);
  }
};

const repositoryNameRules = [
  {
    validator: async (value, cb) => {
      const config = useRuntimeConfig();
      try {
        const repositoryName = value ? value : "";
        const userId = userInfo.value.id ? userInfo.value.id : "";
        if (!userId) {
          // 到底会不会出现这个问题呢
          Message.error("校验仓库名时，前端出现内部错误");
          cb();
          return;
        }
        const apiURL = new URL(
          APIPaths.REPOSITORY_CHECK_REPOSITORY_NAME_VALIDITY_API_PATH,
          config.public.apiBaseURL
        );
        apiURL.searchParams.append("repositoryName", repositoryName);
        apiURL.searchParams.append("userId", userId);
        await $fetch(apiURL);
        cb();
      } catch (error) {
        console.error(error);
        const message = error.response._data["message"];
        cb(message);
      }
    },
  },
];

const newRepositoryFormRules = {
  repositoryName: repositoryNameRules,
};
</script>

<template>
  <div
    class="flex flex-col mx-auto my-10"
    :style="{ width: newRepositoryWidth }"
  >
    <ATypographyTitle :heading="2"> 新建仓库 </ATypographyTitle>
    <AForm
      :model="newRepositoryForm"
      layout="vertical"
      :rules="newRepositoryFormRules"
    >
      <AFormItem field="repositoryName" label="仓库名">
        <AInput v-model="newRepositoryForm.repositoryName" />
      </AFormItem>
      <AFormItem field="repositoryDescription" label="仓库描述">
        <AInput v-model="newRepositoryForm.repositoryDescription" />
      </AFormItem>
    </AForm>
    <ADivider />
    <a-radio-group direction="vertical" v-model="repositoryIsPrivate">
      <a-radio class="mb-2" :value="false">
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
      <a-radio>
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
    <ADivider />
    <AButton class="ml-auto" type="primary" @click="handleNewRepository">
      创建仓库
    </AButton>
  </div>
</template>
