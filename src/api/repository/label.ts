import type { LabelDTO, LabelVO, } from '@/types PageVO/repository/label'
import { request } from '@/utils/request'

// 分页获取标签列表
export function pageLabel(params: {
  repositoryId: string
  page: number
  size: number
  orderBy: string
  isAsc: boolean
}) {
  return request.get<PageVO<LabelVO>>('/repository/labels', { params })
}

// 创建标签
export function createLabel(data: LabelDTO) {
  return request.post('/repository/labels', data)
}

// 更新标签
export function updateLabel(data: LabelDTO) {
  return request.put(`/repository/labels/${data.id}`, data)
}

// 删除标签
export function deleteLabel(id: string) {
  return request.delete(`/repository/labels/${id}`)
}

// 检查标签名称是否可用
export function checkLabelName(params: {
  labelName: string
  repositoryId: string
}) {
  return request.get('/repository/labels/check-name', { params })
}
