import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Rule from '@/models/Rule';
import QuizQuestion from '@/models/QuizQuestion';

export async function GET() {
    try {
        await dbConnect();
        
        // Clear old ones to populate with the comprehensive ones
        await Rule.deleteMany({});
        await QuizQuestion.deleteMany({});

        const rulesToInsert = [
            // Engagement
            {
                category: 'Engagement',
                fullText: {
                    fr: 'Assiduité et implication : Une participation régulière et sérieuse est attendue de chaque membre, en fonction des responsabilités qui lui sont confiées.',
                    en: 'Attendance and involvement: Regular and serious participation is expected of each member, according to their responsibilities.',
                    ar: 'المواظبة والمشاركة: يُتوقع من كل عضو مشاركة منتظمة وجادة، بناءً على المسؤوليات الموكلة إليه.'
                },
                shortTextToType: { fr: 'participation régulière', en: 'regular participation', ar: 'مشاركة منتظمة' }
            },
            {
                category: 'Engagement',
                fullText: {
                    fr: 'Respect des engagements : Toute tâche ou responsabilité acceptée doit être menée à bien dans les délais convenus, sauf empêchement dûment justifié.',
                    en: 'Respect of commitments: Any accepted task or responsibility must be completed within the agreed deadlines, unless duly justified.',
                    ar: 'احترام الالتزامات: يجب إنجاز أي مهمة أو مسؤولية مقبولة في المواعيد المحددة، ما لم يوجد مبرر معقول.'
                },
                shortTextToType: { fr: 'respect des engagements', en: 'respect commitments', ar: 'احترام الالتزامات' }
            },
            
            // Discipline et comportement
            {
                category: 'Discipline et comportement',
                fullText: {
                    fr: 'Prévention et gestion des conflits : Les désaccords doivent être traités avec calme et respect, dans un esprit de dialogue.',
                    en: 'Conflict prevention and management: Disagreements must be handled calmly and respectfully, in a spirit of dialogue.',
                    ar: 'الوقاية من النزاعات وإدارتها: يجب معالجة الخلافات بهدوء واحترام، بروح الحوار.'
                },
                shortTextToType: { fr: 'calme et respect', en: 'calmly and respectfully', ar: 'بهدوء واحترام' }
            },
            {
                category: 'Discipline et comportement',
                fullText: {
                    fr: 'Respect des rôles et des titres : Le pouvoir de décision, attaché au titre exercé, doit être reconnu et respecté par l\'ensemble des membres.',
                    en: 'Respect for roles and titles: The decision-making power attached to each title must be recognized and respected by all members.',
                    ar: 'احترام الأدوار والمناصب: يجب الاعتراف بصلاحيات اتخاذ القرار المرتبطة بكل منصب واحترامها من قبل جميع الأعضاء.'
                },
                shortTextToType: { fr: 'respect des rôles', en: 'respect for roles', ar: 'احترام الأدوار' }
            },

            // Réunions et communication
            {
                category: 'Réunions et communication',
                fullText: {
                    fr: 'Communication respectueuse : Les échanges en interne doivent demeurer courtois, constructifs et professionnels en toutes circonstances.',
                    en: 'Respectful communication: Internal exchanges must remain courteous, constructive and professional in all circumstances.',
                    ar: 'التواصل المحترم: يجب أن تظل النقاشات الداخلية مهذبة وبناءة ومهنية في جميع الظروف.'
                },
                shortTextToType: { fr: 'échanges courtois', en: 'courteous exchanges', ar: 'نقاشات مهذبة' }
            },
            {
                category: 'Réunions et communication',
                fullText: {
                    fr: 'Utilisation des outils : Les groupes internes sont destinés en priorité aux communications relatives à l\'association et à ses activités.',
                    en: 'Use of tools: Internal groups are primarily intended for communications related to the association and its activities.',
                    ar: 'استخدام الأدوات: المجموعات الداخلية مخصصة في المقام الأول للاتصالات المتعلقة بالجمعية وأنشطتها.'
                },
                shortTextToType: { fr: 'outils internes', en: 'internal tools', ar: 'الأدوات الداخلية' }
            },
            {
                category: 'Réunions et communication',
                fullText: {
                    fr: 'Réactivité : Tout membre investi d\'une responsabilité doit consulter les communications et y répondre dans un délai raisonnable.',
                    en: 'Responsiveness: Any member with a responsibility must check communications and respond within a reasonable time.',
                    ar: 'التجاوب: يجب على أي عضو مسؤول مراجعة الاتصالات والرد عليها في وقت معقول.'
                },
                shortTextToType: { fr: 'répondre dans un délai', en: 'respond within a time', ar: 'الرد في وقت معقول' }
            },

            // Activités et événements
            {
                category: 'Activités et événements',
                fullText: {
                    fr: 'Collaboration entre les équipes : Les membres favorisent l\'entraide et la coopération entre les différents pôles et équipes.',
                    en: 'Collaboration between teams: Members promote mutual aid and cooperation between different departments and teams.',
                    ar: 'التعاون بين الفرق: يشجع الأعضاء على التعاون والمساعدة المتبادلة بين الأقسام والفرق المختلفة.'
                },
                shortTextToType: { fr: 'entraide et coopération', en: 'mutual aid and cooperation', ar: 'التعاون والمساعدة' }
            },
            {
                category: 'Activités et événements',
                fullText: {
                    fr: 'Respect des intervenants : Les invités, formateurs et partenaires sont traités avec professionnalisme en toute circonstance.',
                    en: 'Respect for speakers: Guests, trainers and partners are treated professionally at all times.',
                    ar: 'احترام المتدخلين: يتم التعامع مع الضيوف والمدربين والشركاء باحترافية في جميع الأوقات.' 
                },
                shortTextToType: { fr: 'respect des partenaires', en: 'respect for partners', ar: 'احترام الشركاء' }
            },
            {
                category: 'Activités et événements',
                fullText: {
                    fr: 'Respect des lieux : Les membres veillent à préserver la propreté et l\'intégrité des espaces utilisés lors des événements.',
                    en: 'Respect for premises: Members ensure the cleanliness and integrity of the spaces used during events.',
                    ar: 'احترام الأماكن: يحرص الأعضاء على الحفاظ على نظافة وسلامة الأماكن المستخدمة أثناء الفعاليات.' 
                },
                shortTextToType: { fr: 'propreté des espaces', en: 'cleanliness of spaces', ar: 'نظافة الأماكن' }
            },

            // Éthique
            {
                category: 'Éthique',
                fullText: {
                    fr: 'Interdiction de l\'usurpation : Il est strictement interdit d\'utiliser le nom, le logo ou l\'identité de Touches d\'art à des fins personnelles.',
                    en: 'Prohibition of usurpation: It is strictly forbidden to use the name, logo or identity of Touches d\'art for personal purposes.',
                    ar: 'منع الانتحال: يمنع منعا باتا استخدام اسم أو شعار أو هوية لمسات الفن لأغراض شخصية.'
                },
                shortTextToType: { fr: 'interdiction d usurpation', en: 'prohibition of usurpation', ar: 'منع الانتحال' }
            },
            {
                category: 'Éthique',
                fullText: {
                    fr: 'Utilisation de l\'image : Toute publication représentant officiellement Touches d\'art doit respecter son identité et ses valeurs.',
                    en: 'Use of image: Any publication officially representing Touches d\'art must respect its identity and values.',
                    ar: 'استخدام الصورة: أي منشور يمثل جمعية لمسات الفن رسميا يجب أن يحترم هويتها وقيمها.'
                },
                shortTextToType: { fr: 'respecter son identité', en: 'respect its identity', ar: 'احترام هويتها' }
            },
            {
                category: 'Éthique',
                fullText: {
                    fr: 'Propriété intellectuelle : Les créations et documents réalisés ne peuvent être utilisés sans le respect dû à leurs auteurs.',
                    en: 'Intellectual property: Creations and documents produced cannot be used without due respect to their authors.',
                    ar: 'الملكية الفكرية: لا يجوز استخدام الإبداعات والوثائق المنجزة دون احترام حقوق مؤلفيها.'
                },
                shortTextToType: { fr: 'propriété intellectuelle', en: 'intellectual property', ar: 'الملكية الفكرية' }
            },
            {
                category: 'Éthique',
                fullText: {
                    fr: 'Transparence : Toute information communiquée dans le cadre d\'un projet doit être sincère, vérifiable et de bonne foi.',
                    en: 'Transparency: Any information communicated within the framework of a project must be sincere, verifiable and in good faith.',
                    ar: 'الشفافية: يجب أن تكون أي معلومات يتم توصيلها في إطار المشروع صادقة وقابلة للتحقق وبحسن نية.'
                },
                shortTextToType: { fr: 'sincère et vérifiable', en: 'sincere and verifiable', ar: 'صادقة وقابلة للتحقق' }
            },
            {
                category: 'Éthique',
                fullText: {
                    fr: 'Conflit d\'intérêts : Tout membre doit signaler toute situation dans laquelle ses intérêts personnels influenceraient une décision.',
                    en: 'Conflict of interest: Any member must report any situation in which their personal interests would influence a decision.',
                    ar: 'تضارب المصالح: يجب على أي عضو الإبلاغ عن أي حالة تؤثر فيها مصالحه الشخصية على أي قرار.'
                },
                shortTextToType: { fr: 'signaler toute situation', en: 'report any situation', ar: 'الإبلاغ عن أية حالة' }
            },
            {
                category: 'Éthique',
                fullText: {
                    fr: 'Communication officielle : Seules les personnes dûment autorisées peuvent s\'exprimer officiellement au nom de Touches d\'art.',
                    en: 'Official communication: Only duly authorized persons may speak officially on behalf of Touches d\'art.',
                    ar: 'التواصل الرسمي: يُسمح فقط للأشخاص المخولين حسب الأصول بالتحدث رسميًا باسم لمسات الفن.'
                },
                shortTextToType: { fr: 'personnes autorisées', en: 'authorized persons', ar: 'الأشخاص المخولين' }
            },

            // Responsabilités des membres
            {
                category: 'Responsabilités des membres',
                fullText: {
                    fr: 'Initiative : Les membres sont encouragés à proposer de nouvelles idées, projets et solutions.',
                    en: 'Initiative: Members are encouraged to propose new ideas, projects and solutions.',
                    ar: 'المبادرة: يُشجع الأعضاء على اقتراح أفكار ومشاريع وحلول جديدة.'
                },
                shortTextToType: { fr: 'proposer de nouvelles idées', en: 'propose new ideas', ar: 'اقتراح أفكار جديدة' }
            },
            {
                category: 'Responsabilités des membres',
                fullText: {
                    fr: 'Partage des compétences : Chaque membre est invité à transmettre ses connaissances et à accompagner la progression des autres.',
                    en: 'Sharing of skills: Each member is invited to pass on their knowledge and support the progress of others.',
                    ar: 'مشاركة المهارات: يُدعى كل عضو لنقل معرفته ودعم تقدم الآخرين.'
                },
                shortTextToType: { fr: 'transmettre ses connaissances', en: 'pass on knowledge', ar: 'نقل المعرفة' }
            },
            {
                category: 'Responsabilités des membres',
                fullText: {
                    fr: 'Reconnaissance des erreurs : Toute erreur ou difficulté rencontrée doit être signalée rapidement pour résolution.',
                    en: 'Acknowledgment of errors: Any error or difficulty encountered must be reported quickly for resolution.',
                    ar: 'الاعتراف بالأخطاء: يجب الإبلاغ عن أي خطأ أو صعوبة تتم مواجهتها بسرعة لحلها.'
                },
                shortTextToType: { fr: 'signalée rapidement', en: 'reported quickly', ar: 'الإبلاغ بسرعة' }
            },
            {
                category: 'Responsabilités des membres',
                fullText: {
                    fr: 'Respect des décisions : Une fois prise par les instances compétentes, toute décision doit être respectée par chaque membre.',
                    en: 'Respect for decisions: Once taken by the competent authorities, any decision must be respected by each member.',
                    ar: 'احترام القرارات: بمجرد اتخاذها من قبل السلطات المختصة، يجب على كل عضو احترام أي قرار.'
                },
                shortTextToType: { fr: 'décision doit être respectée', en: 'decision must be respected', ar: 'يجب احترام القرار' }
            },
            {
                category: 'Responsabilités des membres',
                fullText: {
                    fr: 'Esprit d\'équipe : La compétition personnelle et les rivalités internes sont incompatibles avec les valeurs de Touches d\'art.',
                    en: 'Team spirit: Personal competition and internal rivalries are incompatible with the values of Touches d\'art.',
                    ar: 'روح الفريق: التنافس الشخصي والخلافات الداخلية تتنافى مع قيم لمسات الفن.'
                },
                shortTextToType: { fr: 'rivalités internes incompatibles', en: 'rivalries incompatible', ar: 'الخلافات الداخلية تتنافى' }
            },
            {
                category: 'Responsabilités des membres',
                fullText: {
                    fr: 'Intégration : Les membres déjà intégrés sont invités à faciliter l\'intégration des nouveaux arrivants.',
                    en: 'Integration: Already integrated members are invited to facilitate the integration of newcomers.',
                    ar: 'الاندماج: يُدعى الأعضاء المندمجون بالفعل إلى تسهيل اندماج الأعضاء الجدد.'
                },
                shortTextToType: { fr: 'faciliter l intégration', en: 'facilitate integration', ar: 'تسهيل الاندماج' }
            },
            {
                category: 'Responsabilités des membres',
                fullText: {
                    fr: 'Diversité : Touches d\'art accueille des jeunes de parcours variés. Cette diversité constitue une richesse pour l\'association.',
                    en: 'Diversity: Touches d\'art welcomes young people from varied backgrounds. This diversity is an asset.',
                    ar: 'التنوع: ترحب لمسات الفن بالشباب من خلفيات متنوعة. هذا التنوع يمثل ثروة.'
                },
                shortTextToType: { fr: 'diversité constitue une richesse', en: 'diversity is an asset', ar: 'التنوع يمثل ثروة' }
            }
        ];

        const questionsToInsert = [
            {
                questionText: { 
                    ar: 'ما هي طبيعة القوى العاملة أو الأعضاء الذين تستهدفهم جمعية "لمسات الفن"؟', 
                    fr: 'Qui est principalement accueilli par l\'association "Touches d\'Art" ?', 
                    en: 'Who is primarily welcomed by the "Touches d\'Art" association?' 
                },
                options: [
                    { text: { ar: 'الشباب المبدعون ذوو المواهب المختلفة', fr: 'De jeunes créatifs aux talents variés', en: 'Young creatives with varied talents' }, isCorrect: true },
                    { text: { ar: 'الأطفال في سن ما قبل المدرسة فقط', fr: 'Des enfants en âge préscolaire uniquement', en: 'Preschool children only' }, isCorrect: false },
                    { text: { ar: 'الرياضيون المحترفون فقط', fr: 'Des athlètes professionnels uniquement', en: 'Professional athletes only' }, isCorrect: false }
                ]
            },
            {
                questionText: { 
                    ar: 'أي من الأهداف التالية ينتمي لأهداف الجمعية الأساسية؟', 
                    fr: 'Lequel de ces éléments figure parmi les objectifs de l\'association ?', 
                    en: 'Which of the following is among the objectives of the association?' 
                },
                options: [
                    { text: { ar: 'دعم السياحة الداخلية والترويج للمعالم التاريخية', fr: 'Soutenir le tourisme intérieur et les monuments historiques', en: 'Supporting domestic tourism and historical monuments' }, isCorrect: true },
                    { text: { ar: 'المشاركة في مسابقات تكنولوجية دولية', fr: 'Participer à des compétitions technologiques internationales', en: 'Participating in international technological competitions' }, isCorrect: false },
                    { text: { ar: 'تنظيم بطولات رياضية كبرى', fr: 'Organiser de grands tournois sportifs', en: 'Organizing major sports tournaments' }, isCorrect: false }
                ]
            },
            {
                questionText: { 
                    ar: 'ما الهدف من المجال الاجتماعي والتربوي بالجمعية؟', 
                    fr: 'Dans quel but l\'association a-t-elle créé le Domaine Social & Éducatif ?', 
                    en: 'For what purpose did the association create the Social & Educational Field?' 
                },
                options: [
                    { text: { ar: 'لزيادة مبيعات المنتجات الفنية', fr: 'Pour vendre des produits', en: 'To sell art products' }, isCorrect: false },
                    { text: { ar: 'لتعزيز التعلم الجماعي ومشاركة المهارات والمعرفة', fr: 'Favoriser l\'apprentissage collectif et le partage de savoir-faire', en: 'Promote collective learning and know-how sharing' }, isCorrect: true },
                    { text: { ar: 'لتوفير منح دراسية حكومية', fr: 'Pour fournir des bourses d\'études', en: 'To provide government scholarships' }, isCorrect: false }
                ]
            },
            {
                questionText: { 
                    ar: 'وفقاً لمجال النشاط الترفيهي، ماذا تفعل الجمعية للجمهور؟', 
                    fr: 'Que propose le Domaine Récréatif au grand public ?', 
                    en: 'What does the Recreational Field offer to the general public?' 
                },
                options: [
                    { text: { ar: 'تفتح أبوابها للجمهور عبر أنشطة متنوعة ورحلات ترفيهية', fr: 'Il ouvre ses portes au public via diverses activités et sorties', en: 'Opens doors to the public through various activities and outings' }, isCorrect: true },
                    { text: { ar: 'إخفاء الأنشطة وجعلها حصرية للأعضاء دائمًا', fr: 'Des sorties strictement réservées aux membres du bureau', en: 'Events strictly reserved for board members' }, isCorrect: false },
                    { text: { ar: 'لا يوجد أي نشاط للجمهور العام', fr: 'Absolument rien pour le public', en: 'Absolutely nothing for the public' }, isCorrect: false }
                ]
            },
            {
                questionText: { 
                    ar: 'أي من الأنشطة التالية ذُكر ضمن مواهب أعضاء "لمسات الفن"؟', 
                    fr: 'Lequel de ces talents est cité dans la présentation de "Touches d\'Art" ?', 
                    en: 'Which of these talents is mentioned in the presentation of "Touches d\'Art"?' 
                },
                options: [
                    { text: { ar: 'تطوير ألعاب الفيديو الاستراتيجية', fr: 'Le développement de jeux vidéo tactiques', en: 'The development of tactical video games' }, isCorrect: false },
                    { text: { ar: 'تنظيم الفعاليات والصحافة والرسم والغناء', fr: 'L\'organisation d\'événements, le journalisme, la peinture et le chant', en: 'Event organization, journalism, painting and singing' }, isCorrect: true },
                    { text: { ar: 'سباق السيارات والتزلج', fr: 'La course automobile', en: 'Car racing' }, isCorrect: false }
                ]
            },
            {
                questionText: { 
                    ar: 'ما هي إحدى القيم المذكورة التي تحرص الجمعية على ترسيخها؟', 
                    fr: 'Selon les objectifs, quelle valeur l\'association souhaite-t-elle ancrer chez les jeunes ?', 
                    en: 'According to the objectives, what value does the association wish to anchor among youth?' 
                },
                options: [
                    { text: { ar: 'قيمة التطوع وروح المبادرة', fr: 'Les valeurs du bénévolat et de l\'esprit d\'initiative', en: 'The values of volunteering and initiative' }, isCorrect: true },
                    { text: { ar: 'روح المنافسة التجارية', fr: 'L\'esprit de compétition commerciale', en: 'The spirit of commercial competition' }, isCorrect: false }
                ]
            }
        ];

        await Rule.insertMany(rulesToInsert);
        await QuizQuestion.insertMany(questionsToInsert);

        return NextResponse.json({ 
            success: true, 
            message: `Base de données ré-initialisée et remplie avec ${rulesToInsert.length} nouvelles règles et ${questionsToInsert.length} questions avec succès !` 
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
