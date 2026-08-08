import aiosmtplib
from email.message import EmailMessage

async def send_gmail_smtp(sender_email: str, app_password: str, recipient_email: str, subject: str, body: str):
    """
    Sends outbound cold email using user's personal Gmail App Password over TLS/SSL SMTP.
    """
    if not sender_email or not app_password or not recipient_email:
        raise ValueError("Sender email, Gmail App Password, and recipient email are required.")

    message = EmailMessage()
    message["From"] = sender_email
    message["To"] = recipient_email
    message["Subject"] = subject
    message.set_content(body)

    # Clean app password spaces if user pasted 'abcd efgh ijkl mnop'
    clean_password = app_password.replace(" ", "")

    await aiosmtplib.send(
        message,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=sender_email,
        password=clean_password
    )
    print(f"Successfully sent email via Gmail SMTP to {recipient_email}!")
    return True
