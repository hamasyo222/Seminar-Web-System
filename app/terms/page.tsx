export const metadata = {
  title: '利用規約 | セミナー管理システム',
  description: 'セミナー管理システムの利用規約です。',
}

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">利用規約</h1>
      
      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">
          本利用規約（以下「本規約」といいます）は、株式会社サンプル（以下「当社」といいます）が提供するセミナー管理システム（以下「本サービス」といいます）の利用条件を定めるものです。
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">第1条（適用）</h2>
          <p className="text-gray-700">
            本規約は、本サービスの利用に関する当社と利用者（以下「ユーザー」といいます）との間の権利義務関係を定めることを目的とし、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されます。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">第2条（定義）</h2>
          <p className="text-gray-700">本規約において使用する以下の用語は、それぞれ以下の意味を有するものとします。</p>
          <ol className="list-decimal pl-6 mt-4 space-y-2 text-gray-700">
            <li>「本サービス」とは、当社が提供するセミナーの申込・決済・受付管理システムを意味します。</li>
            <li>「ユーザー」とは、本規約に基づき本サービスを利用する個人または法人を意味します。</li>
            <li>「セミナー」とは、本サービスを通じて申込可能な各種講座、研修、イベント等を意味します。</li>
            <li>「個人情報」とは、個人情報保護法に定める個人情報を意味します。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">第3条（利用登録）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>本サービスの利用を希望する者は、本規約に同意の上、当社の定める方法によって利用登録を申請するものとします。</li>
            <li>当社は、前項の申請があった場合、別途当社の定める審査基準に従って審査し、当該申請を承認する場合には、その旨を申請者に通知します。</li>
            <li>利用登録の申請者は、当社に提供する情報について、真実、正確かつ完全な情報を提供しなければなりません。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">第4条（サービスの利用）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>ユーザーは、本規約に従い、当社の定める方法に従って本サービスを利用するものとします。</li>
            <li>ユーザーは、本サービスの利用にあたり、法令、本規約その他当社が定めるルールを遵守するものとします。</li>
            <li>ユーザーは、本サービスの利用に必要な通信機器、ソフトウェア、通信回線その他の設備を自己の費用と責任において準備するものとします。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">第5条（料金および支払方法）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>ユーザーは、セミナーの申込にあたり、当社が定める料金を支払うものとします。</li>
            <li>料金の支払方法は、クレジットカード決済、コンビニ決済、PayPay決済その他当社が指定する方法によるものとします。</li>
            <li>ユーザーが料金の支払を遅延した場合、年14.6%の割合による遅延損害金を支払うものとします。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">第6条（キャンセル・返金）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>ユーザーは、各セミナーに定められたキャンセルポリシーに従い、申込をキャンセルすることができます。</li>
            <li>キャンセルの申出は、当社の定める方法により行うものとします。</li>
            <li>返金が発生する場合、当社は所定の手続きにより返金を行います。返金にかかる振込手数料はユーザーの負担とします。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">第7条（禁止事項）</h2>
          <p className="text-gray-700 mb-4">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>当社または第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為</li>
            <li>本サービスのネットワークまたはシステム等に過度な負荷をかける行為</li>
            <li>本サービスの運営を妨害するおそれのある行為</li>
            <li>不正アクセスをし、またはこれを試みる行為</li>
            <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
            <li>他のユーザーに成りすます行為</li>
            <li>反社会的勢力等への利益供与行為</li>
            <li>その他、当社が不適切と判断する行為</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">第8条（本サービスの提供の停止等）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                <li>その他、当社が本サービスの提供が困難と判断した場合</li>
              </ul>
            </li>
            <li>当社は、本サービスの提供の停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">第9条（個人情報の取扱い）</h2>
          <p className="text-gray-700">
            当社は、本サービスの利用によって取得する個人情報については、当社「プライバシーポリシー」に従い適切に取り扱うものとします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">第10条（免責事項）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます）がないことを保証しません。</li>
            <li>当社は、本サービスによってユーザーに生じたあらゆる損害について、当社の故意または重過失による場合を除き、一切の責任を負いません。</li>
            <li>当社は、ユーザー間またはユーザーと第三者との間において生じた紛争等について一切責任を負いません。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">第11条（サービス内容の変更等）</h2>
          <p className="text-gray-700">
            当社は、ユーザーへの通知なく、本サービスの内容を変更または本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">第12条（利用規約の変更）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>当社は、ユーザーに通知することなく、いつでも本規約を変更することができるものとします。</li>
            <li>変更後の本規約は、当社ウェブサイトに掲示された時点から効力を生じるものとします。</li>
            <li>本規約の変更後、本サービスの利用を継続したユーザーは、変更後の本規約に同意したものとみなされます。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">第13条（通知または連絡）</h2>
          <p className="text-gray-700">
            ユーザーと当社との間の通知または連絡は、当社の定める方法によって行うものとします。当社は、ユーザーから当社が別途定める方法により変更の届出がない限り、現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い、これらは発信時にユーザーへ到達したものとみなします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">第14条（準拠法・裁判管轄）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
            <li>本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。</li>
          </ol>
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
