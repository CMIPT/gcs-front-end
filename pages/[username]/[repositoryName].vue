<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();
const repository = ref<RepositoryVO>();
const selectedBranch = ref("master");
const showBranchDropdown = ref(false);
const showCodeDropdown = ref(false);
const showSSH = ref(false);

const toggleSSH = () => {
  showSSH.value = !showSSH.value;
};

const branchSearch = ref("");
const branches = ref(["master", "develop", "feature-1", "feature-2"]); // Example branches

const selectedTag = ref("");
const showTags = ref(false);
const tags = ref(["v1.0", "v1.1", "v2.0"]); // Example tags

const toggleTags = () => {
  showTags.value = !showTags.value;
};

const selectTag = (tag: string) => {
  selectedTag.value = tag;
  showTags.value = false;
  selectedBranch.value = ""; // Clear branch selection when a tag is selected
};

const filteredBranches = computed(() => {
  return branches.value.filter((branch) =>
    branch.toLowerCase().includes(branchSearch.value.toLowerCase()),
  );
});

const fetchRepositoryDetails = async (
  username: string,
  repositoryName: string,
) => {
  const apiURL = new URL(
    APIPaths.REPOSITORY_GET_REPOSITORY_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("username", username);
  apiURL.searchParams.append("repositoryName", repositoryName);
  repository.value = await fetchWithRetry<RepositoryVO>(
    apiURL.toString(),
  ).catch((error) => {
    console.error("Failed to fetch repository details:", error);
    const message = error.data["message"];
    Message.error({ id: "fetch-repository", content: message });
    return {} as RepositoryVO;
  });
};

const toggleBranchDropdown = () => {
  showBranchDropdown.value = !showBranchDropdown.value;
};

const selectBranch = (branch: string) => {
  selectedBranch.value = branch;
  showBranchDropdown.value = false;
};

const toggleCodeDropdown = () => {
  showCodeDropdown.value = !showCodeDropdown.value;
};

const copyToClipboard = (text: string) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        Message.success({ content: "复制成功!" });
      })
      .catch(() => {
        Message.error({ content: "复制失败，请重试。" });
      });
  } else {
    // Fallback method for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        Message.success({ content: "复制成功！" });
      } else {
        Message.error({ content: "复制失败，请重试。" });
      }
    } catch (err) {
      Message.error({ content: "复制失败，请重试。" });
    }
    document.body.removeChild(textarea);
  }
};

const toggleBranches = () => {
  showTags.value = false;
};

const handleStarsClick = () => {
  // Leave action empty for now
};

const handleForksClick = () => {
  // Leave action empty for now
};

const handleWatchersClick = () => {
  // Leave action empty for now
};

// Function to handle clicks outside the dropdown
const handleClickOutside = (event: MouseEvent) => {
  const branchDropdown = document.querySelector(".branch-dropdown");
  const codeDropdown = document.querySelector(".code-dropdown");
  if (
    branchDropdown &&
    !branchDropdown.contains(event.target as Node) &&
    !event.target.closest(".branch-button")
  ) {
    showBranchDropdown.value = false;
  }
  if (
    codeDropdown &&
    !codeDropdown.contains(event.target as Node) &&
    !event.target.closest(".code-button")
  ) {
    showCodeDropdown.value = false;
  }
};

onMounted(async () => {
  const username = route.params.username as string;
  const repositoryName = route.params.repositoryName as string;
  await initialize();
  if (!useUserInfo().value.id) {
    router.push("/");
  }
  fetchRepositoryDetails(username, repositoryName);
  // Add event listener for clicks outside the dropdown
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  // Remove event listener when component is unmounted
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="repository-details" v-if="repository">
    <div class="repository-header">
      <div class="repository-title">
        <h1>
          {{ repository.repositoryName }}
          <span class="repository-visibility">
            {{ repository.isPrivate ? "Private" : "Public" }}
          </span>
        </h1>
        <div class="repository-meta-inline">
          <span class="meta-item">
            <strong>Star </strong>
            <button @click="handleStarsClick">{{ repository.star }}</button>
          </span>
          <span class="meta-item">
            <strong>Fork </strong>
            <button @click="handleForksClick">{{ repository.fork }}</button>
          </span>
          <span class="meta-item">
            <strong>Watch </strong>
            <button @click="handleWatchersClick">
              {{ repository.watcher }}
            </button>
          </span>
        </div>
      </div>
      <p class="repository-owner">
        Owned by <strong>{{ repository.username }}</strong>
      </p>
    </div>
    <div class="repository-actions">
      <button class="branch-button" @click="toggleBranchDropdown">
        {{ selectedBranch || selectedTag }} ▼
      </button>
      <div v-if="showBranchDropdown" class="branch-dropdown">
        <div class="dropdown-header">
          <span>Switch branches/tags</span>
          <span class="close-icon" @click="toggleBranchDropdown">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-x"
              viewBox="0 0 16 16"
            >
              <path
                d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"
              />
            </svg>
          </span>
        </div>
        <div class="branch-search">
          <input
            type="text"
            v-model="branchSearch"
            :placeholder="showTags ? 'Search tags...' : 'Search branches...'"
          />
        </div>
        <div class="toggle-section">
          <p @click="toggleBranches" :class="{ active: !showTags }">Branches</p>
          <span class="separator">|</span>
          <p @click="toggleTags" :class="{ active: showTags }">Tags</p>
        </div>
        <div v-if="showTags">
          <p v-if="tags.length === 0" class="dropdown-item">Nothing to show</p>
          <p
            v-for="tag in tags"
            :key="tag"
            @click="selectTag(tag)"
            class="dropdown-item"
          >
            {{ tag }}
          </p>
        </div>
        <div v-else>
          <p v-if="filteredBranches.length === 0" class="dropdown-item">
            Nothing to show
          </p>
          <p
            v-for="branch in filteredBranches"
            :key="branch"
            @click="selectBranch(branch)"
            class="dropdown-item"
          >
            <span :class="{ 'default-branch': branch === 'master' }">{{
              branch
            }}</span>
            <span v-if="branch === 'master'" class="tag">default</span>
          </p>
        </div>
      </div>
      <button class="code-button" @click="toggleCodeDropdown">Code ▼</button>
      <div v-if="showCodeDropdown" class="code-dropdown">
        <div class="toggle-section">
          <p @click="toggleSSH" :class="{ active: !showSSH }">HTTPS</p>
          <span class="separator">|</span>
          <p @click="toggleSSH" :class="{ active: showSSH }">SSH</p>
        </div>
        <div v-if="showSSH" class="url-container">
          <span class="url-text">{{ repository.sshUrl }}</span>
          <span class="copy-icon" @click="copyToClipboard(repository.sshUrl)">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-clipboard"
              viewBox="0 0 16 16"
            >
              <path
                d="M13 1H9.5a.5.5 0 0 0 0 1H13a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3.5a.5.5 0 0 0 0-1H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2z"
              />
              <path
                d="M5.5 0a.5.5 0 0 0-.5.5V1h-1a.5.5 0 0 0 0 1h1v.5a.5.5 0 0 0 1 0V2h1a.5.5 0 0 0 0-1h-1v-.5a.5.5 0 0 0-.5-.5z"
              />
            </svg>
          </span>
        </div>
        <div v-else class="url-container">
          <span class="url-text">{{ repository.httpsUrl }}</span>
          <span class="copy-icon" @click="copyToClipboard(repository.httpsUrl)">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-clipboard"
              viewBox="0 0 16 16"
            >
              <path
                d="M13 1H9.5a.5.5 0 0 0 0 1H13a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3.5a.5.5 0 0 0 0-1H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2z"
              />
              <path
                d="M5.5 0a.5.5 0 0 0-.5.5V1h-1a.5.5 0 0 0 0 1h1v.5a.5.5 0 0 0 1 0V2h1a.5.5 0 0 0 0-1h-1v-.5a.5.5 0 0 0-.5-.5z"
              />
            </svg>
          </span>
        </div>
      </div>
    </div>
    <div class="repository-description">
      <p>{{ repository.repositoryDescription }}</p>
    </div>
    <div class="repository-directory">
      <h2>Directory</h2>
      <p>Directory information will be displayed here.</p>
    </div>
  </div>
  <div v-else>
    <p>Loading repository details...</p>
  </div>
</template>

<style scoped>
.url-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  background-color: #f6f8fa;
  margin: 5px 0;
}

.url-text {
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-icon {
  cursor: pointer;
  margin-left: 10px;
  font-size: 16px;
  color: #0366d6;
  display: flex;
  align-items: center;
}

.copy-icon:hover {
  color: #0056b3;
}
.toggle-section {
  display: flex;
  justify-content: flex-start; /* Align items to the start */
  align-items: center;
  margin-bottom: 5px;
}

.toggle-section p {
  cursor: pointer;
  font-weight: bold;
  padding: 5px;
  margin: 0;
}

.toggle-section p.active {
  color: #0366d6;
  border-bottom: 2px solid #0366d6;
}

.separator {
  margin: 0 2px;
  color: #ccc;
}

.dropdown-item {
  padding: 5px 10px;
  border-bottom: 1px solid #e1e4e8;
  cursor: pointer;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.repository-details {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  background-color: #f6f8fa;
}

.repository-header {
  border-bottom: 1px solid #e1e4e8;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.repository-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.repository-title h1 {
  font-size: 24px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.repository-visibility {
  font-size: 14px;
  color: #586069;
  background-color: #e1e4e8;
  padding: 2px 6px;
  border-radius: 3px;
}

.repository-meta-inline {
  display: flex;
  gap: 15px;
}

.repository-owner {
  color: #586069;
  font-size: 14px;
}

.meta-item {
  background-color: #e1e4e8;
  padding: 5px 10px;
  border-radius: 3px;
}

.repository-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  position: relative;
}

.branch-button,
.code-button {
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background-color: #0366d6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.branch-button:hover,
.code-button:hover {
  background-color: #0056b3;
}

.branch-dropdown,
.code-dropdown {
  position: absolute;
  top: 100%; /* Position dropdown below the button */
  left: 0;
  width: 30%;
  background-color: #fff;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin: 0;
  padding: 5px 0;
  cursor: pointer;
}

.code-dropdown {
  left: 13%;
  right: 0;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 5px; /* Increased padding for more space */
  border-bottom: 1px solid #e1e4e8;
  font-weight: bold;
  gap: 20px; /* Add gap for spacing between elements */
}

.close-icon {
  cursor: pointer;
  font-size: 14px;
}

.branch-search {
  width: 95%;
  padding: 5px 10px;
  margin: 0 auto 5px auto;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="gray" class="bi bi-search" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zm-5.442 1.398a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/></svg>');
  background-repeat: no-repeat;
  background-position: 10px center;
  padding-left: 30px; /* Add padding to make space for the icon */
}

.default-branch {
  font-weight: bold;
}

.tag {
  background-color: #0366d6;
  color: #fff;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 12px;
  margin-left: 5px;
}
.repository-description {
  margin-bottom: 20px;
}

.repository-directory {
  border-top: 1px solid #e1e4e8;
  padding-top: 10px;
  margin-top: 20px;
}

.repository-directory h2 {
  font-size: 18px;
  margin: 0 0 10px 0;
}

.meta-item button {
  background: none;
  border: none;
  color: #0366d6;
  cursor: pointer;
  font-size: inherit;
  padding: 0;
}

.meta-item button:hover {
  text-decoration: underline;
}
</style>
