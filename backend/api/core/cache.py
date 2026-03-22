"""キャッシュ設定"""

from aiocache import Cache
from aiocache.serializers import JsonSerializer


def get_cache() -> Cache:
    """インメモリキャッシュのインスタンスを取得"""
    return Cache(
        cache_class=Cache.MEMORY,
        serializer=JsonSerializer(),
        ttl=300,  # デフォルト5分
        namespace="lovesult",
    )


# グローバルキャッシュインスタンス
cache = get_cache()
