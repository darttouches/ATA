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
            {
                category: 'الانضباط والسلوك',
                fullText: {
                    ar: 'احترام جميع الأعضاء دون تمييز.',
                    fr: 'Respecter tous les membres sans distinction.',
                    en: 'Respect all members without discrimination.'
                },
                shortTextToType: { ar: 'احترام جميع الأعضاء', fr: 'respecter tous les membres', en: 'respect all members' }
            },
            {
                category: 'الانضباط والسلوك',
                fullText: {
                    ar: 'الالتزام بالأخلاق الحميدة وحسن التعامل.',
                    fr: 'Engagement envers les bonnes mœurs et le bon comportement.',
                    en: 'Commitment to good morals and proper behavior.'
                },
                shortTextToType: { ar: 'الالتزام بالأخلاق الحميدة', fr: 'bon comportement', en: 'good morals' }
            },
            {
                category: 'الانضباط والسلوك',
                fullText: {
                    ar: 'منع العنف اللفظي أو الجسدي أو أي شكل من أشكال التحرش.',
                    fr: 'Prévention de la violence verbale ou physique et de toute forme de harcèlement.',
                    en: 'Prevention of verbal or physical violence and any form of harassment.'
                },
                shortTextToType: { ar: 'منع العنف اللفظي أو الجسدي', fr: 'aucune violence verbale ou physique', en: 'no violence allowed' }
            },
            {
                category: 'الانضباط والسلوك',
                fullText: {
                    ar: 'الالتزام بالمواعيد في الاجتماعات والأنشطة.',
                    fr: 'Respect strict des horaires lors des réunions et des activités.',
                    en: 'Strict adherence to schedules during meetings and activities.'
                },
                shortTextToType: { ar: 'الالتزام بالمواعيد', fr: 'respect des horaires', en: 'be on time' }
            },
            {
                category: 'الانضباط والسلوك',
                fullText: {
                    ar: 'الحفاظ على سرية المعلومات الداخلية للجمعية.',
                    fr: 'Maintenir la confidentialité absolue des informations internes de l\'association.',
                    en: 'Maintain absolute confidentiality of internal association information.'
                },
                shortTextToType: { ar: 'الحفاظ على سرية المعلومات', fr: 'confidentialite', en: 'confidentiality' }
            },
            {
                category: 'الاجتماعات',
                fullText: {
                    ar: 'إعلام المسؤول في حالة الغياب عن الاجتماعات.',
                    fr: 'Il est obligatoire de prévenir le responsable en cas d\'absence.',
                    en: 'It is mandatory to notify the person in charge in case of absence.'
                },
                shortTextToType: { ar: 'إعلام المسؤول في حالة الغياب', fr: 'prevenir en cas d absence', en: 'notify in case of absence' }
            },
            {
                category: 'الاجتماعات',
                fullText: {
                    ar: 'احترام جدول الأعمال وعدم مقاطعة المتحدثين.',
                    fr: 'Respecter l\'ordre du jour et ne pas interrompre les intervenants.',
                    en: 'Respect the agenda and do not interrupt the speakers.'
                },
                shortTextToType: { ar: 'عدم مقاطعة المتحدثين', fr: 'ne pas interrompre', en: 'do not interrupt' }
            },
            {
                category: 'الأنشطة',
                fullText: {
                    ar: 'المحافظة على تجهيزات الجمعية أثناء الأنشطة.',
                    fr: 'Protéger et prendre soin des équipements de l\'association pendant les activités.',
                    en: 'Protect and take care of the association\'s equipment during activities.'
                },
                shortTextToType: { ar: 'المحافظة على تجهيزات الجمعية', fr: 'proteger les equipements', en: 'protect equipment' }
            },
            {
                category: 'الالتزام بالاحترام الاخلاقي',
                fullText: {
                    ar: 'يمنع استعمال بطاقات انخراط قديمة داخل النشاط لاي سبب كان.',
                    fr: 'Il est interdit d\'utiliser d\'anciennes cartes d\'adhésion pour quelque raison que ce soit.',
                    en: 'Using old membership cards is strictly prohibited for any reason.'
                },
                shortTextToType: { ar: 'يمنع استعمال بطاقات انخراط قديمة', fr: 'anciennes cartes interdites', en: 'old cards prohibited' }
            },
            {
                category: 'الالتزام بالاحترام الاخلاقي',
                fullText: {
                    ar: 'يمنع منح بطاقات الانخراط الخاصة للغير.',
                    fr: 'Il est strictement interdit de prêter ou donner sa carte d\'adhésion à une autre personne.',
                    en: 'It is strictly forbidden to lend or give your membership card to another person.'
                },
                shortTextToType: { ar: 'يمنع منح بطاقات الانخراط للغير', fr: 'interdit de preter sa carte', en: 'do not lend membership card' }
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
