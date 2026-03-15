"""性格診断の質問データ"""

PERSONALITY_TYPES = {
    "romantic": {
        "name": "ロマンチスト",
        "description": "理想の恋愛を追い求めるタイプ。ドラマチックな展開や特別な瞬間を大切にします。",
        "emoji": "💕",
        "color": "#FF6B9D",
        "compatible_with": ["caring", "passionate"],
    },
    "caring": {
        "name": "献身タイプ",
        "description": "相手を支えることに喜びを感じるタイプ。思いやりと気配りが得意です。",
        "emoji": "🤗",
        "color": "#4ECDC4",
        "compatible_with": ["romantic", "independent"],
    },
    "passionate": {
        "name": "情熱タイプ",
        "description": "熱い恋愛を好むタイプ。感情豊かで、愛情表現がストレートです。",
        "emoji": "🔥",
        "color": "#FF6B6B",
        "compatible_with": ["romantic", "adventurous"],
    },
    "independent": {
        "name": "自立タイプ",
        "description": "適度な距離感を大切にするタイプ。お互いの時間と空間を尊重します。",
        "emoji": "🌟",
        "color": "#A78BFA",
        "compatible_with": ["caring", "rational"],
    },
    "adventurous": {
        "name": "冒険タイプ",
        "description": "新しい体験を恋人と共有したいタイプ。刺激と変化を楽しみます。",
        "emoji": "✈️",
        "color": "#F59E0B",
        "compatible_with": ["passionate", "rational"],
    },
    "rational": {
        "name": "堅実タイプ",
        "description": "安定した関係を築きたいタイプ。計画性があり、将来を見据えます。",
        "emoji": "🏠",
        "color": "#10B981",
        "compatible_with": ["independent", "adventurous"],
    },
}

QUESTIONS = [
    {
        "id": 1,
        "text": "デートの計画はどうしたい？",
        "options": [
            {"text": "サプライズを用意したい", "scores": {"romantic": 2, "passionate": 1}},
            {"text": "相手の行きたい場所に合わせたい", "scores": {"caring": 2, "rational": 1}},
            {"text": "一緒に相談して決めたい", "scores": {"independent": 1, "adventurous": 1}},
        ],
    },
    {
        "id": 2,
        "text": "恋人との連絡頻度は？",
        "options": [
            {"text": "毎日たくさん連絡したい", "scores": {"romantic": 2, "caring": 1}},
            {"text": "1日1回くらいでいい", "scores": {"independent": 2, "rational": 1}},
            {"text": "会った時に話せればいい", "scores": {"adventurous": 2, "passionate": 1}},
        ],
    },
    {
        "id": 3,
        "text": "理想の休日の過ごし方は？",
        "options": [
            {"text": "二人でまったりおうちデート", "scores": {"caring": 2, "rational": 1}},
            {"text": "新しい場所を探検", "scores": {"adventurous": 2, "passionate": 1}},
            {
                "text": "それぞれの時間も大切にしつつ会う",
                "scores": {"independent": 2, "romantic": 1},
            },
        ],
    },
    {
        "id": 4,
        "text": "恋人との喧嘩の後は？",
        "options": [
            {"text": "すぐに仲直りしたい", "scores": {"passionate": 2, "caring": 1}},
            {"text": "お互い冷静になってから話し合う", "scores": {"rational": 2, "independent": 1}},
            {"text": "気持ちを込めて謝りたい", "scores": {"romantic": 2, "caring": 1}},
        ],
    },
    {
        "id": 5,
        "text": "愛情表現はどうする？",
        "options": [
            {"text": "言葉でしっかり伝える", "scores": {"romantic": 2, "passionate": 1}},
            {"text": "行動で示す", "scores": {"caring": 2, "rational": 1}},
            {"text": "特別な時に伝える", "scores": {"independent": 2, "adventurous": 1}},
        ],
    },
    {
        "id": 6,
        "text": "恋人に求めるものは？",
        "options": [
            {"text": "自分を理解してくれること", "scores": {"romantic": 2, "caring": 1}},
            {"text": "一緒に成長できること", "scores": {"adventurous": 2, "rational": 1}},
            {"text": "お互いを尊重し合えること", "scores": {"independent": 2, "passionate": 1}},
        ],
    },
    {
        "id": 7,
        "text": "将来の話はどうする？",
        "options": [
            {"text": "早い段階から話し合いたい", "scores": {"rational": 2, "caring": 1}},
            {"text": "自然な流れに任せたい", "scores": {"adventurous": 2, "passionate": 1}},
            {"text": "ロマンチックな場面で話したい", "scores": {"romantic": 2, "independent": 1}},
        ],
    },
    {
        "id": 8,
        "text": "恋人の友達との付き合いは？",
        "options": [
            {"text": "積極的に仲良くなりたい", "scores": {"caring": 2, "adventurous": 1}},
            {"text": "適度な距離感でいい", "scores": {"independent": 2, "rational": 1}},
            {"text": "恋人との時間を優先したい", "scores": {"romantic": 2, "passionate": 1}},
        ],
    },
    {
        "id": 9,
        "text": "サプライズは好き？",
        "options": [
            {"text": "大好き！自分もしたい", "scores": {"romantic": 2, "passionate": 1}},
            {"text": "されるのは好き", "scores": {"caring": 1, "adventurous": 1}},
            {"text": "予定通りが安心する", "scores": {"rational": 2, "independent": 1}},
        ],
    },
    {
        "id": 10,
        "text": "恋愛で一番大切なことは？",
        "options": [
            {"text": "信頼と安心感", "scores": {"rational": 2, "caring": 1}},
            {"text": "ドキドキと情熱", "scores": {"passionate": 2, "romantic": 1}},
            {"text": "自由と尊重", "scores": {"independent": 2, "adventurous": 1}},
        ],
    },
]
