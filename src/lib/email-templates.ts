/**
 * Newsletter 邮件模板
 * 使用 React Email 风格的组件化模板
 */

interface EmailTemplateProps {
  verifyUrl?: string;
  unsubscribeUrl?: string;
  companyName?: string;
  logoUrl?: string;
}

/**
 * 欢迎订阅邮件模板
 */
export function WelcomeEmailTemplate({
  verifyUrl,
  unsubscribeUrl,
  companyName = 'YOYO Mall',
  logoUrl,
}: EmailTemplateProps) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>欢迎订阅 ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto; margin-bottom: 20px;">` : ''}
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">欢迎订阅 ${companyName}！</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                感谢您订阅我们的新闻通讯！🎉
              </p>
              
              <p style="margin: 0 0 20px; color: #666666; font-size: 15px; line-height: 1.6;">
                为了确保我们能够向您发送最新的优惠信息和产品资讯，请点击下方按钮验证您的邮箱地址。
              </p>
              
              ${verifyUrl ? `
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${verifyUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      验证邮箱地址
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 10px; color: #999999; font-size: 13px; text-align: center;">
                或复制以下链接到浏览器：
              </p>
              <p style="margin: 0 0 20px; color: #667eea; font-size: 13px; word-break: break-all; text-align: center;">
                ${verifyUrl}
              </p>
              ` : ''}
              
              <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                <p style="margin: 0 0 10px; color: #333333; font-weight: 600;">订阅后您将获得：</p>
                <ul style="margin: 10px 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.8;">
                  <li>独家优惠和促销活动提前通知</li>
                  <li>新品上市第一时间了解</li>
                  <li>精选商品推荐</li>
                  <li>购物小贴士和使用指南</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px; color: #999999; font-size: 13px; text-align: center;">
                ${companyName} © ${new Date().getFullYear()} 版权所有
              </p>
              ${unsubscribeUrl ? `
              <p style="margin: 0; text-align: center;">
                <a href="${unsubscribeUrl}" style="color: #999999; font-size: 12px; text-decoration: underline;">
                  取消订阅
                </a>
              </p>
              ` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 订阅确认成功邮件模板
 */
export function ConfirmationEmailTemplate({
  unsubscribeUrl,
  companyName = 'YOYO Mall',
  logoUrl,
}: EmailTemplateProps) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>订阅确认成功</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px; text-align: center;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto; margin-bottom: 20px;">` : ''}
              
              <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">✓</span>
              </div>
              
              <h1 style="margin: 0 0 20px; color: #333333; font-size: 28px; font-weight: 600;">订阅成功！</h1>
              
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                您的邮箱已成功验证，感谢您的订阅！
              </p>
              
              <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                我们将定期向您发送最新的优惠信息和产品资讯，敬请期待！
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px; color: #999999; font-size: 13px; text-align: center;">
                ${companyName} © ${new Date().getFullYear()} 版权所有
              </p>
              ${unsubscribeUrl ? `
              <p style="margin: 0; text-align: center;">
                <a href="${unsubscribeUrl}" style="color: #999999; font-size: 12px; text-decoration: underline;">
                  取消订阅
                </a>
              </p>
              ` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 取消订阅确认邮件模板
 */
export function UnsubscribeEmailTemplate({
  companyName = 'YOYO Mall',
  logoUrl,
}: EmailTemplateProps) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
  <title>取消订阅</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px; text-align: center;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto; margin-bottom: 20px;">` : ''}
              
              <h1 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">您已取消订阅</h1>
              
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                我们很遗憾看到您离开，感谢您之前的关注。
              </p>
              
              <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                如果这是误操作，您可以随时在我们的网站重新订阅。
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 13px; text-align: center;">
                ${companyName} © ${new Date().getFullYear()} 版权所有
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 营销邮件模板（可自定义内容）
 */
export function CampaignEmailTemplate({
  subject,
  content,
  unsubscribeUrl,
  companyName = 'YOYO Mall',
  logoUrl,
}: {
  subject: string;
  content: string;
  unsubscribeUrl?: string;
  companyName?: string;
  logoUrl?: string;
}) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto;">` : ''}
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <div style="color: #333333; font-size: 15px; line-height: 1.6;">
                ${content}
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px; color: #999999; font-size: 13px; text-align: center;">
                ${companyName} © ${new Date().getFullYear()} 版权所有
              </p>
              ${unsubscribeUrl ? `
              <p style="margin: 0; text-align: center;">
                <a href="${unsubscribeUrl}" style="color: #999999; font-size: 12px; text-decoration: underline;">
                  取消订阅
                </a>
              </p>
              ` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

