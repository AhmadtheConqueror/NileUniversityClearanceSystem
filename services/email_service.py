import os
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr


def _get_bool_env(name, default):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _get_int_env(name, default):
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


def _get_text_env(name):
    value = os.getenv(name)
    if value is None:
        return None
    return value.strip()


def send_otp_email(to_email, otp, expires_in_minutes):
    smtp_host = _get_text_env("SMTP_HOST")
    smtp_port = _get_int_env("SMTP_PORT", 587)
    smtp_username = _get_text_env("SMTP_USERNAME")
    smtp_password = _get_text_env("SMTP_PASSWORD")
    sender_name = _get_text_env("SMTP_SENDER_NAME") or "Clearance System"
    sender_email = _get_text_env("SMTP_SENDER_EMAIL") or smtp_username
    use_ssl = _get_bool_env("SMTP_USE_SSL", smtp_port == 465)
    use_tls = _get_bool_env("SMTP_USE_TLS", not use_ssl)
    timeout = _get_int_env("SMTP_TIMEOUT_SECONDS", 20)

    if not all([smtp_host, smtp_username, smtp_password, sender_email]):
        raise RuntimeError("SMTP settings are missing. Check SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, and SMTP_SENDER_EMAIL.")

    if smtp_host.lower().endswith("gmail.com"):
        smtp_password = "".join(smtp_password.split())

    message = EmailMessage()
    message["Subject"] = "Your clearance system verification code"
    message["From"] = formataddr((sender_name, sender_email))
    message["To"] = to_email
    message.set_content(
        f"Your clearance system verification code is {otp}.\n\n"
        f"This code expires in {expires_in_minutes} minutes. "
        "If you did not request this login, ignore this email."
    )

    context = ssl.create_default_context()
    if use_ssl:
        with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=timeout, context=context) as server:
            server.login(smtp_username, smtp_password)
            server.send_message(message)
        return

    with smtplib.SMTP(smtp_host, smtp_port, timeout=timeout) as server:
        if use_tls:
            server.starttls(context=context)
        server.login(smtp_username, smtp_password)
        server.send_message(message)
