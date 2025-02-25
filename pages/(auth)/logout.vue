<script setup lang="ts">
const router = useRouter();
const userInfo = useUserInfo();
onMounted(async () => {
  if (userInfo.value.id) {
    const apiURL = new URL(
      APIPaths.AUTHENTICATION_SIGN_OUT_API_PATH,
      window.origin,
    );
    apiURL.searchParams.append("id", userInfo.value.id);
    await $fetch(apiURL.toString(), {
      method: "DELETE",
    })
      .then(() => {
        sessionStorage.removeItem("access-token");
        localStorage.removeItem("refresh-token");
        userInfo.value = {} as UserVO;
        useUserAuth().value = {} as UserAuthState;
        Message.success("你已成功登出");
        router.push("/");
      })
      .catch((error) => {
        Message.error(error.data.message);
      });
  }
});
</script>
