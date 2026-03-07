"""性格診断に関するデータ定義"""

from typing import Dict, List, Tuple
from packages.models.personality import PersonalityType


# 性格診断の質問データ
PERSONALITY_QUESTIONS = [
    {
        "id": 1,
        "question": "理想のデートプランは？",
        "options": [
            {"text": "夜景の見えるレストランでディナー", "scores": {"romantic": 5, "realist": 1, "adventurer": 1, "supporter": 2, "leader": 2, "analyst": 1}},
            {"text": "カフェで2人でゆっくり会話", "scores": {"romantic": 2, "realist": 3, "adventurer": 1, "supporter": 4, "leader": 1, "analyst": 3}},
            {"text": "アクティビティやスポーツを一緒に", "scores": {"romantic": 1, "realist": 2, "adventurer": 5, "supporter": 2, "leader": 4, "analyst": 1}},
            {"text": "美術館や博物館で文化的な体験", "scores": {"romantic": 2, "realist": 3, "adventurer": 2, "supporter": 2, "leader": 2, "analyst": 5}}
        ]
    },
    {
        "id": 2,
        "question": "恋人との喧嘩が起きたとき、あなたの行動は？",
        "options": [
            {"text": "感情的になって思いを伝える", "scores": {"romantic": 5, "realist": 1, "adventurer": 2, "supporter": 1, "leader": 3, "analyst": 1}},
            {"text": "冷静になって話し合いの時間を作る", "scores": {"romantic": 1, "realist": 4, "adventurer": 1, "supporter": 3, "leader": 3, "analyst": 4}},
            {"text": "まず相手の気持ちを理解しようとする", "scores": {"romantic": 2, "realist": 2, "adventurer": 1, "supporter": 5, "leader": 1, "analyst": 3}},
            {"text": "問題を整理して解決策を考える", "scores": {"romantic": 1, "realist": 3, "adventurer": 2, "supporter": 2, "leader": 4, "analyst": 5}}
        ]
    },
    {
        "id": 3,
        "question": "パートナーに求める一番大切なことは？",
        "options": [
            {"text": "愛情深く情熱的であること", "scores": {"romantic": 5, "realist": 1, "adventurer": 2, "supporter": 2, "leader": 1, "analyst": 1}},
            {"text": "現実的で安定していること", "scores": {"romantic": 1, "realist": 5, "adventurer": 1, "supporter": 3, "leader": 3, "analyst": 2}},
            {"text": "一緒に新しいことにチャレンジできること", "scores": {"romantic": 2, "realist": 1, "adventurer": 5, "supporter": 1, "leader": 3, "analyst": 2}},
            {"text": "互いを支え合えること", "scores": {"romantic": 3, "realist": 3, "adventurer": 1, "supporter": 5, "leader": 1, "analyst": 2}}
        ]
    },
    {
        "id": 4,
        "question": "将来の恋愛について、どう考えますか？",
        "options": [
            {"text": "運命的な出会いを信じている", "scores": {"romantic": 5, "realist": 1, "adventurer": 2, "supporter": 2, "leader": 1, "analyst": 1}},
            {"text": "現実的な条件も大切だと思う", "scores": {"romantic": 1, "realist": 5, "adventurer": 1, "supporter": 2, "leader": 3, "analyst": 3}},
            {"text": "新しい経験を一緒にできる人がいい", "scores": {"romantic": 2, "realist": 2, "adventurer": 5, "supporter": 1, "leader": 2, "analyst": 2}},
            {"text": "しっかり計画を立てて進めたい", "scores": {"romantic": 1, "realist": 3, "adventurer": 1, "supporter": 2, "leader": 4, "analyst": 5}}
        ]
    },
    {
        "id": 5,
        "question": "友人から恋愛相談を受けたとき、あなたは？",
        "options": [
            {"text": "心の声に従うことをアドバイスする", "scores": {"romantic": 5, "realist": 1, "adventurer": 2, "supporter": 3, "leader": 1, "analyst": 1}},
            {"text": "現実的な視点でアドバイスする", "scores": {"romantic": 1, "realist": 5, "adventurer": 1, "supporter": 2, "leader": 3, "analyst": 3}},
            {"text": "まずは話を聞いて共感する", "scores": {"romantic": 2, "realist": 2, "adventurer": 1, "supporter": 5, "leader": 1, "analyst": 2}},
            {"text": "状況を分析して最善策を提案する", "scores": {"romantic": 1, "realist": 2, "adventurer": 2, "supporter": 2, "leader": 4, "analyst": 5}}
        ]
    }
]


# 性格タイプの詳細情報
PERSONALITY_DESCRIPTIONS: Dict[PersonalityType, Dict[str, str]] = {
    PersonalityType.ROMANTIC: {
        "title": "ロマンティスト",
        "description": "情熱的で感情豊かな恋愛を大切にするあなた。愛情表現が豊かで、パートナーとの特別な瞬間を大切にします。",
        "love_style": "情熱的で感情豊かな恋愛スタイル。ロマンチックなデートや特別な記念日を大切にします。",
        "ideal_partner": "感情豊かで愛情表現が上手な人、一緒に夢を語り合える人",
        "advice": "時には現実的な視点も取り入れて、バランスの取れた関係を築きましょう。"
    },
    PersonalityType.REALIST: {
        "title": "リアリスト",
        "description": "現実的で安定した恋愛を求めるあなた。感情だけでなく、将来性や相性を重視して関係を築きます。",
        "love_style": "安定重視の現実的な恋愛スタイル。将来を見据えた関係構築を大切にします。",
        "ideal_partner": "価値観が合い、将来設計をしっかり考えられる人",
        "advice": "時には感情や直感も大切にして、心の豊かさも追求してみましょう。"
    },
    PersonalityType.ADVENTURER: {
        "title": "冒険家",
        "description": "新しい体験や刺激を求めるあなた。パートナーと一緒に様々な経験を積み、成長していく関係を好みます。",
        "love_style": "活動的で新鮮さを求める恋愛スタイル。一緒に新しいことにチャレンジすることを楽しみます。",
        "ideal_partner": "好奇心旺盛で、一緒に冒険できる活動的な人",
        "advice": "刺激だけでなく、安定した関係の基盤も大切にしましょう。"
    },
    PersonalityType.SUPPORTER: {
        "title": "サポーター",
        "description": "相手を支えることに喜びを感じるあなた。パートナーの成長を助け、お互いを支え合う関係を重視します。",
        "love_style": "支え合いを大切にする協力的な恋愛スタイル。相手の気持ちに寄り添うことを大切にします。",
        "ideal_partner": "思いやりがあり、感謝の気持ちを表現できる人",
        "advice": "自分のことも大切にして、お互いが成長できるバランスの良い関係を築きましょう。"
    },
    PersonalityType.LEADER: {
        "title": "リーダー",
        "description": "関係をリードし、明確な目標を持って恋愛を進めるあなた。決断力があり、将来に向けて積極的に行動します。",
        "love_style": "主導的で計画性のある恋愛スタイル。関係の方向性を明確にして進めます。",
        "ideal_partner": "あなたの決断力を尊重し、一緒に目標に向かえる人",
        "advice": "相手の意見も聞いて、お互いの意思を尊重した関係を築きましょう。"
    },
    PersonalityType.ANALYST: {
        "title": "分析家",
        "description": "論理的に恋愛を考えるあなた。相性や将来性を慎重に分析し、理論的なアプローチで関係を築きます。",
        "love_style": "論理的で慎重な恋愛スタイル。相手との相性を深く分析して関係を進めます。",
        "ideal_partner": "知的で話が合う人、お互いの考えを尊重できる人",
        "advice": "分析だけでなく、感情や直感も大切にして、心の繋がりを深めましょう。"
    }
}


def calculate_personality_type(scores: Dict[str, int]) -> Tuple[PersonalityType, Dict[str, int]]:
    """
    回答スコアから性格タイプを算出

    Args:
        scores: 各性格要素のスコア辞書

    Returns:
        (判定された性格タイプ, 正規化されたスコア)
    """
    # スコアを0-100の範囲に正規化
    max_possible_score = len(PERSONALITY_QUESTIONS) * 5  # 最大スコア
    normalized_scores = {}

    for personality_key, score in scores.items():
        normalized_scores[personality_key + "_score"] = min(100, int((score / max_possible_score) * 100))

    # 最高スコアの性格タイプを決定
    max_score = 0
    dominant_type = PersonalityType.ROMANTIC

    for personality_type in PersonalityType:
        score_key = personality_type.value + "_score"
        if score_key in normalized_scores and normalized_scores[score_key] > max_score:
            max_score = normalized_scores[score_key]
            dominant_type = personality_type

    return dominant_type, normalized_scores