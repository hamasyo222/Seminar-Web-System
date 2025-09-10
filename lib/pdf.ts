import * as React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { formatJST } from './date'
import { formatCurrency } from '@/utils'
import type { InvoiceData } from '@/types'

// 日本語フォントの登録（Noto Sans JP）
// 実際の運用では、フォントファイルをpublic/fontsに配置してください
Font.register({
  family: 'NotoSansJP',
  fonts: [
    {
      src: '/fonts/NotoSansJP-Regular.ttf',
      fontWeight: 400,
    },
    {
      src: '/fonts/NotoSansJP-Bold.ttf',
      fontWeight: 700,
    },
  ],
})

// スタイル定義
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'NotoSansJP',
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 100,
    fontWeight: 700,
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 8,
  },
  tableCol: {
    flex: 1,
  },
  tableColName: {
    flex: 2,
  },
  tableColNumber: {
    flex: 1,
    textAlign: 'right',
  },
  totalSection: {
    marginTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#000',
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
  },
  totalLabel: {
    width: 100,
    textAlign: 'right',
    marginRight: 20,
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontWeight: 700,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
  },
  issuerInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9fafb',
  },
  stamp: {
    position: 'absolute',
    right: 30,
    top: 100,
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#ef4444',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 700,
  },
  watermark: {
    position: 'absolute',
    top: 200,
    left: 100,
    fontSize: 48,
    color: '#e5e7eb',
    transform: 'rotate(-45deg)',
    opacity: 0.3,
  },
})

// 領収書PDFコンポーネント
const InvoicePDF: React.FC<{ data: InvoiceData }> = ({ data }) => {
  const {
    order,
    issuerName,
    issuerTaxId,
    issuerAddress,
    issuerTel,
    recipientName,
    recipientInfo,
    items,
    subtotal,
    taxAmount,
    total,
    note,
    isReissue,
    issueDate,
    invoiceNumber,
  } = data

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 再発行の透かし */}
        {isReissue && (
          <Text style={styles.watermark}>再発行</Text>
        )}

        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>領　収　書</Text>
        </View>

        {/* 宛名 */}
        <View style={styles.section}>
          <Text style={{ fontSize: 16, marginBottom: 5 }}>
            {recipientName} 様
          </Text>
          {recipientInfo && (
            <Text style={{ fontSize: 12, color: '#6b7280' }}>
              {recipientInfo}
            </Text>
          )}
        </View>

        {/* 金額 */}
        <View style={[styles.section, { backgroundColor: '#f3f4f6', padding: 15 }]}>
          <Text style={{ fontSize: 24, fontWeight: 700, textAlign: 'center' }}>
            {formatCurrency(total)}
          </Text>
          <Text style={{ fontSize: 10, textAlign: 'center', marginTop: 5 }}>
            （うち消費税等 {formatCurrency(taxAmount)}）
          </Text>
        </View>

        {/* 但し書き */}
        <View style={styles.section}>
          <Text>但し、{note || 'セミナー受講料として'}</Text>
        </View>

        {/* 領収書情報 */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>領収書番号：</Text>
            <Text style={styles.value}>{invoiceNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>発行日：</Text>
            <Text style={styles.value}>{formatJST(issueDate, 'YYYY年MM月DD日')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>注文番号：</Text>
            <Text style={styles.value}>{order.orderNumber}</Text>
          </View>
        </View>

        {/* 明細 */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableColName}>品目</Text>
            <Text style={styles.tableCol}>数量</Text>
            <Text style={styles.tableCol}>単価</Text>
            <Text style={styles.tableCol}>税率</Text>
            <Text style={styles.tableColNumber}>金額</Text>
          </View>
          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableColName}>{item.name}</Text>
              <Text style={styles.tableCol}>{item.quantity}</Text>
              <Text style={styles.tableCol}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.tableCol}>{item.taxRate}%</Text>
              <Text style={styles.tableColNumber}>{formatCurrency(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* 合計 */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>小計：</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>消費税等：</Text>
            <Text style={styles.totalValue}>{formatCurrency(taxAmount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { fontSize: 14 }]}>合計：</Text>
            <Text style={[styles.totalValue, { fontSize: 14 }]}>
              {formatCurrency(total)}
            </Text>
          </View>
        </View>

        {/* 発行者情報 */}
        <View style={styles.issuerInfo}>
          <Text style={{ fontWeight: 700, marginBottom: 5 }}>{issuerName}</Text>
          <Text>登録番号: {issuerTaxId}</Text>
          <Text>{issuerAddress}</Text>
          <Text>TEL: {issuerTel}</Text>
        </View>

        {/* 印鑑（スタンプ） */}
        <View style={styles.stamp}>
          <Text style={styles.stampText}>印</Text>
        </View>

        {/* フッター */}
        <View style={styles.footer}>
          <Text style={{ fontSize: 8, color: '#6b7280', textAlign: 'center' }}>
            この領収書は電子的に発行されたものです。
            {isReissue && '（再発行）'}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

// PDFバッファを生成
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const buffer = await renderToBuffer(<InvoicePDF data={data} />)
  return buffer as Buffer
}

// PDFをBase64エンコード（メール添付用）
export function encodePDFToBase64(pdfBuffer: Buffer): string {
  return pdfBuffer.toString('base64')
}
