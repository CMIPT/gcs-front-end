<script setup>
const newRepositoryWidth = "600px";

const newRepositoryForm = reactive({
  repositoryName: "",
  repositoryDescription: "",
  isPrivate: false,
});

const handleNewRepository = () => {};
</script>

<template>
  <div
    class="flex flex-col mx-auto my-10"
    :style="{ width: newRepositoryWidth }"
  >
    <ATypographyTitle :heading="2"> 新建仓库 </ATypographyTitle>
    <AForm :model="newRepositoryForm" layout="vertical">
      <AFormItem field="repositoryName" label="仓库名">
        <AInput v-model="newRepositoryForm.repositoryName" />
      </AFormItem>
      <AFormItem field="repositoryDescription" label="仓库描述">
        <AInput v-model="newRepositoryForm.repositoryDescription" />
      </AFormItem>
    </AForm>
    <ADivider />
    <a-radio-group direction="vertical">
      <a-radio class="mb-2">
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
