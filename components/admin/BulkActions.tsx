'use client'

import { useState } from 'react'
import { ChevronDown, Download, Mail, Trash2, UserCheck, XCircle, FileText, Edit } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal, { ConfirmModal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Input'
import { toast } from 'react-hot-toast'

interface BulkActionsProps {
  selectedItems: string[]
  totalItems: number
  onAction: (action: string, params?: any) => Promise<void>
  actions: BulkAction[]
  entityName: string
}

interface BulkAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  variant?: 'primary' | 'danger' | 'warning'
  requireConfirm?: boolean
  confirmMessage?: string
  modal?: React.ComponentType<BulkActionModalProps>
}

interface BulkActionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (params: any) => void
  selectedCount: number
}

export default function BulkActions({
  selectedItems,
  totalItems,
  onAction,
  actions,
  entityName
}: BulkActionsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleAction = async (action: BulkAction, params?: any) => {
    if (action.requireConfirm && !confirmAction) {
      setConfirmAction(action)
      return
    }

    setProcessing(true)
    try {
      await onAction(action.id, params)
      toast.success(`${selectedItems.length}件の${entityName}に対して「${action.label}」を実行しました`)
      setActiveModal(null)
      setConfirmAction(null)
    } catch (error) {
      toast.error('操作に失敗しました')
    } finally {
      setProcessing(false)
    }
  }

  if (selectedItems.length === 0) {
    return null
  }

  return (
    <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <span className="text-sm text-gray-700">
          {selectedItems.length}件を選択中
          {selectedItems.length < totalItems && (
            <button
              className="ml-2 text-blue-600 hover:text-blue-800"
              onClick={() => {/* すべて選択の処理 */}}
            >
              （すべて選択）
            </button>
          )}
        </span>
      </div>

      <div className="relative">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          一括操作
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>

        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
              <div className="py-1">
                {actions.map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.id}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setIsDropdownOpen(false)
                        if (action.modal) {
                          setActiveModal(action.id)
                        } else {
                          handleAction(action)
                        }
                      }}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {action.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 確認モーダル */}
      {confirmAction && (
        <ConfirmModal
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => handleAction(confirmAction)}
          title={`${confirmAction.label}の確認`}
          message={confirmAction.confirmMessage || `${selectedItems.length}件の${entityName}に対して「${confirmAction.label}」を実行しますか？`}
          confirmText="実行"
          variant={confirmAction.variant === 'danger' ? 'danger' : 'info'}
          loading={processing}
        />
      )}

      {/* カスタムモーダル */}
      {actions.map((action) => {
        if (!action.modal) return null
        const ModalComponent = action.modal
        return (
          <ModalComponent
            key={action.id}
            isOpen={activeModal === action.id}
            onClose={() => setActiveModal(null)}
            onConfirm={(params) => handleAction(action, params)}
            selectedCount={selectedItems.length}
          />
        )
      })}
    </div>
  )
}

// 一括メール送信モーダル
export function BulkEmailModal({ isOpen, onClose, onConfirm, selectedCount }: BulkActionModalProps) {
  const [emailType, setEmailType] = useState('')
  const [subject, setSubject] = useState('')
  const [useTemplate, setUseTemplate] = useState(true)
  const [templateId, setTemplateId] = useState('')
  const [customMessage, setCustomMessage] = useState('')

  const handleConfirm = () => {
    if (!emailType || (!templateId && !customMessage)) {
      toast.error('必要な情報を入力してください')
      return
    }

    onConfirm({
      emailType,
      subject: useTemplate ? undefined : subject,
      templateId: useTemplate ? templateId : undefined,
      message: useTemplate ? undefined : customMessage
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="一括メール送信"
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {selectedCount}件の宛先にメールを送信します。
        </p>

        <Select
          label="メール種別"
          value={emailType}
          onChange={(e) => setEmailType(e.target.value)}
          options={[
            { value: '', label: '選択してください' },
            { value: 'reminder', label: 'リマインダー' },
            { value: 'notice', label: 'お知らせ' },
            { value: 'follow_up', label: 'フォローアップ' },
            { value: 'custom', label: 'カスタム' }
          ]}
          required
        />

        <div>
          <label className="flex items-center mb-3">
            <input
              type="checkbox"
              checked={useTemplate}
              onChange={(e) => setUseTemplate(e.target.checked)}
              className="mr-2"
            />
            テンプレートを使用
          </label>

          {useTemplate ? (
            <Select
              label="メールテンプレート"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              options={[
                { value: '', label: '選択してください' },
                { value: 'reminder_24h', label: '24時間前リマインダー' },
                { value: 'reminder_1h', label: '1時間前リマインダー' },
                { value: 'thank_you', label: 'サンクスメール' }
              ]}
              required
            />
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  件名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="メールの件名を入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  本文 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="メール本文を入力&#10;&#10;使用可能な変数:&#10;{{name}} - 参加者名&#10;{{seminar_title}} - セミナータイトル&#10;{{session_date}} - 開催日時"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleConfirm}>
            送信
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// 一括ステータス変更モーダル
export function BulkStatusChangeModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  selectedCount,
  statusOptions 
}: BulkActionModalProps & { statusOptions: Array<{ value: string; label: string }> }) {
  const [newStatus, setNewStatus] = useState('')
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    if (!newStatus) {
      toast.error('新しいステータスを選択してください')
      return
    }

    onConfirm({
      status: newStatus,
      reason
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="一括ステータス変更"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {selectedCount}件のステータスを変更します。
        </p>

        <Select
          label="新しいステータス"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          options={[
            { value: '', label: '選択してください' },
            ...statusOptions
          ]}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            変更理由（任意）
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="ステータス変更の理由を入力"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleConfirm}>
            変更
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// 注文管理用の一括アクション
export const orderBulkActions: BulkAction[] = [
  {
    id: 'export',
    label: 'CSVエクスポート',
    icon: Download,
    variant: 'primary'
  },
  {
    id: 'send_email',
    label: 'メール送信',
    icon: Mail,
    variant: 'primary',
    modal: BulkEmailModal
  },
  {
    id: 'generate_invoice',
    label: '領収書発行',
    icon: FileText,
    variant: 'primary'
  },
  {
    id: 'cancel',
    label: 'キャンセル',
    icon: XCircle,
    variant: 'danger',
    requireConfirm: true,
    confirmMessage: '選択した注文をキャンセルしますか？この操作は取り消せません。'
  }
]

// 参加者管理用の一括アクション
export const participantBulkActions: BulkAction[] = [
  {
    id: 'check_in',
    label: 'チェックイン',
    icon: UserCheck,
    variant: 'primary'
  },
  {
    id: 'send_email',
    label: 'メール送信',
    icon: Mail,
    variant: 'primary',
    modal: BulkEmailModal
  },
  {
    id: 'export',
    label: 'CSVエクスポート',
    icon: Download,
    variant: 'primary'
  },
  {
    id: 'update_status',
    label: 'ステータス変更',
    icon: Edit,
    variant: 'primary',
    modal: (props: BulkActionModalProps) => (
      <BulkStatusChangeModal
        {...props}
        statusOptions={[
          { value: 'REGISTERED', label: '登録済み' },
          { value: 'CHECKED_IN', label: 'チェックイン済み' },
          { value: 'NO_SHOW', label: '欠席' },
          { value: 'CANCELLED', label: 'キャンセル' }
        ]}
      />
    )
  }
]

