-- Auto-confirm all existing unconfirmed users so they can log in immediately
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmation_token = '',
    confirmation_sent_at = NULL
WHERE email_confirmed_at IS NULL;
