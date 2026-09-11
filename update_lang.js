const fs = require('fs');
const code = fs.readFileSync('src/context/LanguageContext.js', 'utf8');

const keys = {
    fr: {
        pendingActivityRequests: "Demandes d'Activité en Attente",
        activeClubs: "Clubs Actifs",
        hiddenFromSite: "Masqué du site",
        clubActive: "Club Actif",
        clubInactive: "Club Inactif",
        deactivate: "Désactiver",
        reactivate: "Réactiver",
        confirmReactivateClub: "Voulez-vous réactiver le club \"{clubName}\" ? Ses membres non désactivés individuellement par l'admin seront réactivés.",
        confirmDeactivateClub: "Voulez-vous désactiver le club \"{clubName}\" ? Tous ses membres seront aussi désactivés.",
        confirmApproveRequest: "Accepter la demande pour \"{clubName}\" ?\n\n✅ Cela va :\n- Créer la page du club\n- Créer le compte avec le rôle \"club\"\n- Attribuer 5 points de score au club\n- Assigner les postes du bureau aux membres",
        confirmRejectRequest: "Refuser la demande pour \"{clubName}\" ?\n\nLe club ne sera pas créé.",
        acceptAndCreate: "✅ Accepter & Créer",
        rejectBtn: "❌ Refuser",
        processing: "⏳ Traitement...",
        processingShort: "⏳ ...",
        confirmShowClub: "Réafficher \"{clubName}\" dans la liste publique des clubs ?",
        confirmHideClub: "Masquer \"{clubName}\" de la liste publique des clubs ?\n\nLe club ne sera pas supprimé, juste invisible sur le site.",
        proposedBureau: "Bureau proposé :",
        waiting: "En attente"
    },
    en: {
        pendingActivityRequests: "Pending Activity Requests",
        activeClubs: "Active Clubs",
        hiddenFromSite: "Hidden from site",
        clubActive: "Active Club",
        clubInactive: "Inactive Club",
        deactivate: "Deactivate",
        reactivate: "Reactivate",
        confirmReactivateClub: "Do you want to reactivate the club \"{clubName}\"? Its members not individually deactivated by the admin will be reactivated.",
        confirmDeactivateClub: "Do you want to deactivate the club \"{clubName}\"? All its members will also be deactivated.",
        confirmApproveRequest: "Accept the request for \"{clubName}\"?\n\n✅ This will:\n- Create the club page\n- Create the account with the \"club\" role\n- Award 5 score points to the club\n- Assign board positions to members",
        confirmRejectRequest: "Reject the request for \"{clubName}\"?\n\nThe club will not be created.",
        acceptAndCreate: "✅ Accept & Create",
        rejectBtn: "❌ Reject",
        processing: "⏳ Processing...",
        processingShort: "⏳ ...",
        confirmShowClub: "Show \"{clubName}\" again in the public club list?",
        confirmHideClub: "Hide \"{clubName}\" from the public club list?\n\nThe club will not be deleted, just invisible on the site.",
        proposedBureau: "Proposed Board:",
        waiting: "Waiting"
    },
    ar: {
        pendingActivityRequests: "طلبات النشاط المعلقة",
        activeClubs: "الأندية النشطة",
        hiddenFromSite: "مخفي من الموقع",
        clubActive: "نادي نشط",
        clubInactive: "نادي غير نشط",
        deactivate: "تعطيل",
        reactivate: "تفعيل",
        confirmReactivateClub: "هل تريد إعادة تفعيل النادي \"{clubName}\"؟ سيتم إعادة تفعيل أعضائه الذين لم يتم تعطيلهم فرديًا من قبل المسؤول.",
        confirmDeactivateClub: "هل تريد تعطيل النادي \"{clubName}\"؟ سيتم تعطيل جميع أعضائه أيضًا.",
        confirmApproveRequest: "قبول الطلب لـ \"{clubName}\"؟\n\n✅ سيؤدي هذا إلى:\n- إنشاء صفحة النادي\n- إنشاء الحساب بدور \"النادي\"\n- منح 5 نقاط للنادي\n- تعيين مناصب المكتب للأعضاء",
        confirmRejectRequest: "رفض الطلب لـ \"{clubName}\"؟\n\nلن يتم إنشاء النادي.",
        acceptAndCreate: "✅ قبول وإنشاء",
        rejectBtn: "❌ رفض",
        processing: "⏳ جاري المعالجة...",
        processingShort: "⏳ ...",
        confirmShowClub: "إعادة إظهار \"{clubName}\" في القائمة العامة للأندية؟",
        confirmHideClub: "إخفاء \"{clubName}\" من القائمة العامة للأندية؟\n\nلن يتم حذف النادي، بل سيكون غير مرئي على الموقع فقط.",
        proposedBureau: "المكتب المقترح:",
        waiting: "قيد الانتظار"
    }
};

let newCode = code;

for (const lang of ['fr', 'en', 'ar']) {
    const searchString = 'clubsManagementTitle:';
    const langIndexStart = newCode.indexOf(lang + ' : {') !== -1 ? newCode.indexOf(lang + ' : {') : newCode.indexOf(lang + ': {');
    
    // Find the next occurrence of searchString after the lang start
    const insertIndex = newCode.indexOf(searchString, langIndexStart);
    if (insertIndex > -1) {
        let replacement = '';
        for (const [key, value] of Object.entries(keys[lang])) {
            replacement += '        ' + key + ': ' + JSON.stringify(value) + ',\n';
        }
        newCode = newCode.substring(0, insertIndex) + replacement + newCode.substring(insertIndex);
    }
}

fs.writeFileSync('src/context/LanguageContext.js', newCode);
console.log('LanguageContext.js updated');
