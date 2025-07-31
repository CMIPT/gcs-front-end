import type { LabelVO, PageVO } from '@/utils/responseVOTypes'
import { fetchWithRetry } from '@/utils/fetcher'
import { APIPaths } from '@/utils/constant'

export const useLabelApi = () => {
  const getLabels = async (repositoryId: string, page: number, size: number, orderBy: string, isAsc: boolean) => {
    const apiURL = new URL(APIPaths.REPOSITORY_PAGE_LABEL_API_PATH, window.origin)
    apiURL.searchParams.append('repositoryId', repositoryId)
    apiURL.searchParams.append('page', page.toString())
    apiURL.searchParams.append('size', size.toString())
    apiURL.searchParams.append('orderBy', orderBy)
    apiURL.searchParams.append('isAsc', isAsc.toString())
    
    return await fetchWithRetry<PageVO<LabelVO>>(apiURL.toString())
  }

  const createLabel = async (data: {
    name: string
    hexColor: string
    description: string
    repositoryId: string
  }) => {
    return await fetchWithRetry(APIPaths.REPOSITORY_CREATE_LABEL_API_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  }

  const updateLabel = async (data: {
    id: string
    name: string
    hexColor: string
    description: string
    repositoryId: string
  }) => {
    return await fetchWithRetry(APIPaths.REPOSITORY_UPDATE_LABEL_API_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  }

  const deleteLabel = async (id: string) => {
    const apiURL = new URL(APIPaths.REPOSITORY_DELETE_LABEL_API_PATH, window.origin)
    apiURL.searchParams.append('id', id)
    
    return await fetchWithRetry(apiURL.toString(), {
      method: 'DELETE'
    })
  }

  const checkLabelName = async (labelName: string, repositoryId: string) => {
    const apiURL = new URL(APIPaths.REPOSITORY_CHECK_LABEL_NAME_VALIDITY_API_PATH, window.origin)
    apiURL.searchParams.append('labelName', labelName)
    apiURL.searchParams.append('repositoryId', repositoryId)
    
    return await fetchWithRetry(apiURL.toString())
  }

  return {
    getLabels,
    createLabel,
    updateLabel,
    deleteLabel,
    checkLabelName
  }
}
