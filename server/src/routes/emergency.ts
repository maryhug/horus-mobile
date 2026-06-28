import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendPushNotification } from '../services/notification';
import { saveNotification } from '../services/healthScore';

const router = Router();

function bloodTypeLabel(bt?: string | null): string {
    if (!bt) return '—';
    return bt.replace('_POSITIVE', '+').replace('_NEGATIVE', '-').replace('A_', 'A').replace('B_', 'B').replace('O_', 'O').replace('AB_', 'AB');
}

function severityColor(s: string): string {
    switch (s?.toUpperCase()) {
        case 'LIFE_THREATENING': return '#C0392B';
        case 'SEVERE':           return '#E74C3C';
        case 'MODERATE':         return '#E67E22';
        default:                 return '#27AE60';
    }
}

function severityLabel(s: string): string {
    switch (s?.toUpperCase()) {
        case 'LIFE_THREATENING': return 'Riesgo vital';
        case 'SEVERE':           return 'Severa';
        case 'MODERATE':         return 'Moderada';
        default:                 return 'Leve';
    }
}

function ageFromDob(dob?: Date | null): string {
    if (!dob) return '';
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
    return `${age} años`;
}

// GET /emergency/:userId — público, sin auth, muestra ficha médica
router.get('/:userId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                personalInfo:      true,
                medicalProfile:    true,
                allergies:         { orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }] },
                chronicConditions: { orderBy: [{ createdAt: 'desc' }] },
                medications:       { where: { isCurrent: true }, include: { medication: true } },
                emergencyContacts: { where: { isActive: true }, orderBy: { priorityOrder: 'asc' } },
                privacySettings:   true,
            },
        });

        if (!user) {
            res.status(404).send('<h1>Perfil no encontrado</h1>');
            return;
        }

        // Registrar el escaneo QR y enviar notificación
        try {
            await prisma.profileScan.create({
                data: {
                    userId,
                    scanType: 'QR',
                    scannerIp: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
                }
            });

            const scanDate = new Date().toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
        await sendPushNotification(userId, 'Perfil consultado', `Tu ID médico fue escaneado el ${scanDate}`, { type: 'profile_scanned', scanType: 'QR' });
        await saveNotification(userId, 'Perfil consultado', `Tu ID médico fue escaneado el ${scanDate}`, 'qr_scan');
        } catch (err) {
            console.error('Error recording scan/notifying:', err);
        }

        const priv = user.privacySettings;
        const p    = user.personalInfo;
        const m    = user.medicalProfile;

        const name  = priv?.showFullName !== false && p ? `${p.firstName} ${p.lastName}` : 'Paciente Horus';
        const age   = priv?.showAge !== false ? ageFromDob(p?.dateOfBirth) : '';
        const blood = priv?.showBloodType !== false ? bloodTypeLabel(p?.bloodType) : '';

        const allAllergies   = priv?.showAllergies !== false ? user.allergies : [];
        const activeAllergies  = allAllergies.filter(a => a.isActive);
        const historicAllergies = allAllergies.filter(a => !a.isActive);
        const meds       = priv?.showMedications !== false ? user.medications : [];
        const allConditions = priv?.showChronicConditions !== false ? user.chronicConditions : [];
        const activeConditions   = allConditions.filter(c => c.status === 'ACTIVE' || c.status === 'MANAGED');
        const historicConditions = allConditions.filter(c => c.status === 'IN_REMISSION' || c.status === 'RESOLVED');
        const contacts   = priv?.showEmergencyContacts !== false ? user.emergencyContacts : [];

        const conditionStatusLabel = (s: string) => {
            switch (s) { case 'ACTIVE': return 'Activa'; case 'MANAGED': return 'Controlada'; case 'IN_REMISSION': return 'En remisión'; case 'RESOLVED': return 'Resuelta'; default: return s; }
        };

        const allergiesHtml = allAllergies.length > 0 ? `
      <div class="section">
        <div class="section-title">Alergias activas</div>
        ${activeAllergies.length === 0 ? '<div class="sub" style="padding:4px 0">Sin alergias activas</div>' : activeAllergies.map(a => `
          <div class="allergy-item" style="border-color:${severityColor(a.severity)}">
            <div class="item-row">
              <span class="item-name">${a.allergenName}</span>
              <span class="badge" style="background:${severityColor(a.severity)}22;color:${severityColor(a.severity)}">${severityLabel(a.severity)}</span>
            </div>
            ${a.reactionDescription ? `<div class="sub">${a.reactionDescription}</div>` : ''}
          </div>`).join('')}
        ${historicAllergies.length > 0 ? `
        <div class="section-title" style="margin-top:14px;font-size:11px;opacity:0.6">Historial (inactivas)</div>
        ${historicAllergies.map(a => `
          <div class="allergy-item" style="border-color:#ccc;opacity:0.55">
            <div class="item-row">
              <span class="item-name" style="text-decoration:line-through">${a.allergenName}</span>
              <span class="badge" style="background:#eee;color:#999">${severityLabel(a.severity)}</span>
            </div>
          </div>`).join('')}` : ''}
      </div>` : '';

        const medsHtml = meds.length > 0 ? `
      <div class="section">
        <div class="section-title">Medicamentos actuales</div>
        ${meds.map(med => {
            const medName = med.customMedicationName ?? med.medication?.genericName ?? '—';
            return `
          <div class="item">
            <div class="item-row">
              <span class="item-name">${medName}</span>
              ${med.dosage ? `<span class="badge badge-muted">${med.dosage}</span>` : ''}
            </div>
            ${med.frequency ? `<div class="sub">${med.frequency}${med.route && med.route !== 'ORAL' ? ` · ${med.route.toLowerCase()}` : ''}</div>` : ''}
          </div>`;
        }).join('')}
      </div>` : '';

        const conditionsHtml = allConditions.length > 0 ? `
      <div class="section">
        <div class="section-title">Condiciones crónicas</div>
        ${activeConditions.length === 0 ? '<div class="sub" style="padding:4px 0">Sin condiciones activas</div>' : activeConditions.map(c => `
          <div class="item">
            <div class="item-row">
              <span class="item-name">${c.conditionName}</span>
              <span class="badge badge-muted">${conditionStatusLabel(c.status)}${c.severity ? ' · ' + c.severity.toLowerCase() : ''}</span>
            </div>
            ${c.notes ? `<div class="sub">${c.notes}</div>` : ''}
          </div>`).join('')}
        ${historicConditions.length > 0 ? `
        <div class="section-title" style="margin-top:14px;font-size:11px;opacity:0.6">Historial</div>
        ${historicConditions.map(c => `
          <div class="item" style="opacity:0.55">
            <div class="item-row">
              <span class="item-name" style="text-decoration:line-through">${c.conditionName}</span>
              <span class="badge badge-muted">${conditionStatusLabel(c.status)}</span>
            </div>
          </div>`).join('')}` : ''}
      </div>` : '';

        const contactsHtml = contacts.length > 0 ? `
      <div class="section">
        <div class="section-title">Contactos de emergencia</div>
        ${contacts.map(c => `
          <div class="item">
            <div class="contact-header">
              <span class="contact-name">${c.fullName}</span>
              <span class="contact-rel">${c.relationship}</span>
            </div>
            <div class="phone-row">
              <a href="tel:${c.phonePrimary}" class="phone">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.92a16 16 0 0 0 6.1 6.1l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                ${c.phonePrimary}
              </a>
              ${c.phoneSecondary ? `<a href="tel:${c.phoneSecondary}" class="phone">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.92a16 16 0 0 0 6.1 6.1l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                ${c.phoneSecondary}
              </a>` : ''}
            </div>
          </div>`).join('')}
      </div>` : '';

        const extraItems = [
            m?.heightCm ? `${m.heightCm} cm` : null,
            m?.weightKg ? `${m.weightKg} kg` : null,
            m?.organDonor ? 'Donante de órganos' : null,
            m?.insuranceProvider ? m.insuranceProvider : null,
        ].filter(Boolean);

        const notesHtml = (m?.additionalNotes && priv?.showMedicalHistory !== false) ? `
      <div class="card">
        <div class="section-title" style="margin-bottom:10px">Notas médicas</div>
        <div class="sub" style="font-size:13px;line-height:1.6;color:var(--primary)">${m.additionalNotes}</div>
      </div>` : '';

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ID Médico · ${name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700&display=swap" rel="stylesheet">
  <style>
    /* ── Design tokens (same as LIGHT theme in constants/theme.ts) ── */
    :root {
      --bg:       #F9F6ED;
      --card:     #FFFFFF;
      --primary:  #1A1512;
      --muted:    #8C7F6E;
      --muted-bg: #F3EFE7;
      --border:   #E8E2D8;
      --green:    #96C979;
      --green-fg: #1A3D0A;
      --yellow:   #FAD957;
      --blue:     #A5CCF4;
      --blue-fg:  #1A3A5C;
      --pink:     #FAB2D3;
      --pink-fg:  #7A1A3A;
      --red:      #C0392B;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg); color: var(--primary);
      padding: 20px 16px 48px; max-width: 480px; margin: 0 auto;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Header ── */
    .top-bar {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 28px; padding-top: 4px;
    }
    .wordmark {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 18px; font-weight: 700; letter-spacing: -0.3px;
      color: var(--primary);
    }
    .wordmark span { color: var(--muted); font-weight: 400; }
    .id-chip {
      font-family: 'DM Sans', sans-serif;
      font-size: 10px; font-weight: 700; letter-spacing: 0.10em;
      text-transform: uppercase;
      background: var(--muted-bg); color: var(--muted);
      padding: 6px 14px; border-radius: 999px;
      border: 1px solid var(--border);
    }

    /* ── Cards ── */
    .card {
      background: var(--card); border-radius: 24px; padding: 20px;
      margin-bottom: 12px;
      border: 1px solid var(--border);
      box-shadow: 0 1px 2px rgba(26,21,18,0.04), 0 6px 20px rgba(26,21,18,0.05);
    }

    /* ── Identity card ── */
    .patient-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 28px; font-weight: 700; color: var(--primary);
      line-height: 1.15; letter-spacing: -0.5px; margin-bottom: 4px;
    }
    .patient-meta { font-size: 14px; color: var(--muted); margin-bottom: 16px; font-weight: 500; }

    .blood-pill {
      display: inline-flex; align-items: center; gap: 7px;
      background: var(--pink); border-radius: 14px; padding: 9px 18px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 17px; font-weight: 700; color: var(--pink-fg);
      margin-bottom: 14px;
    }

    .tags { display: flex; flex-wrap: wrap; gap: 8px; }
    .tag {
      background: var(--muted-bg); border-radius: 10px;
      padding: 5px 13px; font-size: 12px; color: var(--muted);
      font-weight: 500; border: 1px solid var(--border);
    }
    .tag-green {
      background: rgba(150,201,121,0.18); color: var(--green-fg);
      border-color: rgba(150,201,121,0.35); font-weight: 600;
    }

    /* ── Section header ── */
    .section { margin-bottom: 16px; }
    .section:last-child { margin-bottom: 0; }
    .section-title {
      font-family: 'DM Sans', sans-serif;
      font-size: 10px; font-weight: 700; color: var(--muted);
      letter-spacing: 0.13em; text-transform: uppercase; margin-bottom: 10px;
    }

    /* ── Items ── */
    .item {
      background: var(--muted-bg); border-radius: 14px;
      padding: 12px 14px; margin-bottom: 8px;
      border: 1px solid var(--border);
    }
    .item:last-child { margin-bottom: 0; }
    .item-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
    .item-name { font-size: 14px; font-weight: 600; color: var(--primary); }
    .badge {
      font-size: 10px; font-weight: 700; padding: 3px 9px;
      border-radius: 8px; white-space: nowrap;
    }
    .badge-muted { background: var(--border); color: var(--muted); }
    .sub { font-size: 12px; color: var(--muted); margin-top: 5px; line-height: 1.55; }

    /* Allergy severity left-border */
    .allergy-item { border-left: 3px solid; padding-left: 12px; background: transparent; border-right: none; border-top: none; border-bottom: none; border-radius: 0; margin-bottom: 10px; }
    .allergy-item:last-child { margin-bottom: 0; }

    /* ── Contacts ── */
    .contact-header { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
    .contact-name { font-size: 15px; font-weight: 700; color: var(--primary); }
    .contact-rel {
      font-size: 11px; font-weight: 600; color: var(--blue-fg);
      background: var(--blue); border-radius: 6px; padding: 2px 8px;
    }
    .phone-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .phone {
      display: inline-flex; align-items: center; gap: 6px;
      color: var(--primary); text-decoration: none;
      font-size: 14px; font-weight: 700;
      background: var(--muted-bg); border-radius: 10px;
      padding: 7px 14px; border: 1px solid var(--border);
    }

    /* ── CTA ── */
    .cta-wrap { margin-top: 20px; display: flex; flex-direction: column; gap: 10px; }
    .call-btn {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      background: var(--primary); color: #F9F6ED; text-decoration: none;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 15px; font-weight: 700; letter-spacing: -0.1px;
      padding: 17px 24px; border-radius: 18px; text-align: center;
    }
    .call-btn-alt { background: #FAD957; color: #1A1512; }
    .call-icon { width: 18px; height: 18px; flex-shrink: 0; }

    /* ── Footer ── */
    .footer {
      text-align: center; font-size: 11px; color: var(--muted);
      margin-top: 28px; line-height: 2;
    }
    .sep { display: inline-block; width: 3px; height: 3px; border-radius: 50%; background: var(--border); margin: 0 7px; vertical-align: middle; }
  </style>
</head>
<body>

  <div class="top-bar">
    <div class="wordmark">HORUS <span>Medical ID</span></div>
    <div class="id-chip">ID Médico</div>
  </div>

  <div class="card">
    <div class="patient-name">${name}</div>
    <div class="patient-meta">${[age, p?.gender === 'MALE' ? 'Masculino' : p?.gender === 'FEMALE' ? 'Femenino' : ''].filter(Boolean).join(' · ')}</div>

    ${blood && blood !== '—' ? `
    <div class="blood-pill">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="call-icon"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
      Tipo ${blood}
    </div>` : ''}

    ${extraItems.length > 0 ? `<div class="tags">${extraItems.map(i => `<span class="${i?.toString().toLowerCase().includes('donante') ? 'tag tag-green' : 'tag'}">${i}</span>`).join('')}</div>` : ''}
  </div>

  ${allAllergies.length || meds.length || allConditions.length ? `
  <div class="card">
    ${allergiesHtml}
    ${medsHtml}
    ${conditionsHtml}
  </div>` : ''}

  ${contacts.length ? `<div class="card">${contactsHtml}</div>` : ''}
  ${notesHtml}

  <div class="cta-wrap">
    <a href="tel:123" class="call-btn">
      <svg class="call-icon" viewBox="0 0 24 24" fill="none" stroke="#F9F6ED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.92a16 16 0 0 0 6.1 6.1l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      Emergencias · 123
    </a>
    <a href="tel:132" class="call-btn call-btn-alt">
      <svg class="call-icon" viewBox="0 0 24 24" fill="none" stroke="#1A1512" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.92a16 16 0 0 0 6.1 6.1l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      Cruz Roja · 132
    </a>
    <a href="tel:119" class="call-btn call-btn-alt">
      <svg class="call-icon" viewBox="0 0 24 24" fill="none" stroke="#1A1512" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.92a16 16 0 0 0 6.1 6.1l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      Bomberos · 119
    </a>
  </div>

  <div class="footer">
    Generado por Horus Medical ID
    <span class="sep"></span>
    ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
  </div>

</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.send(html);
    } catch (error) {
        console.error('Emergency page error:', error);
        res.status(500).send('<h1>Error al cargar el perfil</h1>');
    }
});

// GET /emergency/:userId/json — para la app Wear OS
router.get('/:userId/json', async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                personalInfo:      true,
                medicalProfile:    true,
                allergies:         { where: { isActive: true } },
                chronicConditions: true,
                medications:       { where: { isCurrent: true }, include: { medication: true } },
                emergencyContacts: { where: { isActive: true }, orderBy: { priorityOrder: 'asc' } },
                privacySettings:   true,
            },
        });

        if (!user) { res.status(404).json({ message: 'No encontrado' }); return; }

        const priv = user.privacySettings;
        res.json({
            personalInfo: user.personalInfo ? {
                firstName:   user.personalInfo.firstName,
                lastName:    user.personalInfo.lastName,
                dateOfBirth: user.personalInfo.dateOfBirth?.toISOString().split('T')[0],
                gender:      user.personalInfo.gender,
                bloodType:   priv?.showBloodType !== false ? user.personalInfo.bloodType : null,
            } : null,
            medicalProfile: user.medicalProfile ? {
                organDonor:        user.medicalProfile.organDonor,
                insuranceProvider: user.medicalProfile.insuranceProvider,
            } : null,
            allergies: (priv?.showAllergies !== false ? user.allergies : []).map(a => ({
                allergenName: a.allergenName,
                severity:     a.severity,
            })),
            chronicConditions: (priv?.showChronicConditions !== false ? user.chronicConditions : []).map(c => ({
                conditionName: c.conditionName,
            })),
            medications: (priv?.showMedications !== false ? user.medications : []).map(m => ({
                customMedicationName: m.customMedicationName,
                medication:           m.medication ? { genericName: m.medication.genericName } : null,
                dosage:               m.dosage,
            })),
            emergencyContacts: (priv?.showEmergencyContacts !== false ? user.emergencyContacts : []).map(c => ({
                fullName:     c.fullName,
                relationship: c.relationship,
                phonePrimary: c.phonePrimary,
            })),
        });
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
});

export default router;