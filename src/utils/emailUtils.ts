export const sendToEmailClient = (emailData: {
  to?: string;
  subject: string;
  body: string;
  from: string;
  provider?: 'gmail' | 'outlook' | 'yahoo';
}) => {
  const { to, subject, body, from, provider = 'gmail' } = emailData;
  
  // Clean the body content by removing any existing URL encodings
  const cleanBody = body.replace(/%0D%0A/g, '\n').replace(/%20/g, ' ');
  
  // Format body with signature
  const formattedBody = `${cleanBody}\n\nSent by: ${from}`;
  
  // Encode email content for URL
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(formattedBody);
  const encodedTo = to ? encodeURIComponent(to) : '';
  
  // Define email provider URLs
  const providerUrls = {
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}`,
    outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`,
    yahoo: `https://compose.mail.yahoo.com/?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`
  };

  // Open in new tab
  window.open(providerUrls[provider], '_blank');
};