import QRCode from 'qrcode'

export interface QRCodeData {
  type: 'participant' | 'order'
  id: string
  sessionId: string
  timestamp: number
}

// QRコードデータの生成
export function generateQRData(
  type: 'participant' | 'order',
  id: string,
  sessionId: string
): string {
  const data: QRCodeData = {
    type,
    id,
    sessionId,
    timestamp: Date.now()
  }
  
  // データをBase64エンコード
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

// QRコードデータの解析
export function parseQRData(encodedData: string): QRCodeData | null {
  try {
    const decoded = Buffer.from(encodedData, 'base64').toString('utf-8')
    const data = JSON.parse(decoded) as QRCodeData
    
    // データの検証
    if (!data.type || !data.id || !data.sessionId || !data.timestamp) {
      return null
    }
    
    // タイムスタンプの有効期限チェック（24時間）
    const expiryTime = 24 * 60 * 60 * 1000
    if (Date.now() - data.timestamp > expiryTime) {
      return null
    }
    
    return data
  } catch (error) {
    console.error('QR data parse error:', error)
    return null
  }
}

// QRコード画像の生成（データURL）
export async function generateQRCodeDataURL(
  data: string,
  options?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
  try {
    const defaultOptions: QRCode.QRCodeToDataURLOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      ...options
    }
    
    return await QRCode.toDataURL(data, defaultOptions)
  } catch (error) {
    console.error('QR code generation error:', error)
    throw new Error('QRコードの生成に失敗しました')
  }
}

// QRコード画像の生成（Buffer）
export async function generateQRCodeBuffer(
  data: string,
  options?: QRCode.QRCodeToBufferOptions
): Promise<Buffer> {
  try {
    const defaultOptions: QRCode.QRCodeToBufferOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      ...options
    }
    
    return await QRCode.toBuffer(data, defaultOptions)
  } catch (error) {
    console.error('QR code generation error:', error)
    throw new Error('QRコードの生成に失敗しました')
  }
}

// 参加者用QRコードの生成
export async function generateParticipantQRCode(
  participantId: string,
  sessionId: string
): Promise<string> {
  const qrData = generateQRData('participant', participantId, sessionId)
  return await generateQRCodeDataURL(qrData)
}

// 注文用QRコードの生成
export async function generateOrderQRCode(
  orderId: string,
  sessionId: string
): Promise<string> {
  const qrData = generateQRData('order', orderId, sessionId)
  return await generateQRCodeDataURL(qrData)
}




