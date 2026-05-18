-- 已注册的旧用户视为已验证,避免一刀切让所有人重新走邮箱激活
ALTER TABLE users
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users SET email_verified = TRUE WHERE email_verified = FALSE;

CREATE INDEX idx_users_email_unverified ON users(id) WHERE email_verified = FALSE;
