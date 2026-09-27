const fs = require('fs');
const content = fs.readFileSync('frontend/src/context/LanguageContext.js', 'utf8');

const start = content.indexOf('export const translations = {') + 'export const translations = '.length;
const chunk = content.slice(start);

let openBraces = 0;
let endIdx = -1;
for (let index = 0; index < chunk.length; index++) {
  if (chunk[index] === '{') {
    openBraces++;
  } else if (chunk[index] === '}') {
    openBraces--;
    if (openBraces === 0) {
      endIdx = index + 1;
      break;
    }
  }
}

const objStr = chunk.slice(0, endIdx);
const translationsObj = eval('(' + objStr + ')');

// Use double quotes to avoid escaping singles
const adminFrKeys = {
    sarabQuestConsole: "Console : Sarab Quest",
    createNewMission: "Créer une Nouvelle Mission",
    loadingData: "Chargement des données...",
    activeStatus: "Active",
    completedStatus: "Terminée",
    draftStatus: "Brouillon / En Attente",
    openDashboardPanel: "Ouvrir le Tableau de Bord",
    noActiveMissions: "Aucune mission active actuellement.",
    setupNewMission: "Configurer une Nouvelle Mission",
    missionName: "Nom de la Mission",
    defaultMapShape: "Disposition de la Carte par Défaut",
    mapPreview: "Aperçu de la Carte",
    mapOptionGeneral: "Village",
    mapOptionDesert: "Désert",
    mapOptionForet: "Forêt",
    mapOptionPlage: "Côte",
    descOrInstructions: "Description ou Instructions (Optionnel)",
    createTourBtn: "Créer le Circuit",
    confirmDeleteStage: "Êtes-vous sûr de vouloir supprimer cette étape ?",
    mainDashboardBtn: "Tableau de Bord Principal",
    setAsReadyBtn: "Marquer comme Prêt",
    startMissionActionBtn: "Démarrer la Mission !",
    endMissionActionBtn: "Terminer la Mission",
    statusLabel: "Statut :",
    cluesAndStages: "Indices & Étapes",
    editingClue: "✏️ Modifier l'Indice",
    addNewClue: "+ Ajouter un Nouvel Indice",
    clueTextPlaceholder: "Texte de l'indice (visible par les participants)",
    textBtn: "✍️ Texte",
    choiceBtn: "🔘 Choix",
    qrBtn: "📷 Code QR",
    nfcBtn: "📱 Badge NFC",
    stagePointsLevel: "Points de l'Étape :",
    pointsPlaceholder: "Points",
    choiceCountLabel: "Nombre de Choix :",
    selectCorrectAnswerInfo: "Sélectionnez la réponse correcte en cochant la case",
    choicePlaceholder: "Choix",
    correctAnswerSecret: "Réponse correcte secrète (Texte ou Nombre)",
    saveEditsBtn: "Enregistrer les modifications",
    addStageBtn: "+ Ajouter l'Étape",
    writtenAnswer: "Réponse Écrite",
    qcmChoices: "Choix QCM",
    scanQr: "Scan QR",
    scanNfc: "Scan NFC",
    clueNumberPrefix: "Indice #",
    pointsSuffix: "Points",
    answerLabel: "Réponse :",
    encryptedText: "[CRYPTÉ]",
    choicesLabel: "Choix :",
    downloadQrBtn: "Télécharger le Code QR à Imprimer",
    copyNfcLinkBtn: "Copier le Lien pour Badge NFC",
    synchronized: "Synchronisé",
    competingTeams: "Équipes Concurrentes",
    newTeamPlaceholder: "Nom de la nouvelle équipe",
    addTeamBtn: "+ Ajouter l'Équipe",
    teamCol: "Équipe",
    accessCodeCol: "Code d'Accès",
    stageCol: "Étape",
    pointsCol: "Points",
    nfcCopySuccessTitle: "Lien copié avec succès ! 📋\n\nMaintenant, ouvrez n'importe quelle application NFC (comme NFC Tools), utilisez l'option Écrire (URL / Lien), et collez-le là.",
    startTime: "Début",
    deleteConfirmAdmin: "Supprimer ?"
};

let changed = false;
for (const [key, val] of Object.entries(adminFrKeys)) {
    if (translationsObj.fr[key] !== val) {
        translationsObj.fr[key] = val;
        changed = true;
    }
}

if (changed) {
    const prettyTranslations = JSON.stringify(translationsObj, null, 4);
    const bottomPart = content.slice(start + endIdx);
    const finalFileContent = content.slice(0, start) + prettyTranslations + bottomPart;
    fs.writeFileSync('frontend/src/context/LanguageContext.js', finalFileContent);
    console.log('French admin translations updated successfully!');
} else {
    console.log('No updates needed.');
}
