-- seed_quizzes.sql
-- 各カテゴリに5問ずつ承認済みクイズを投入

-- 管理者ユーザーIDを取得
DO $$
DECLARE
  admin_id UUID;
  cat_saibou UUID;
  cat_zoning UUID;
  cat_shiyaku UUID;
  cat_rule UUID;
  cat_houkoku UUID;
BEGIN
  SELECT id INTO admin_id FROM users WHERE role='admin' LIMIT 1;
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'No admin user found. Run backend seed first.';
  END IF;

  SELECT id INTO cat_saibou FROM categories WHERE name='細胞培養基本';
  SELECT id INTO cat_zoning FROM categories WHERE name='ゾーニング';
  SELECT id INTO cat_shiyaku FROM categories WHERE name='試薬安全管理';
  SELECT id INTO cat_rule FROM categories WHERE name='ラボルール';
  SELECT id INTO cat_houkoku FROM categories WHERE name='報告ルート';

  IF cat_saibou IS NULL OR cat_zoning IS NULL OR cat_shiyaku IS NULL OR cat_rule IS NULL OR cat_houkoku IS NULL THEN
    RAISE EXCEPTION 'One or more categories not found. Run 001_initial_schema.sql first.';
  END IF;

  -- ===== 細胞培養基本 =====
  INSERT INTO quizzes (category_id, question, choices, correct_choice_id, explanation, status, created_by, reviewed_by) VALUES
  (cat_saibou,
   'クリーンベンチ内で作業を開始する前に、最初に行うべきことは何ですか？',
   '[{"id":"a","text":"培地を温める"},{"id":"b","text":"UV照射と70%エタノールによる消毒"},{"id":"c","text":"細胞を顕微鏡で観察する"},{"id":"d","text":"実験ノートを準備する"}]',
   'b',
   'クリーンベンチ使用前には、まずUV照射（15〜30分）と70%エタノールによる表面消毒を行い、無菌環境を確保します。これを怠るとコンタミネーションの原因になります。',
   'approved', admin_id, admin_id),

  (cat_saibou,
   '細胞の継代培養において、トリプシン処理後に培地を加える主な目的は何ですか？',
   '[{"id":"a","text":"細胞を栄養で満たすため"},{"id":"b","text":"トリプシンの活性を中和するため"},{"id":"c","text":"細胞を洗浄するため"},{"id":"d","text":"pHを調整するため"}]',
   'b',
   'トリプシンは細胞接着タンパク質を分解する酵素です。長時間作用させると細胞にダメージを与えるため、血清含有培地を加えて速やかに中和する必要があります。',
   'approved', admin_id, admin_id),

  (cat_saibou,
   'CO2インキュベーターの標準的なCO2濃度は何%ですか？',
   '[{"id":"a","text":"2%"},{"id":"b","text":"5%"},{"id":"c","text":"10%"},{"id":"d","text":"21%"}]',
   'b',
   'ほとんどの哺乳類細胞培養では、CO2濃度5%、温度37℃が標準条件です。CO2は培地のpH緩衝に重要な役割を果たしています。',
   'approved', admin_id, admin_id),

  (cat_saibou,
   '培地の色がオレンジ色から黄色に変化した場合、何を示していますか？',
   '[{"id":"a","text":"培地が新鮮な状態"},{"id":"b","text":"pHがアルカリ性に傾いている"},{"id":"c","text":"pHが酸性に傾いている（代謝産物の蓄積や汚染の可能性）"},{"id":"d","text":"温度が低すぎる"}]',
   'c',
   'フェノールレッドを含む培地では、pH低下（酸性化）で黄色、pH上昇（アルカリ化）で紫色に変化します。黄変は細胞の過密や微生物汚染を示唆するため、直ちに確認が必要です。',
   'approved', admin_id, admin_id),

  (cat_saibou,
   'マイコプラズマ汚染の特徴として正しいものはどれですか？',
   '[{"id":"a","text":"培地が濁る"},{"id":"b","text":"肉眼では確認できず、増殖速度の低下などで気づく"},{"id":"c","text":"細胞がすべて死滅する"},{"id":"d","text":"培地の色が紫に変わる"}]',
   'b',
   'マイコプラズマは非常に小さく（0.1〜0.3μm）、フィルター滅菌をすり抜けることがあります。培地の濁りが出ないため発見が遅れやすく、定期的なPCR検査が推奨されます。',
   'approved', admin_id, admin_id);

  -- ===== ゾーニング =====
  INSERT INTO quizzes (category_id, question, choices, correct_choice_id, explanation, status, created_by, reviewed_by) VALUES
  (cat_zoning,
   '清浄度クラスが最も高い（清浄な）エリアはどれですか？',
   '[{"id":"a","text":"一般区域"},{"id":"b","text":"準清浄区域"},{"id":"c","text":"清浄区域（クリーンルーム）"},{"id":"d","text":"汚染区域"}]',
   'c',
   'ゾーニングでは、汚染区域→一般区域→準清浄区域→清浄区域の順に清浄度が上がります。清浄区域（クリーンルーム）はパーティクル数が厳しく管理されています。',
   'approved', admin_id, admin_id),

  (cat_zoning,
   'エアシャワーの主な目的は何ですか？',
   '[{"id":"a","text":"体温を測定する"},{"id":"b","text":"身体に付着した塵埃を吹き飛ばす"},{"id":"c","text":"手指を消毒する"},{"id":"d","text":"衣服を乾燥させる"}]',
   'b',
   'エアシャワーは、清浄区域への入室時に高速の清浄空気を吹き付けて、作業衣や身体に付着した塵埃・微粒子を除去する設備です。クロスコンタミネーション防止に重要です。',
   'approved', admin_id, admin_id),

  (cat_zoning,
   'ゾーン間を移動する際に最も注意すべきことは？',
   '[{"id":"a","text":"走って移動する"},{"id":"b","text":"清浄度の高いゾーンから低いゾーンへの一方向動線を守る"},{"id":"c","text":"同じ手袋のまま移動する"},{"id":"d","text":"ドアを開けたままにする"}]',
   'b',
   '汚染拡大を防ぐため、人・物の動線は清浄度の高い区域から低い区域への一方向が原則です。逆方向に移動する場合は、ガウニングや消毒などの適切な手順が必要です。',
   'approved', admin_id, admin_id),

  (cat_zoning,
   'パスボックスの正しい使い方はどれですか？',
   '[{"id":"a","text":"両側のドアを同時に開ける"},{"id":"b","text":"片側のドアを閉めてからもう片側を開ける（インターロック）"},{"id":"c","text":"物品を入れたまま長時間放置する"},{"id":"d","text":"大型機器の搬入に使う"}]',
   'b',
   'パスボックスはゾーン間の物品受け渡し用設備です。両側のドアが同時に開くと清浄度が保てないため、インターロック機構で片側ずつしか開かない仕組みになっています。',
   'approved', admin_id, admin_id),

  (cat_zoning,
   '陽圧と陰圧の説明として正しいものはどれですか？',
   '[{"id":"a","text":"陽圧は外部から空気が流入しやすい状態"},{"id":"b","text":"陰圧は室内の汚染物質が外部に漏れにくい状態"},{"id":"c","text":"陽圧室は室内の気圧が外部より高く、外部からの汚染侵入を防ぐ"},{"id":"d","text":"陽圧と陰圧に差はない"}]',
   'c',
   '陽圧室は室内の気圧を外部より高く保ち、ドアを開けても外部の汚染空気が侵入しにくい環境です。一方、陰圧室は室内の気圧を低くし、室内の汚染物質が外部に漏れないようにします。',
   'approved', admin_id, admin_id);

  -- ===== 試薬安全管理 =====
  INSERT INTO quizzes (category_id, question, choices, correct_choice_id, explanation, status, created_by, reviewed_by) VALUES
  (cat_shiyaku,
   'SDSシート（安全データシート）で最初に確認すべき情報は何ですか？',
   '[{"id":"a","text":"製造元の住所"},{"id":"b","text":"危険有害性の要約（GHSラベル情報）"},{"id":"c","text":"物理的・化学的性質"},{"id":"d","text":"輸送上の注意"}]',
   'b',
   'SDSシートのセクション2「危険有害性の要約」には、GHS分類、絵表示、注意喚起語、危険有害性情報が記載されています。新しい試薬を扱う前に必ず確認してください。',
   'approved', admin_id, admin_id),

  (cat_shiyaku,
   'ドラフトチャンバー（ヒュームフード）内で作業する際の正しい使い方は？',
   '[{"id":"a","text":"サッシュ（前面ガラス）を全開にして作業する"},{"id":"b","text":"サッシュを適切な高さ（表示線）まで下ろして作業する"},{"id":"c","text":"換気を止めて作業する"},{"id":"d","text":"ドラフト内に頭を入れて確認する"}]',
   'b',
   'サッシュを適切な高さまで下ろすことで、排気効率が最大化され、有害な蒸気やガスの吸入リスクを低減できます。全開では気流が乱れ、防護効果が低下します。',
   'approved', admin_id, admin_id),

  (cat_shiyaku,
   '酸と塩基を保管する際の正しい方法はどれですか？',
   '[{"id":"a","text":"同じ棚に並べて保管する"},{"id":"b","text":"分別して別々の場所に保管する"},{"id":"c","text":"一つの容器にまとめる"},{"id":"d","text":"床に直接置く"}]',
   'b',
   '酸と塩基は反応して発熱・有毒ガス発生の危険があるため、必ず分別保管します。さらに、有機溶媒と酸化剤なども分別が必要です。SDSの混触危険情報を確認してください。',
   'approved', admin_id, admin_id),

  (cat_shiyaku,
   '試薬がこぼれた場合、最初にすべきことは何ですか？',
   '[{"id":"a","text":"すぐに水で洗い流す"},{"id":"b","text":"まず周囲の安全確認とSDSで適切な処理方法を確認する"},{"id":"c","text":"そのまま放置して蒸発を待つ"},{"id":"d","text":"紙で拭き取って捨てる"}]',
   'b',
   '試薬の種類によって適切な処理方法が異なります。水と反応する物質もあるため、まずSDSを確認し、適切なスピルキットを使用します。周囲の人への注意喚起も重要です。',
   'approved', admin_id, admin_id),

  (cat_shiyaku,
   'GHSの「どくろ」マーク（☠）が示す危険性はどれですか？',
   '[{"id":"a","text":"環境への有害性"},{"id":"b","text":"急性毒性（経口・経皮・吸入）"},{"id":"c","text":"可燃性"},{"id":"d","text":"酸化性"}]',
   'b',
   'GHSの「どくろ」マークは、急性毒性（区分1〜3）を示し、少量の曝露でも生命に危険を及ぼす可能性がある物質です。取り扱いには適切な保護具の着用が必須です。',
   'approved', admin_id, admin_id);

  -- ===== ラボルール =====
  INSERT INTO quizzes (category_id, question, choices, correct_choice_id, explanation, status, created_by, reviewed_by) VALUES
  (cat_rule,
   '実験室で飲食が禁止されている主な理由は何ですか？',
   '[{"id":"a","text":"実験の邪魔になるから"},{"id":"b","text":"化学物質や生物材料の経口摂取リスクがあるから"},{"id":"c","text":"食べ物の匂いが気になるから"},{"id":"d","text":"掃除が面倒だから"}]',
   'b',
   '実験室では有害な化学物質や生物材料が存在します。手や実験台の汚染物質が食品を介して体内に入るリスクがあるため、飲食は厳禁です。これは国際的な安全基準です。',
   'approved', admin_id, admin_id),

  (cat_rule,
   '実験室で適切な服装として正しいものはどれですか？',
   '[{"id":"a","text":"サンダルと短パン"},{"id":"b","text":"白衣・安全メガネ・つま先の覆われた靴"},{"id":"c","text":"スーツとネクタイ"},{"id":"d","text":"普段着のまま"}]',
   'b',
   '白衣は化学物質の飛散から衣服と皮膚を保護し、安全メガネは目への飛散を防ぎます。つま先の覆われた靴は、落下物やこぼれた薬品から足を守ります。',
   'approved', admin_id, admin_id),

  (cat_rule,
   '実験終了後に行うべき手順として正しいものは？',
   '[{"id":"a","text":"すぐに退室する"},{"id":"b","text":"使用した器具の洗浄・片付け、実験台の消毒、手洗いを行う"},{"id":"c","text":"翌日の準備だけして帰る"},{"id":"d","text":"ゴミをまとめて一般ゴミに捨てる"}]',
   'b',
   '実験後は、使用した器具の洗浄・片付け、実験台の消毒（70%エタノール等）、廃棄物の適切な分別、手洗いを行います。次の利用者の安全確保と汚染防止のために重要です。',
   'approved', admin_id, admin_id),

  (cat_rule,
   'オートクレーブ処理が必要な廃棄物はどれですか？',
   '[{"id":"a","text":"一般的な紙ゴミ"},{"id":"b","text":"生物材料（培養細胞、培地など）が付着した廃棄物"},{"id":"c","text":"プラスチック製の空容器"},{"id":"d","text":"使用済みの段ボール"}]',
   'b',
   '生物材料が付着した廃棄物は、滅菌処理（121℃、15〜20分のオートクレーブ）を行ってから廃棄する必要があります。これにより感染性を不活化し、安全に処分できます。',
   'approved', admin_id, admin_id),

  (cat_rule,
   '実験室での事故防止のために最も重要な基本行動はどれですか？',
   '[{"id":"a","text":"一人で黙々と作業する"},{"id":"b","text":"実験手順書を確認し、リスクアセスメントを行ってから作業する"},{"id":"c","text":"経験豊富なので手順書は不要"},{"id":"d","text":"効率を重視してショートカットする"}]',
   'b',
   '実験前に手順書（SOP）を確認し、使用する試薬のSDS確認やリスクアセスメントを行うことが事故防止の基本です。「慣れ」による省略が事故の主要因の一つです。',
   'approved', admin_id, admin_id);

  -- ===== 報告ルート =====
  INSERT INTO quizzes (category_id, question, choices, correct_choice_id, explanation, status, created_by, reviewed_by) VALUES
  (cat_houkoku,
   '実験中に試薬が皮膚に付着した場合、最初に取るべき行動は？',
   '[{"id":"a","text":"上司に報告してから対処する"},{"id":"b","text":"直ちに大量の流水で15分以上洗浄する"},{"id":"c","text":"実験を終わらせてから処理する"},{"id":"d","text":"絆創膏を貼る"}]',
   'b',
   '化学物質が皮膚に付着した場合、最優先は大量の流水による洗浄（15分以上）です。洗浄しながら、または洗浄後に上司・安全管理者に報告し、必要に応じて医療機関を受診します。',
   'approved', admin_id, admin_id),

  (cat_houkoku,
   'ニアミス（ヒヤリハット）を報告する理由として最も適切なものは？',
   '[{"id":"a","text":"個人の責任を追及するため"},{"id":"b","text":"同様の事故を未然に防止するため"},{"id":"c","text":"報告書の件数を増やすため"},{"id":"d","text":"義務だから仕方なく"}]',
   'b',
   'ハインリッヒの法則によると、1件の重大事故の背景には29件の軽微な事故と300件のヒヤリハットがあります。ニアミスの共有は重大事故を未然に防ぐ最も効果的な手段です。',
   'approved', admin_id, admin_id),

  (cat_houkoku,
   '緊急時の連絡順序として正しいものはどれですか？',
   '[{"id":"a","text":"SNSに投稿 → 同僚に相談 → 上司に報告"},{"id":"b","text":"現場の安全確保 → 直属の上司/安全管理者 → 必要に応じて119番"},{"id":"c","text":"翌日の朝礼で報告する"},{"id":"d","text":"メールで全社に一斉送信する"}]',
   'b',
   '緊急時はまず自身と周囲の安全を確保し、次に直属の上司または安全管理者に速やかに口頭で報告します。火災・重篤な傷害・危険物漏洩の場合は119番への通報も並行して行います。',
   'approved', admin_id, admin_id),

  (cat_houkoku,
   'インシデントレポートに必ず含めるべき情報はどれですか？',
   '[{"id":"a","text":"関係者の個人的な感想"},{"id":"b","text":"発生日時・場所・状況・原因・対処内容・再発防止策"},{"id":"c","text":"関係者の給与情報"},{"id":"d","text":"部署の年間予算"}]',
   'b',
   'インシデントレポートには5W1H（いつ・どこで・誰が・何を・なぜ・どのように）を明確に記載し、客観的な事実と原因分析、具体的な再発防止策を含めることが重要です。',
   'approved', admin_id, admin_id),

  (cat_houkoku,
   '安全管理者が不在の場合、誰に報告すべきですか？',
   '[{"id":"a","text":"誰にも報告しなくてよい"},{"id":"b","text":"代理の管理者または上位の管理職に報告する"},{"id":"c","text":"安全管理者が戻るまで待つ"},{"id":"d","text":"自分で解決して報告は省略する"}]',
   'b',
   '安全管理者が不在の場合は、あらかじめ定められた代理者または上位の管理職に報告します。報告の遅延は事態の悪化につながる可能性があるため、代替の報告ルートを事前に確認しておくことが重要です。',
   'approved', admin_id, admin_id);

END $$;
