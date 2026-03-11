function stars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

export function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f4f4f5; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #722F37; padding: 24px 32px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 32px; }
    .content p { color: #27272a; line-height: 1.6; margin: 0 0 16px; }
    .button { display: inline-block; background: #722F37; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .button:hover { background: #5a252c; }
    .footer { padding: 24px 32px; border-top: 1px solid #e4e4e7; }
    .footer p { color: #a1a1aa; font-size: 12px; margin: 0; line-height: 1.5; }
    .card { background: #fafafa; border-radius: 8px; padding: 16px; margin: 12px 0; }
    .stars { color: #eab308; font-size: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Cuvee</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Cuvee — L'app qui connecte les cavistes et leurs clients</p>
      <p>Vous recevez cet email car vous utilisez Cuvee.</p>
    </div>
  </div>
</body>
</html>`
}

export function invitationEmail(params: {
  firstName: string
  shopName: string
  inviteUrl: string
}): string {
  return `
    <p>Bonjour ${params.firstName},</p>
    <p><strong>${params.shopName}</strong> vous invite à rejoindre Cuvee pour recevoir vos fiches de dégustation personnalisées.</p>
    <p>Avec Cuvee, vous pourrez :</p>
    <ul style="color: #27272a; line-height: 1.8;">
      <li>Retrouver tous les vins de vos box</li>
      <li>Noter et commenter chaque bouteille</li>
      <li>Demander une re-commande en un clic</li>
    </ul>
    <p style="text-align: center; margin: 32px 0;">
      <a href="${params.inviteUrl}" class="button">Créer mon compte</a>
    </p>
    <p style="color: #71717a; font-size: 13px;">Si vous n'attendiez pas cet email, vous pouvez l'ignorer.</p>
  `
}

export function feedbackDigestEmail(params: {
  merchantName: string
  feedbacks: Array<{
    wineName: string
    clientName: string
    rating: number
    notes: string | null
  }>
  feedbackUrl: string
}): string {
  const feedbackCards = params.feedbacks
    .map(
      (fb) => `
    <div class="card">
      <div class="stars">${stars(fb.rating)}</div>
      <p style="font-weight: 600; margin: 4px 0;">${fb.wineName}</p>
      <p style="color: #71717a; font-size: 14px; margin: 4px 0;">${fb.clientName}</p>
      ${fb.notes ? `<p style="font-style: italic; color: #52525b; font-size: 14px; margin: 8px 0 0;">"${fb.notes}"</p>` : ''}
    </div>
  `
    )
    .join('')

  return `
    <p>Bonjour,</p>
    <p>Vos clients ont donné leur avis :</p>
    ${feedbackCards}
    <p style="text-align: center; margin: 32px 0;">
      <a href="${params.feedbackUrl}" class="button">Voir tous les feedbacks</a>
    </p>
  `
}

export function guardReminderEmail(params: {
  clientName: string
  wines: Array<{
    name: string
    domain: string | null
    vintage: number | null
    guardMin: number | null
    guardMax: number | null
  }>
  caveUrl: string
}): string {
  const wineCards = params.wines
    .map(
      (w) => `
    <div class="card">
      <p style="font-weight: 600; margin: 0 0 4px;">${w.name}</p>
      ${w.domain ? `<p style="color: #71717a; font-size: 14px; margin: 0 0 4px;">${w.domain}</p>` : ''}
      <p style="color: #52525b; font-size: 14px; margin: 0;">
        ${w.vintage ? `Millésime ${w.vintage}` : ''}
        ${w.guardMin || w.guardMax ? ` · Garde ${w.guardMin || '?'}-${w.guardMax || '?'} ans` : ''}
      </p>
    </div>
  `
    )
    .join('')

  return `
    <p>Bonjour ${params.clientName},</p>
    <p>Bonne nouvelle ! ${params.wines.length === 1 ? 'Un de vos vins a atteint' : 'Certains de vos vins ont atteint'} sa période de garde optimale et ${params.wines.length === 1 ? 'est maintenant prêt' : 'sont maintenant prêts'} à être dégusté${params.wines.length > 1 ? 's' : ''}.</p>
    ${wineCards}
    <p style="text-align: center; margin: 32px 0;">
      <a href="${params.caveUrl}" class="button">Voir ma cave</a>
    </p>
    <p>Bonne dégustation !</p>
  `
}

export function reorderRequestEmail(params: {
  clientName: string
  wineName: string
  reordersUrl: string
}): string {
  return `
    <p>Bonne nouvelle !</p>
    <p><strong>${params.clientName}</strong> souhaite re-commander un vin :</p>
    <div class="card">
      <p style="font-weight: 600; margin: 0;">${params.wineName}</p>
    </div>
    <p style="text-align: center; margin: 32px 0;">
      <a href="${params.reordersUrl}" class="button">Voir les demandes</a>
    </p>
  `
}

export function inviteAcceptedEmail(params: {
  clientName: string
  clientsUrl: string
}): string {
  return `
    <p>Bonne nouvelle !</p>
    <p><strong>${params.clientName}</strong> a accepté votre invitation et a rejoint Cuvee.</p>
    <p>Vous pouvez dès maintenant lui envoyer sa première box de vins.</p>
    <p style="text-align: center; margin: 32px 0;">
      <a href="${params.clientsUrl}" class="button">Voir mes clients</a>
    </p>
  `
}
