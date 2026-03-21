export const TEAMS = {
    VILLAGE: 'Village',
    WOLVES: 'Loups',
    SOLITARY: 'Solitaire'
};

export const ROLES = [
    // --- VILLAGE ---
    {
        id: 'simple-villageois',
        name: { fr: 'Simple Villageois', en: 'Simple Villager', ar: 'قروي بسيط' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `Il n'a aucun pouvoir particulier. Ses seules armes sont la force de persuasion pour éliminer les Loups-Garous.`,
            en: `He has no special powers. His only weapons are persuasion to eliminate the Werewolves.`,
            ar: `ليس لديه قوى خاصة. أسلحته الوحيدة هي قوة الإقناع للقضاء على المستذئبين.`
        },
        icon: '👨‍🌾',
        canHaveMultiple: true
    },
    {
        id: 'voyante',
        name: { fr: 'Voyante', en: 'Seer', ar: 'العرافة' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `Chaque nuit, elle peut connaître le véritable rôle d'un joueur de son choix. Elle doit aider les villageois sans se faire démasquer.`,
            en: `Each night, she can see the true role of a player of her choice. She must help the villagers without being discovered.`,
            ar: `كل ليلة، يمكنها معرفة الدور الحقيقي للاعب من اختيارها. يجب عليها مساعدة القرويين دون أن ينكشف أمرها.`
        },
        icon: '🔮'
    },
    {
        id: 'sorciere',
        name: { fr: 'Sorcière', en: 'Witch', ar: 'الساحرة' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `Elle possède deux potions : une de vie pour ressusciter une victime des loups, et une de mort pour éliminer un joueur.`,
            en: `She possesses two potions: one of life to resurrect a victim of the wolves, and one of death to eliminate a player.`,
            ar: `تمتلك جرعتين: واحدة للحياة لإحياء ضحية الذئاب، وأخرى للموت للقضاء على لاعب.`
        },
        icon: '🧪'
    },
    {
        id: 'chasseur',
        name: { fr: 'Chasseur', en: 'Hunter', ar: 'الصياد' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `S'il est éliminé, il doit répliquer en tirant un dernier coup de fusil, éliminant immédiatement un autre joueur de son choix.`,
            en: `If he is eliminated, he must retaliate by firing a final shot, immediately eliminating another player of his choice.`,
            ar: `إذا تم القضاء عليه، يجب أن يرد بإطلاق رصاصة أخيرة، مما يقضي فوراً على لاعب آخر من اختياره.`
        },
        icon: '🔫'
    },
    {
        id: 'salvateur',
        name: { fr: 'Salvateur', en: 'Savior', ar: 'المنقذ' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `Chaque nuit, il peut protéger un joueur contre l'attaque des loups. Il ne peut pas protéger deux fois de suite la même personne.`,
            en: `Each night, he can protect a player against the wolves' attack. He cannot protect the same person twice in a row.`,
            ar: `كل ليلة، يمكنه حماية لاعب من هجوم الذئاب. لا يمكنه حماية نفس الشخص مرتين متتاليتين.`
        },
        icon: '🛡️'
    },
    {
        id: 'petite-fille',
        name: { fr: 'Petite Fille', en: 'Little Girl', ar: 'الفتاة الصغيرة' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `Elle peut entrouvrir les yeux pendant la nuit pour espionner les loups-garous. Si elle est prise, elle meurt à leur place.`,
            en: `She can peek through her eyes during the night to spy on the werewolves. If caught, she dies in their place.`,
            ar: `يمكنها فتح عينيها قليلاً خلال الليل للتجسس على المستذئبين. إذا تم القبض عليها، تموت بدلاً منهم.`
        },
        icon: '👧'
    },
    {
        id: 'cupidon',
        name: { fr: 'Cupidon', en: 'Cupid', ar: 'كيوبيد' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `La première nuit, il désigne deux amoureux. Si l'un meurt, l'autre meurt de chagrin immédiatement.`,
            en: `The first night, he designates two lovers. If one dies, the other dies of grief immediately.`,
            ar: `في الليلة الأولى، يختار حبيبين. إذا مات أحدهما، يموت الآخر من الحزن فوراً.`
        },
        icon: '💘'
    },
    {
        id: 'corbeau',
        name: { fr: 'Corbeau', en: 'Raven', ar: 'الغراب' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `Chaque nuit, il peut désigner un joueur qu'il soupçonne. Ce joueur aura deux voix contre lui au vote suivant.`,
            en: `Each night, he can designate a player he suspects. That player will have two votes against them in the next vote.`,
            ar: `كل ليلة، يمكنه اختيار لاعب يشك فيه. سيحصل هذا اللاعب على صوتين ضده في التصويت التالي.`
        },
        icon: '🐦‍⬛'
    },
    {
        id: 'ours',
        name: { fr: 'Montreur d\'Ours', en: 'Bear Tamer', ar: 'مروض الدببة' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `Chaque matin, si un de ses voisins est un Loup-Garou, l'ours grogne. Sinon, il ne grogne pas.`,
            en: `Each morning, if one of his neighbors is a Werewolf, the bear growls. Otherwise, it doesn't.`,
            ar: `كل صباح، إذا كان أحد جيرانه مستذئباً، يزمجر الدب. خلاف ذلك، لا يزمجر.`
        },
        icon: '🐻'
    },
    {
        id: 'ancien',
        name: { fr: 'Ancien', en: 'Elder', ar: 'كبير القرية' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `L’ancien possède deux vies contre la nuit (loups). S'il est attaqué une fois, il ne meurt pas mais sa carte est révélée. S'il est éliminé par le vote ou le pouvoir d'un villageois, il meurt instantanément et tous les villageois perdent leurs pouvoirs.`,
            en: `The Elder has two lives against night attacks. If attacked once, he survives but his card is revealed. If eliminated by the village vote/power, he dies immediately and all villagers lose their powers permanently.`,
            ar: `يمتلك كبير القرية حياتين ضد الهجمات الليلية. إذا تعرض للهجوم مرة واحدة، فإنه ينجو ولكن تُكشف بطاقته. إذا تم استبعاده بتصويت القرية أو قوة قروي، يموت فوراً ويفقد جميع القرويين قواهم للأبد.`
        },
        icon: '👴'
    },
    {
        id: 'juge-begue',
        name: { fr: 'Juge Bègue', en: 'Stuttering Judge', ar: 'القاضي الألثغ' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `Une fois dans la partie, il peut lancer un deuxième vote immédiatement après le premier.`,
            en: `Once in the game, he can launch a second vote immediately after the first.`,
            ar: `مرة واحدة في اللعبة، يمكنه إطلاق تصويت ثانٍ فوراً بعد الأول.`
        },
        icon: '👨‍⚖️'
    },
    {
        id: 'chevalier-epee-rouillee',
        name: { fr: 'Chevalier à l\'épée rouillée', en: 'Rusty Sword Knight', ar: 'فارس السيف الصدئ' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `Si les loups le mangent, l'un d'eux meurt de la gangrène la nuit suivante.`,
            en: `If the wolves eat him, one of them dies of gangrene the following night.`,
            ar: `إذا أكله الذئاب، سيموت أحدهم من الغرغرينا في الليلة التالية.`
        },
        icon: '⚔️'
    },
    {
        id: 'soeurs',
        name: { fr: 'Sœurs / Frères', en: 'Sisters / Brothers', ar: 'أخوات / إخوة' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `Ils se connaissent et peuvent se concerter la nuit.`,
            en: `They know each other and can communicate during the night.`,
            ar: `يعرفون بعضهم البعض ويمكنهم التواصل خلال الليل.`
        },
        icon: '👯',
        canHaveMultiple: true
    },
    {
        id: 'servante-devouee',
        name: { fr: 'Servante Dévouée', en: 'Devoted Maid', ar: 'الخادمة المخلصة' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `Elle peut choisir de prendre le rôle d'un joueur qui vient d'être éliminé par le vote.`,
            en: `She can choose to take the role of a player who has just been eliminated by the vote.`,
            ar: `يمكنها اختيار القيام بدور اللاعب الذي تم إقصاؤه للتو عن طريق التصويت.`
        },
        icon: '🧹'
    },
    {
        id: 'enfant-sauvage',
        name: { fr: 'Enfant Sauvage', en: 'Wild Child', ar: 'الطفل البري' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `Choisit un mentor au début. Si le mentor meurt, l'enfant devient un loup-garou.`,
            en: `Chooses a mentor at the start. If the mentor dies, the child becomes a werewolf.`,
            ar: `يختار معلماً في البداية. إذا مات المعلم، يصبح الطفل مستذئباً.`
        },
        icon: '👶🐾'
    },
    {
        id: 'chaperon-rouge',
        name: { fr: 'Chaperon Rouge', en: 'Little Red Riding Hood', ar: 'ذات الرداء الأحمر' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `Tant que le Chasseur est en vie, elle ne peut pas être tuée par les loups.`,
            en: `As long as the Hunter is alive, she cannot be killed by the wolves.`,
            ar: `طالما أن الصياد على قيد الحياة، لا يمكن للذئاب قتلها.`
        },
        icon: '🍎'
    },
    {
        id: 'renard',
        name: { fr: 'Renard', en: 'Fox', ar: 'الثعلب' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `Peut flairer un groupe de 3. Si un loup s'y trouve, il garde son pouvoir, sinon il le perd.`,
            en: `Can sniff out a group of 3. If a wolf is in there, he keeps his power, otherwise he loses it.`,
            ar: `يمكنه شم مجموعة من 3 أشخاص. إذا كان هناك ذئب، فإنه يحتفظ بقوته، وإلا فإنه يفقدها.`
        },
        icon: '🦊'
    },
    {
        id: 'idiot-du-village',
        name: { fr: 'Idiot du Village', en: 'Village Idiot', ar: 'أحمق القرية' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `S'il est voté, il survit mais perd son droit de vote.`,
            en: `If voted out, he survives but loses his right to vote.`,
            ar: `إذا تم التصويت ضده، ينجو ولكنه يفقد حقه في التصويت.`
        },
        icon: '🤡'
    },
    {
        id: 'barbier',
        name: { fr: 'Barbier', en: 'Barber', ar: 'الحلاق' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `Peut éliminer un joueur en journée. Si sa cible n'est pas un loup, le barbier meurt aussi.`,
            en: `Can eliminate a player during the day. If the target is not a wolf, the barber also dies.`,
            ar: `يمكنه القضاء على لاعب خلال النهار. إذا لم يكن الهدف ذئباً، يموت الحلاق أيضاً.`
        },
        icon: '💈'
    },
    {
        id: 'berger',
        name: { fr: 'Berger', en: 'Shepherd', ar: 'الراعي' },
        team: TEAMS.VILLAGE,
        description: {
            fr: `Envoie ses moutons chez deux joueurs. Ils reviennent si le joueur est villageois.`,
            en: `Sends his sheep to two players. They return if the player is a villager.`,
            ar: `يرسل أغنامه إلى لاعبين. يعودون إذا كان اللاعب قروياً.`
        },
        icon: '🐑'
    },

    // --- LOUPS ---
    {
        id: 'loup-garou',
        name: { fr: 'Loup-Garou', en: 'Werewolf', ar: 'مستذئب' },
        team: TEAMS.WOLVES,
        description: {
            fr: `Chaque nuit, il dévore un villageois avec les autres loups.`,
            en: `Each night, he devours a villager with the other wolves.`,
            ar: `كل ليلة، يلتهم قروياً مع الذئاب الأخرى.`
        },
        icon: '🐺',
        canHaveMultiple: true
    },
    {
        id: 'infect-pere-loups',
        name: { fr: 'Infect Père des Loups', en: 'Infectious Father of Wolves', ar: 'أب الذئاب المعدي' },
        team: TEAMS.WOLVES,
        description: {
            fr: `Une fois par partie, il peut transformer la victime des loups en loup-garou au lieu de la tuer.`,
            en: `Once per game, he can transform the wolves' victim into a werewolf instead of killing them.`,
            ar: `مرة واحدة في اللعبة، يمكنه تحويل ضحية الذئاب إلى مستذئب بدلاً من قتله.`
        },
        icon: '🦠🐺'
    },
    {
        id: 'loup-noir',
        name: { fr: 'Loup Noir', en: 'Black Wolf', ar: 'الذئب الأسود' },
        team: TEAMS.WOLVES,
        description: {
            fr: `Chaque nuit, il choisit un joueur qui sera muet pendant toute la journée suivante.`,
            en: `Each night, he chooses a player who will be mute for the entire following day.`,
            ar: `كل ليلة، يختار لاعباً سيكون صامتاً طوال اليوم التالي.`
        },
        icon: '🐺🌑'
    },
    {
        id: 'grand-mechant-loup',
        name: { fr: 'Grand Méchant Loup', en: 'Big Bad Wolf', ar: 'الذئب الشرير الكبير' },
        team: TEAMS.WOLVES,
        description: {
            fr: `Tant qu'aucun autre loup n'est mort, il peut tuer une deuxième victime chaque nuit.`,
            en: `As long as no other wolf is dead, he can kill a second victim every night.`,
            ar: `طالما لم يمت أي ذئب آخر، يمكنه قتل ضحية ثانية كل ليلة.`
        },
        icon: '👹'
    },
    {
        id: 'loup-blanc',
        name: { fr: 'Loup Blanc', en: 'White Werewolf', ar: 'المستذئب الأبيض' },
        team: TEAMS.WOLVES,
        description: {
            fr: `Se réveille avec les loups, mais peut en tuer un chaque deux nuits. Son but est d'être le seul survivant.`,
            en: `Wakes up with the wolves but can kill one every two nights. His goal is to be the sole survivor.`,
            ar: `يستيقظ مع الذئاب ولكن يمكنه قتل أحدهم كل ليلتين. هدفه أن يكون الناجي الوحيد.`
        },
        icon: '🐺⚪'
    },
    {
        id: 'loup-rouge',
        name: { fr: 'Loup Rouge', en: 'Red Wolf', ar: 'الذئب الأحمر' },
        team: TEAMS.WOLVES,
        description: {
            fr: `S'il meurt par le vote, il se réveille une seconde fois pour dévorer une personne de plus.`,
            en: `If he dies by vote, he wakes up a second time to devour one more person.`,
            ar: `إذا مات عن طريق التصويت، يستيقظ مرة ثانية ليلتهم شخصاً آخر.`
        },
        icon: '🐺🔴'
    },
    {
        id: 'loup-bleu',
        name: { fr: 'Loup Bleu', en: 'Blue Wolf', ar: 'الذئب الأزرق' },
        team: TEAMS.WOLVES,
        description: {
            fr: `Il peut brouiller le rôle d'un joueur, trompant ainsi la voyante.`,
            en: `He can scramble a player's role, thus deceiving the seer.`,
            ar: `يمكنه التشويش على دور اللاعب، وبذلك يخدع العرافة.`
        },
        icon: '🐺🔵'
    },

    // --- SOLITAIRES / SPÉCIAUX ---
    {
        id: 'joueur-de-flute',
        name: { fr: 'Joueur de Flûte', en: 'Piper', ar: 'عازف المزمار' },
        team: TEAMS.SOLITARY,
        description: {
            fr: `Doit charmer tous les joueurs vivants pour gagner. Il charme deux joueurs chaque nuit.`,
            en: `Must charm all living players to win. He charms two players each night.`,
            ar: `يجب أن يسحر جميع اللاعبين الأحياء ليفوز. يسحر لاعبين كل ليلة.`
        },
        icon: '🪈'
    },
    {
        id: 'ange',
        name: { fr: 'Ange', en: 'Angel', ar: 'الملاك' },
        team: TEAMS.SOLITARY,
        description: {
            fr: `Gagne s'il se fait éliminer par le conseil lors du tout premier jour.`,
            en: `Wins if he is eliminated by the council on the very first day.`,
            ar: `يفوز إذا تم استبعاده من قبل المجلس في اليوم الأول.`
        },
        icon: '😇'
    },
    {
        id: 'sectaire',
        name: { fr: 'Abominable Sectaire', en: 'Abominable Sectarian', ar: 'طائفي مقيت' },
        team: TEAMS.SOLITARY,
        description: {
            fr: `L'Abominable Sectaire divise le village en deux camps au début. Son but est d'éliminer tous les joueurs qui appartiennent au camp opposé au sien pour gagner seul.`,
            en: `The Abominable Sectarian divides the village into two groups at the start. His goal is to eliminate all players from the opposite camp to win alone.`,
            ar: `يقسم الطائفي المقيت القرية إلى معسكرين في البداية. هدفه هو القضاء على جميع اللاعبين المنتمين إلى المعسكر الآخر ليفوز بمفرده.`
        },
        icon: '⛪'
    },
    {
        id: 'lapin-blanc',
        name: { fr: 'Lapin Blanc', en: 'White Rabbit', ar: 'الأرنب الأبيض' },
        team: TEAMS.SOLITARY,
        description: {
            fr: `Lapin Blanc a comme but de donner un chocolat à tous les joueurs en vie. Il peut en donner jusqu’à deux par nuit.`,
            en: `White Rabbit aims to give a chocolate to all living players. He can give up to two per night.`,
            ar: `تهدف الأرنب الأبيض إلى إعطاء الشوكولاتة لجميع اللاعبين الأحياء. يمكنه إعطاء ما يصل إلى اثنين في الليلة.`
        },
        icon: '🐇'
    },
    {
        id: 'pyromane',
        name: { fr: 'Pyromane', en: 'Arsonist', ar: 'مهووس بالحريق' },
        team: TEAMS.SOLITARY,
        description: {
            fr: `Asperge d'huile les joueurs chaque nuit, puis peut décider de les enflammer tous d'un coup.`,
            en: `Douses players with oil each night, then can decide to ignite them all at once.`,
            ar: `يرش الزيت على اللاعبين كل ليلة، ثم يمكنه أن يقرر إشعال النار فيهم جميعاً مرة واحدة.`
        },
        icon: '🔥'
    },
    {
        id: 'chien-loup',
        name: { fr: 'Chien-Loup', en: 'Wolf-Dog', ar: 'كلب الذئب' },
        team: TEAMS.SOLITARY,
        description: {
            fr: `Choisit la première nuit entre devenir un loup-garou ou un simple villageois.`,
            en: `Chooses on the first night between becoming a werewolf or a simple villager.`,
            ar: `يختار في الليلة الأولى بين أن يصبح مستذئباً أو قروياً بسيطاً.`
        },
        icon: '🐕'
    },
    {
        id: 'alien',
        name: { fr: 'Alien (Élien)', en: 'Alien', ar: 'كائن فضائي' },
        team: TEAMS.SOLITARY,
        description: {
            fr: `Doit deviner le rôle d'un joueur. S'il a raison, il l'élimine, sinon il meurt.`,
            en: `Must guess a player's role. If right, he eliminates them, otherwise he dies.`,
            ar: `يجب أن يحزر دور اللاعب. إذا كان على حق، يقضي عليهم، وإلا فإنه يموت.`
        },
        icon: '👽'
    }
];
