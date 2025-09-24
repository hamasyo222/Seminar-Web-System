export const metadata = {
  title: 'プライバシーポリシー | セミナー管理システム',
  description: 'セミナー管理システムのプライバシーポリシーです。',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>
      
      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">
          株式会社サンプル（以下「当社」といいます）は、当社が提供するセミナー管理システム（以下「本サービス」といいます）における個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. 収集する個人情報</h2>
          <p className="text-gray-700 mb-4">当社は、本サービスの提供にあたり、以下の個人情報を収集します。</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>氏名、フリガナ</li>
            <li>メールアドレス</li>
            <li>電話番号</li>
            <li>会社名、部署名、役職</li>
            <li>住所（請求書送付先として提供された場合）</li>
            <li>決済に関する情報（クレジットカード情報は決済代行会社が管理）</li>
            <li>セミナー参加履歴</li>
            <li>本サービスの利用履歴、アクセスログ</li>
            <li>その他、本サービスの利用に伴い提供される情報</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. 個人情報の利用目的</h2>
          <p className="text-gray-700 mb-4">当社は、収集した個人情報を以下の目的で利用します。</p>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>セミナーの申込受付、参加管理</li>
            <li>セミナーに関する連絡、案内、リマインダーの送信</li>
            <li>決済処理、領収書の発行</li>
            <li>本人確認、不正利用の防止</li>
            <li>セミナーの品質向上、新サービスの開発</li>
            <li>統計データの作成（個人を特定できない形式）</li>
            <li>お問い合わせへの対応</li>
            <li>当社からのお知らせ、メールマガジンの配信（希望者のみ）</li>
            <li>法令に基づく対応</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. 個人情報の第三者提供</h2>
          <p className="text-gray-700 mb-4">
            当社は、以下の場合を除き、個人情報を第三者に提供することはありません。
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>本人の同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難である場合</li>
            <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難である場合</li>
            <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがある場合</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. 個人情報の委託</h2>
          <p className="text-gray-700">
            当社は、利用目的の達成に必要な範囲内において、個人情報の取扱いの全部または一部を委託する場合があります。
            この場合、当社は、個人情報の取扱いについて、委託先と秘密保持契約を締結し、委託先に対する必要かつ適切な監督を行います。
          </p>
          <p className="text-gray-700 mt-4">主な委託先：</p>
          <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
            <li>決済代行サービス（KOMOJU）</li>
            <li>メール配信サービス（SendGrid）</li>
            <li>クラウドサービス提供事業者</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. 個人情報の安全管理</h2>
          <p className="text-gray-700">
            当社は、個人情報の漏洩、滅失または毀損の防止その他の個人情報の安全管理のために、以下のような措置を講じています。
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
            <li>SSL/TLSによる通信の暗号化</li>
            <li>パスワードの暗号化保存</li>
            <li>アクセス権限の管理</li>
            <li>定期的なセキュリティ更新</li>
            <li>従業員に対する個人情報保護教育の実施</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookieの使用</h2>
          <p className="text-gray-700">
            本サービスでは、サービスの利便性向上のため、Cookieを使用しています。
            Cookieは、ウェブサイトがお客様のブラウザに送信する小さなテキストファイルで、お客様のコンピュータに保存されます。
          </p>
          <p className="text-gray-700 mt-4">Cookieの使用目的：</p>
          <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
            <li>ログイン状態の保持</li>
            <li>サービスの利用状況の分析</li>
            <li>サービスの改善</li>
          </ul>
          <p className="text-gray-700 mt-4">
            お客様は、ブラウザの設定によりCookieの受け取りを拒否することができます。
            ただし、Cookieを無効にした場合、本サービスの一部機能が利用できなくなる可能性があります。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. 個人情報の開示・訂正・削除</h2>
          <p className="text-gray-700 mb-4">
            お客様は、当社に対し、自己の個人情報の開示、訂正、削除等を請求することができます。
            請求される場合は、以下の窓口までご連絡ください。
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700">
              個人情報お問い合わせ窓口<br />
              メール：privacy@example.com<br />
              電話：03-1234-5678（平日10:00〜17:00）
            </p>
          </div>
          <p className="text-gray-700 mt-4">
            なお、個人情報の開示には、本人確認のため、所定の手続きが必要となります。
            また、法令で定められた場合を除き、手数料（1,000円）をいただきます。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. 個人情報の保存期間</h2>
          <p className="text-gray-700">
            当社は、個人情報を利用目的の達成に必要な期間に限り保存します。
            ただし、法令により保存が義務付けられている場合は、当該法令に定める期間保存します。
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
            <li>セミナー参加情報：最後の参加から5年間</li>
            <li>決済関連情報：法令に基づき7年間</li>
            <li>お問い合わせ情報：対応完了から3年間</li>
            <li>メールマガジン配信情報：配信停止から1年間</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. 未成年者の個人情報</h2>
          <p className="text-gray-700">
            未成年者が本サービスを利用する場合は、保護者の同意を得た上でご利用ください。
            保護者の同意なく未成年者の個人情報を収集した場合、保護者からの請求により、当該個人情報を削除します。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. プライバシーポリシーの変更</h2>
          <p className="text-gray-700">
            当社は、法令の改正、社会情勢の変化、技術の進歩等に応じて、本ポリシーを変更することがあります。
            変更後のプライバシーポリシーは、本ページに掲載した時点から効力を生じるものとします。
            重要な変更がある場合は、本サービス上でお知らせします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. お問い合わせ</h2>
          <p className="text-gray-700">
            本ポリシーに関するお問い合わせは、以下の窓口までお願いいたします。
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <p className="text-gray-700">
              株式会社サンプル<br />
              個人情報保護管理者：情報セキュリティ部長<br />
              住所：〒100-0001 東京都千代田区〇〇1-2-3<br />
              メール：privacy@example.com<br />
              電話：03-1234-5678（平日10:00〜17:00）
            </p>
          </div>
        </section>

        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            制定日：2025年1月1日<br />
            最終改定日：2025年1月1日
          </p>
        </div>
      </div>
    </div>
  )
}

