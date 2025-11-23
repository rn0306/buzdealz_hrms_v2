// utils/notificationEmailTemplates.js

function getNotificationEmailTemplate(notification, recipientName, senderName) {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return '#DC2626';
      case 'medium':
        return '#F97316';
      case 'low':
        return '#FBBF24';
      default:
        return '#3B82F6';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'reminder':
        return '🔔';
      case 'urgent':
        return '🚨';
      default:
        return '📩';
    }
  };

  const severityColor = getSeverityColor(notification.meta?.severity);
  const typeIcon = getTypeIcon(notification.type);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: white; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; padding: 30px; }
          .notification-box { 
            background: #f9fafb; 
            border-left: 4px solid ${severityColor}; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 4px;
          }
          .notification-title { font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 10px 0; }
          .notification-message { color: #4b5563; white-space: pre-wrap; }
          .notification-meta { margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; }
          .meta-item { margin: 8px 0; }
          .severity-badge { 
            display: inline-block; 
            background-color: ${severityColor}; 
            color: white; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 12px; 
            font-weight: 600;
          }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          .button { 
            display: inline-block; 
            background: #667eea; 
            color: white; 
            padding: 12px 24px; 
            border-radius: 6px; 
            text-decoration: none; 
            margin: 20px 0;
            font-weight: 600;
          }
          .button:hover { background: #5568d3; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${typeIcon} ${notification.title || 'Notification'}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">From HRMS System</p>
          </div>
          
          <div class="content">
            <p>Hi <strong>${recipientName}</strong>,</p>
            
            <p>You have received a new ${notification.type} notification from <strong>${senderName}</strong>.</p>
            
            <div class="notification-box">
              <p class="notification-title">${notification.title || 'Important Update'}</p>
              <p class="notification-message">${notification.message}</p>
              
              <div class="notification-meta">
                <div class="meta-item">
                  <strong>Type:</strong> ${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                </div>
                ${
                  notification.meta?.severity
                    ? `<div class="meta-item"><strong>Severity:</strong> <span class="severity-badge">${notification.meta.severity.charAt(0).toUpperCase() + notification.meta.severity.slice(1)}</span></div>`
                    : ''
                }
                <div class="meta-item">
                  <strong>Sent:</strong> ${new Date(notification.created_at).toLocaleString()}
                </div>
              </div>
            </div>
            
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/notifications" class="button">
                View Notification
              </a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              You can manage your notification preferences in the HRMS portal.
            </p>
          </div>
          
          <div class="footer">
            <p>© 2025 BuzDealz HRMS. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

module.exports = {
  getNotificationEmailTemplate,
};
