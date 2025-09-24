declare module 'react-qr-scanner' {
  import { Component } from 'react'

  export interface QrScannerProps {
    delay?: number | false
    style?: React.CSSProperties
    className?: string
    onError?: (error: any) => void
    onScan?: (data: string | null) => void
    facingMode?: 'user' | 'environment'
    legacyMode?: boolean
    maxImageSize?: number
    resolution?: number
    showViewFinder?: boolean
    constraints?: MediaStreamConstraints
  }

  export default class QrScanner extends Component<QrScannerProps> {}
}




