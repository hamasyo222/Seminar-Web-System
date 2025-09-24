'use client'

import { useEffect, useState } from 'react'
import { generateParticipantQRCode } from '@/lib/qrcode'
import { Spinner } from '@/components/ui/Loading'
import { QrCode } from 'lucide-react'

interface QRCodeDisplayProps {
  participantId: string
  sessionId: string
  participantName: string
  className?: string
}

export default function QRCodeDisplay({
  participantId,
  sessionId,
  participantName,
  className = ''
}: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    generateQRCode()
  }, [participantId, sessionId])

  const generateQRCode = async () => {
    try {
      setLoading(true)
      setError(false)
      const url = await generateParticipantQRCode(participantId, sessionId)
      setQrCodeUrl(url)
    } catch (error) {
      console.error('QR code generation error:', error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !qrCodeUrl) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-gray-500 ${className}`}>
        <QrCode className="w-12 h-12 mb-2" />
        <p className="text-sm">QRコードの生成に失敗しました</p>
        <button
          onClick={generateQRCode}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          再試行
        </button>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img
        src={qrCodeUrl}
        alt={`QR Code for ${participantName}`}
        className="w-48 h-48"
      />
      <div className="mt-4 text-center">
        <p className="text-sm font-medium text-gray-900">{participantName}</p>
        <p className="text-xs text-gray-500 mt-1">
          参加者ID: {participantId.slice(-8)}
        </p>
      </div>
    </div>
  )
}




