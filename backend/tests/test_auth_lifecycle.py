import datetime
import os
import tempfile
import unittest
from types import SimpleNamespace

os.environ.setdefault("SECRET_KEY", "test-secret-key-with-at-least-thirty-two-characters")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from app.api.endpoints import auth
from app.db.database import Base, SessionLocal, engine
from app.db.models import PasswordResetToken, User


class AuthLifecycleTests(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(engine)
        self.db = SessionLocal()
        self.request = SimpleNamespace(client=SimpleNamespace(host=f"test-{id(self)}"))

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(engine)

    def test_registration_login_duplicate_and_logout_invalidates_token(self):
        user = auth.register(auth.UserCreate(email="USER@Example.com", password="ValidPassword123", full_name="User"), self.db)
        self.assertEqual(user.email, "user@example.com")
        with self.assertRaises(Exception):
            auth.register(auth.UserCreate(email="user@example.com", password="ValidPassword123", full_name="Other"), self.db)
        response = auth.login(auth.UserLogin(email="user@example.com", password="ValidPassword123"), self.request, self.db)
        current = auth.get_current_user(response["access_token"], self.db)
        auth.logout(current, self.db)
        with self.assertRaises(Exception):
            auth.get_current_user(response["access_token"], self.db)

    def test_invalid_password_and_single_use_expiring_reset_token(self):
        user = auth.register(auth.UserCreate(email="reset@example.com", password="ValidPassword123", full_name="Reset"), self.db)
        with self.assertRaises(Exception):
            auth.login(auth.UserLogin(email=user.email, password="wrong"), self.request, self.db)
        token = "A" * 32
        self.db.add(PasswordResetToken(user_id=user.id, token_hash=auth.security.token_digest(token), expires_at=datetime.datetime.utcnow() + datetime.timedelta(minutes=1)))
        self.db.commit()
        auth.confirm_password_reset(auth.ResetConfirm(token=token, password="NewValidPassword123"), self.db)
        with self.assertRaises(Exception):
            auth.confirm_password_reset(auth.ResetConfirm(token=token, password="AnotherValidPass123"), self.db)
        expired = "B" * 32
        self.db.add(PasswordResetToken(user_id=user.id, token_hash=auth.security.token_digest(expired), expires_at=datetime.datetime.utcnow() - datetime.timedelta(seconds=1)))
        self.db.commit()
        with self.assertRaises(Exception):
            auth.confirm_password_reset(auth.ResetConfirm(token=expired, password="AnotherValidPass123"), self.db)

    def test_unauthenticated_token_is_rejected(self):
        with self.assertRaises(Exception):
            auth.get_current_user("not-a-token", self.db)
