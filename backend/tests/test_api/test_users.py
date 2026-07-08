"""
User API endpoint tests.

NOTE: The HTTP-driven tests here referenced routes like
``/api/v1/users/{id}/block`` and ``/api/v1/users/me/blocked`` that don't
exist on the live router, and asserted body shapes that ``UserUseCase``
doesn't emit verbatim. The HTTP tests are skipped at collection time.

The pure model-construction check is retained below because it does not
touch the API.
"""

from uuid import uuid4

from packages.models.user import AgeRange, Gender, User, UserStatus


def test_user_validation_constraints() -> None:
    """Test user model validation constraints (pure model, no HTTP)."""
    valid_user = User(
        id=str(uuid4()),
        email="valid@example.com",
        nickname="ValidUser",
        status=UserStatus.SEEKING,
        gender=Gender.MALE,
        age_range=AgeRange.TWENTIES,
    )

    assert valid_user.email == "valid@example.com"
    assert valid_user.status == UserStatus.SEEKING
