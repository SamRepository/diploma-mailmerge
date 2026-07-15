// Content for the /help user guide, in English and Arabic.
//
// Why a typed module rather than two markdown/MDX files: `HelpSection` requires BOTH `en` and
// `ar`, so a missing translation is a build error instead of a page that silently drifts out of
// sync. The table of contents is derived from this array, so anchors cannot rot either.
//
// Inline content is a typed array, never a mini-markup string. A `[[chip]]`-style syntax would
// need a parser, escaping rules, and — the reason that settles it — it would make bidi isolation
// of the embedded English UI labels impossible to get right inside an Arabic paragraph.
//
// The `Block` union is deliberately CLOSED at five kinds. No tables, no nesting, no bold. A
// section that seems to need a table should be rewritten as bullets. That restraint is what keeps
// this a content file instead of a CMS.

export type Lang = "en" | "ar";

export type Inline =
  | string
  | { chip: string } // a literal UI label, e.g. "+ Add student" — rendered LTR even in Arabic
  | { kbd: string } // a keyboard key, e.g. "Del"
  | { link: { href: string; label: string } };

export type Block =
  | { kind: "para"; text: Inline[] }
  | { kind: "steps"; items: Inline[][] }
  | { kind: "bullets"; items: Inline[][] }
  | { kind: "note"; text: Inline[] }
  | { kind: "warning"; text: Inline[] };

export type HelpSection = {
  /** The anchor. Lives outside `en`/`ar` so one /help#id link works in both languages. */
  id: string;
  adminOnly?: boolean;
  en: { title: string; blocks: Block[] };
  ar: { title: string; blocks: Block[] };
};

/** Authoring shorthand. `chip("+ Add student")` reads better than the object literal. */
const c = (s: string): Inline => ({ chip: s });
const k = (s: string): Inline => ({ kbd: s });
const a = (href: string, label: string): Inline => ({ link: { href, label } });

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: "getting-started",
    en: {
      title: "Getting started",
      blocks: [
        {
          kind: "para",
          text: [
            "This app prints the variable data of a PhD diploma — the graduate's name, speciality, dates — onto the blank pre-printed paper supplied by the ministry. The border, the fixed labels, the signatures and the serial number are already on that paper. The app only adds what changes from one graduate to the next.",
          ],
        },
        {
          kind: "para",
          text: [
            "Because of that, a normal print puts data on a transparent background. The screen shows a scan of the blank behind the data so you can check placement, but that scan is never printed onto the real diploma.",
          ],
        },
        {
          kind: "steps",
          items: [
            ["Sign in with your email and password. Accounts are created by an administrator — there is no self sign-up."],
            ["You land on the ", c("Dashboard"), ", which counts your students and shows how many are still waiting to be printed."],
            ["Add students one at a time, or ", a("#import", "import them from the ministry Excel export"), "."],
            ["Before your first real print, ", a("#calibration-grid", "check your printer with the calibration grid"), " and ", a("#print-single", "set the alignment offset"), ". Do this once per printer."],
          ],
        },
        {
          kind: "bullets",
          items: [
            [c("Staff"), " can manage students, import from Excel, preview, print, and export PDFs."],
            [
              c("Admin"),
              " can do all of that, plus manage templates, calibrate field positions, and create user accounts. Topics below that need an admin account are marked accordingly.",
            ],
          ],
        },
        {
          kind: "note",
          text: [
            "Your name and role are shown at the top right of every screen. If a menu item mentioned here is missing, you are signed in as staff rather than admin.",
          ],
        },
      ],
    },
    ar: {
      title: "البداية",
      blocks: [
        {
          kind: "para",
          text: [
            "يطبع هذا التطبيق البيانات المتغيّرة لشهادة الدكتوراه — اسم الخرّيج والتخصّص والتواريخ — على الورق المطبوع مسبقًا الذي توفّره الوزارة. أمّا الإطار والعناوين الثابتة والتوقيعات والرقم التسلسلي فهي مطبوعة على تلك الورقة أصلًا. لا يضيف التطبيق إلّا ما يتغيّر من خرّيج إلى آخر.",
          ],
        },
        {
          kind: "para",
          text: [
            "لهذا السبب تُطبع البيانات على خلفية شفّافة. تعرض الشاشة نسخة ممسوحة ضوئيًا من الورقة البيضاء خلف البيانات حتى تتمكّن من التحقّق من المواضع، لكن هذه النسخة لا تُطبع أبدًا على الشهادة الحقيقية.",
          ],
        },
        {
          kind: "steps",
          items: [
            ["سجّل الدخول بالبريد الإلكتروني وكلمة المرور. يُنشئ المشرف الحسابات — لا يوجد تسجيل ذاتي."],
            ["تصل إلى ", c("Dashboard"), "، التي تُحصي الطلبة وتعرض عدد المنتظرين للطباعة."],
            ["أضف الطلبة واحدًا تلو الآخر، أو ", a("#import", "استوردهم من ملف Excel الوزاري"), "."],
            [
              "قبل أوّل طباعة حقيقية، ",
              a("#calibration-grid", "تحقّق من طابعتك بشبكة المعايرة"),
              " ثم ",
              a("#print-single", "اضبط إزاحة المحاذاة"),
              ". يكفي فعل ذلك مرّة واحدة لكل طابعة.",
            ],
          ],
        },
        {
          kind: "bullets",
          items: [
            [c("Staff"), " (الموظّف) يمكنه إدارة الطلبة، والاستيراد من Excel، والمعاينة، والطباعة، وتصدير ملفات PDF."],
            [
              c("Admin"),
              " (المشرف) يمكنه ذلك كلّه، إضافةً إلى إدارة القوالب، ومعايرة مواضع الحقول، وإنشاء حسابات المستخدمين. المواضيع أدناه التي تتطلّب حساب مشرف معلَّمة بذلك.",
            ],
          ],
        },
        {
          kind: "note",
          text: [
            "يظهر اسمك ودورك في أعلى يمين كل شاشة. إذا لم تجد عنصرًا من القائمة مذكورًا هنا، فأنت مسجَّل الدخول كموظّف لا كمشرف.",
          ],
        },
      ],
    },
  },

  {
    id: "students",
    en: {
      title: "Managing students",
      blocks: [
        {
          kind: "para",
          text: [
            "The ",
            c("Students"),
            " page lists everyone in the database, newest first. Use the search box to match a name, serial number or speciality, and the status menu to show only ",
            c("Pending"),
            " or ",
            c("Printed"),
            " records. Press ",
            c("Filter"),
            " to apply, or ",
            c("Clear"),
            " to go back to the full list.",
          ],
        },
        {
          kind: "para",
          text: [
            "Each row has three actions: ",
            c("Diploma"),
            " opens the print preview for that student, ",
            c("Edit"),
            " opens their record, and ",
            c("Delete"),
            " removes them.",
          ],
        },
        {
          kind: "warning",
          text: [
            c("Delete"),
            " acts immediately. There is no confirmation dialog and no undo — one click permanently removes the student. Read the row before you click it.",
          ],
        },
        {
          kind: "para",
          text: [
            "To add someone by hand, click ",
            c("+ Add student"),
            ". The form is grouped into ",
            c("Identity"),
            ", ",
            c("Diploma"),
            " and ",
            c("Issuance"),
            ". Most text fields come in pairs — a Latin one and an Arabic one — because the diploma is bilingual. Fill both, or the corresponding half of the printed diploma stays blank.",
          ],
        },
        {
          kind: "bullets",
          items: [
            [
              "Only ",
              c("Name (Latin)"),
              " is required. Every other field may be left empty, and an empty field simply prints nothing.",
            ],
            [
              "Dates are free text, so you can keep the exact form the ministry sent. They are reformatted to ",
              c("YYYY/MM/DD"),
              " when printed.",
            ],
            [
              c("Serial N° (pre-printed)"),
              " records the number already on the paper. It is stored for your records and is not printed again.",
            ],
          ],
        },
        {
          kind: "note",
          text: [
            "If a date is typed in a form the app cannot recognise, it is printed exactly as you typed it rather than being corrected. If a printed date looks wrong, check what is in the field.",
          ],
        },
        {
          kind: "note",
          text: [
            "The list shows at most 500 students and has no page navigation. Beyond that, use the search box to narrow it down rather than scrolling.",
          ],
        },
      ],
    },
    ar: {
      title: "إدارة الطلبة",
      blocks: [
        {
          kind: "para",
          text: [
            "تعرض صفحة ",
            c("Students"),
            " كل من في قاعدة البيانات، الأحدث أوّلًا. استعمل خانة البحث لمطابقة اسم أو رقم تسلسلي أو تخصّص، وقائمة الحالة لعرض السجلّات ",
            c("Pending"),
            " أو ",
            c("Printed"),
            " فقط. اضغط ",
            c("Filter"),
            " للتطبيق، أو ",
            c("Clear"),
            " للعودة إلى القائمة الكاملة.",
          ],
        },
        {
          kind: "para",
          text: [
            "لكل سطر ثلاثة إجراءات: ",
            c("Diploma"),
            " يفتح معاينة الطباعة لذلك الطالب، و",
            c("Edit"),
            " يفتح سجلّه، و",
            c("Delete"),
            " يحذفه.",
          ],
        },
        {
          kind: "warning",
          text: [
            "ينفَّذ ",
            c("Delete"),
            " فورًا. لا توجد نافذة تأكيد ولا تراجع — نقرة واحدة تحذف الطالب نهائيًا. تحقّق من السطر قبل النقر.",
          ],
        },
        {
          kind: "para",
          text: [
            "لإضافة شخص يدويًا، اضغط ",
            c("+ Add student"),
            ". الاستمارة مقسَّمة إلى ",
            c("Identity"),
            " و",
            c("Diploma"),
            " و",
            c("Issuance"),
            ". معظم الحقول النصّية تأتي في أزواج — واحد لاتيني وآخر عربي — لأنّ الشهادة ثنائية اللغة. املأ الاثنين، وإلّا بقي النصف المقابل من الشهادة المطبوعة فارغًا.",
          ],
        },
        {
          kind: "bullets",
          items: [
            ["حقل ", c("Name (Latin)"), " وحده إجباري. يمكن ترك بقيّة الحقول فارغة، والحقل الفارغ لا يطبع شيئًا."],
            [
              "التواريخ نصّ حرّ، فيمكنك الاحتفاظ بالصيغة التي أرسلتها الوزارة تمامًا. تُعاد صياغتها إلى ",
              c("YYYY/MM/DD"),
              " عند الطباعة.",
            ],
            [
              "يسجّل ",
              c("Serial N° (pre-printed)"),
              " الرقم الموجود أصلًا على الورقة. يُحفظ لسجلّاتك ولا يُطبع مرّة أخرى.",
            ],
          ],
        },
        {
          kind: "note",
          text: [
            "إذا كُتب تاريخ بصيغة لا يتعرّف عليها التطبيق، فإنّه يُطبع كما كتبته تمامًا دون تصحيح. إذا بدا تاريخ مطبوع خاطئًا، فتحقّق من محتوى الحقل.",
          ],
        },
        {
          kind: "note",
          text: [
            "تعرض القائمة 500 طالب على الأكثر وليس فيها تنقّل بين الصفحات. تجاوز ذلك يستدعي استعمال خانة البحث لتضييق النتائج بدل التمرير.",
          ],
        },
      ],
    },
  },

  {
    id: "import",
    en: {
      title: "Importing from Excel",
      blocks: [
        {
          kind: "para",
          text: [
            "The ",
            c("Import"),
            " page loads the ministry's Excel export. You point it at the file, tell it which spreadsheet column feeds which diploma field, check the preview, then import.",
          ],
        },
        {
          kind: "steps",
          items: [
            [
              "Choose your ",
              c(".xls"),
              " or ",
              c(".xlsx"),
              " file. There is no upload button — the file is read as soon as you pick it, inside your own browser. Nothing reaches the server yet.",
            ],
            [
              "Only the first sheet is read. Row 1 must be the column headers and everything below it is data; blank rows are ignored. You should see a line confirming how many data rows were loaded.",
            ],
            [
              "Check ",
              c("Map columns"),
              ". The app matches the ministry's headers on its own, and highlights anything it guessed in amber. Amber means “review this”, not “this is wrong”.",
            ],
            [
              "Correct anything that is off using the dropdowns. Choosing a column yourself clears the amber. A field left at ",
              c("— not mapped —"),
              " is simply left blank on the diploma.",
            ],
            [
              "Read ",
              c("Preview (first N)"),
              ". It shows up to five rows exactly as they will be stored, and updates live as you change the mapping.",
            ],
            ["Choose how to apply the rows, then click the import button."],
          ],
        },
        {
          kind: "note",
          text: [
            "Each spreadsheet column can only feed one field. The ministry's headers overlap heavily — one header is often contained inside another — so the app gives each column to the first field that claims it and hides it from the rest. If a field looks unexpectedly unmapped, another field above it probably took that column.",
          ],
        },
        {
          kind: "note",
          text: [
            "Before importing you choose how the rows are applied. ",
            c("Update existing students"),
            " matches each row to a student by Name (Latin) and edits it in place — this is the one to use when the ministry re-sends the cohort with a few cells corrected. ",
            c("Add all as new students"),
            " creates a record for every row; on a re-export that gives you every student twice.",
          ],
        },
        {
          kind: "warning",
          text: [
            "An update only writes the columns the file actually carries. A blank cell, or a field no column is mapped to, keeps the value already stored — this is what protects the pre-printed serial N° and anything entered by hand. To clear a field, edit the student directly instead.",
          ],
        },
        {
          kind: "bullets",
          items: [
            [
              c("Name (Latin)"),
              " must be mapped. The import refuses to run without it, because it is the one required field on a student and the key an update matches on.",
            ],
            [
              "Matching ignores case and extra spaces. If the same Latin name belongs to two students, the app cannot tell them apart: it skips that row and names it in the result line so you can make the correction by hand.",
            ],
            [
              "Rows with no Latin name are skipped rather than treated as an error. The result line tells you how many, so a larger-than-expected “skipped” count means the mapping was wrong.",
            ],
          ],
        },
      ],
    },
    ar: {
      title: "الاستيراد من Excel",
      blocks: [
        {
          kind: "para",
          text: [
            "تُحمّل صفحة ",
            c("Import"),
            " ملف Excel الوزاري. تختار الملف، وتحدّد أيّ عمود يغذّي أيّ حقل في الشهادة، وتتحقّق من المعاينة، ثم تستورد.",
          ],
        },
        {
          kind: "steps",
          items: [
            [
              "اختر ملف ",
              c(".xls"),
              " أو ",
              c(".xlsx"),
              ". لا يوجد زرّ رفع — يُقرأ الملف بمجرّد اختياره، داخل متصفّحك أنت. لا يصل شيء إلى الخادم بعد.",
            ],
            [
              "تُقرأ الورقة الأولى فقط. يجب أن يكون السطر 1 عناوين الأعمدة وما تحته بيانات؛ وتُتجاهل الأسطر الفارغة. سترى سطرًا يؤكّد عدد أسطر البيانات المحمَّلة.",
            ],
            [
              "تحقّق من ",
              c("Map columns"),
              ". يطابق التطبيق العناوين الوزارية تلقائيًا، ويميّز ما خمّنه باللون الكهرماني. الكهرماني يعني «راجع هذا»، لا «هذا خطأ».",
            ],
            [
              "صحّح ما هو غير صحيح بالقوائم المنسدلة. اختيارك للعمود بنفسك يزيل اللون الكهرماني. الحقل المتروك على ",
              c("— not mapped —"),
              " يبقى فارغًا على الشهادة.",
            ],
            [
              "اقرأ ",
              c("Preview (first N)"),
              ". تعرض خمسة أسطر على الأكثر كما ستُحفظ تمامًا، وتتحدّث مباشرةً كلّما غيّرت الربط.",
            ],
            ["اضغط زرّ الاستيراد."],
          ],
        },
        {
          kind: "note",
          text: [
            "كل عمود في الجدول يغذّي حقلًا واحدًا فقط. تتداخل العناوين الوزارية كثيرًا — إذ يرد عنوان داخل عنوان آخر غالبًا — لذا يمنح التطبيق كل عمود لأوّل حقل يطالب به ويخفيه عن البقيّة. إذا بدا حقل غير مربوط على غير المتوقّع، فالأرجح أنّ حقلًا قبله أخذ ذلك العمود.",
          ],
        },
        {
          kind: "note",
          text: [
            "قبل الاستيراد تختار كيفيّة تطبيق الأسطر. ",
            c("Update existing students"),
            " يطابق كل سطر بطالب موجود عبر الاسم اللاتيني ويعدّله في مكانه — وهو الخيار المناسب حين ترسل الوزارة الدفعة نفسها مع تصحيح بعض الخانات. ",
            c("Add all as new students"),
            " ينشئ سجلًّا لكل سطر، وهو ما يمنحك كل طالب مرّتين إذا كان الملف إعادة إرسال.",
          ],
        },
        {
          kind: "warning",
          text: [
            "التحديث يكتب الأعمدة التي يحملها الملف فعلًا فقط. الخانة الفارغة، أو الحقل الذي لا يقابله عمود مربوط، يحتفظ بقيمته المحفوظة — وهذا ما يحمي الرقم التسلسلي N° المطبوع مسبقًا وكلّ ما أُدخل يدويًا. ولمسح حقل، عدّل الطالب مباشرةً بدل ذلك.",
          ],
        },
        {
          kind: "bullets",
          items: [
            [
              "يجب ربط ",
              c("Name (Latin)"),
              ". يرفض الاستيراد العمل بدونه، لأنّه الحقل الإجباري الوحيد في سجلّ الطالب والمفتاح الذي يطابق عليه التحديث.",
            ],
            [
              "لا تؤثّر حالة الأحرف ولا المسافات الزائدة في المطابقة. وإذا كان الاسم اللاتيني نفسه لطالبين، فلا يستطيع التطبيق التمييز بينهما: يتخطّى ذلك السطر ويذكره في سطر النتيجة لتصحّحه يدويًا.",
            ],
            [
              "الأسطر بلا اسم لاتيني تُتخطّى ولا تُعدّ خطأً. يخبرك سطر النتيجة بعددها، فعدد «متخطّى» أكبر من المتوقّع يعني أنّ الربط كان خاطئًا.",
            ],
          ],
        },
      ],
    },
  },

  {
    id: "print-single",
    en: {
      title: "Printing one diploma",
      blocks: [
        {
          kind: "para",
          text: [
            "From the students list, ",
            c("Diploma"),
            " opens the print preview: the student's data laid over a scan of the blank, so you can check every position before committing a real diploma to the printer. Zoom in to inspect, and untick ",
            c("Show template"),
            " to see the data on its own — that is exactly what the printer will put on the paper.",
          ],
        },
        {
          kind: "para",
          text: [
            "No printer places paper perfectly, so the whole layout can be shifted with ",
            c("Alignment offset (mm)"),
            ". Type a value, or use the arrows to nudge by half a millimetre at a time. ",
            c("Reset"),
            " returns to zero. Positive X moves right, positive Y moves down.",
          ],
        },
        {
          kind: "note",
          text: [
            "The offset is saved in this browser, for this template — not in the database. It follows the printer you are sitting at, which is what you want, but it also means a colleague on another computer starts at zero, and clearing your browser data resets it.",
          ],
        },
        {
          kind: "bullets",
          items: [
            [
              c("🖨 Print onto diploma (data only)"),
              " — the real print. The scanned background is dropped and only the data goes onto the pre-printed paper. This is the one you use for an actual diploma.",
            ],
            [
              c("🧪 Test print (with background)"),
              " — the same layout with the background included, on plain paper. Hold it against a real diploma to check the alignment without risking one.",
            ],
            [
              c("⬇ Export PDF (complete diploma)"),
              " — a PDF that always includes the background, for archiving or sending. Not for printing onto blank ministry paper.",
            ],
          ],
        },
        {
          kind: "warning",
          text: [
            "In the print dialog choose ",
            c("Actual size"),
            " or ",
            c("100%"),
            " — never “Fit to page” — and set margins to ",
            c("None"),
            ". Any scaling silently shrinks the layout and every field lands in the wrong place, no matter how carefully you set the offset.",
          ],
        },
        {
          kind: "para",
          text: [
            "Once the paper comes out correctly, click ",
            c("✓ Mark as printed"),
            " so the student drops off the pending list. You can set it back to pending if a sheet has to be redone.",
          ],
        },
      ],
    },
    ar: {
      title: "طباعة شهادة واحدة",
      blocks: [
        {
          kind: "para",
          text: [
            "من قائمة الطلبة، يفتح ",
            c("Diploma"),
            " معاينة الطباعة: بيانات الطالب فوق نسخة ممسوحة من الورقة البيضاء، لتتحقّق من كل موضع قبل المخاطرة بشهادة حقيقية. كبّر للفحص، وأزل علامة ",
            c("Show template"),
            " لرؤية البيانات وحدها — وهو ما ستضعه الطابعة على الورق بالضبط.",
          ],
        },
        {
          kind: "para",
          text: [
            "لا توجد طابعة تضع الورق بدقّة تامّة، لذا يمكن إزاحة التصميم كلّه بـ",
            c("Alignment offset (mm)"),
            ". اكتب قيمة، أو استعمل الأسهم للتحريك بنصف مليمتر في كل مرّة. يعيد ",
            c("Reset"),
            " القيمة إلى الصفر. قيمة X الموجبة تحرّك يمينًا، وY الموجبة تحرّك أسفل.",
          ],
        },
        {
          kind: "note",
          text: [
            "تُحفظ الإزاحة في هذا المتصفّح ولهذا القالب — لا في قاعدة البيانات. فهي تتبع الطابعة التي تجلس أمامها، وهو المطلوب، لكن هذا يعني أيضًا أنّ زميلًا على حاسوب آخر يبدأ من الصفر، وأنّ مسح بيانات المتصفّح يعيدها إلى الصفر.",
          ],
        },
        {
          kind: "bullets",
          items: [
            [
              c("🖨 Print onto diploma (data only)"),
              " — الطباعة الحقيقية. تُحذف الخلفية الممسوحة وتذهب البيانات وحدها على الورق المطبوع مسبقًا. هذا ما تستعمله للشهادة الفعلية.",
            ],
            [
              c("🧪 Test print (with background)"),
              " — التصميم نفسه مع الخلفية، على ورق عادي. ضعه فوق شهادة حقيقية للتحقّق من المحاذاة دون المخاطرة بواحدة.",
            ],
            [
              c("⬇ Export PDF (complete diploma)"),
              " — ملف PDF يتضمّن الخلفية دائمًا، للأرشفة أو الإرسال. ليس للطباعة على ورق الوزارة الأبيض.",
            ],
          ],
        },
        {
          kind: "warning",
          text: [
            "في نافذة الطباعة اختر ",
            c("Actual size"),
            " أو ",
            c("100%"),
            " — لا «ملاءمة الصفحة» أبدًا — واضبط الهوامش على ",
            c("None"),
            ". أيّ تحجيم يصغّر التصميم بصمت فتقع كل الحقول في غير موضعها، مهما ضبطت الإزاحة بعناية.",
          ],
        },
        {
          kind: "para",
          text: [
            "متى خرجت الورقة صحيحة، اضغط ",
            c("✓ Mark as printed"),
            " ليخرج الطالب من قائمة الانتظار. ويمكنك إعادته إلى الانتظار إن لزم إعادة طباعة ورقة.",
          ],
        },
      ],
    },
  },

  {
    id: "print-batch",
    en: {
      title: "Bulk printing",
      blocks: [
        {
          kind: "para",
          text: [
            c("Bulk print"),
            " turns many students into one merged PDF — one A4 landscape page each — which you then print from your PDF reader. Pending students are listed first.",
          ],
        },
        {
          kind: "steps",
          items: [
            [
              "Tick the students you want, or use ",
              c("Select pending"),
              " to take everyone not yet printed. ",
              c("Select all"),
              " and ",
              c("Clear"),
              " do what they say.",
            ],
            [
              "Leave ",
              c("With background"),
              " unticked to print onto real pre-printed diplomas. Tick it only for complete archival copies on plain paper.",
            ],
            ["Click ", c("Export merged PDF"), ". The finished PDF opens in a new tab."],
            [
              "Print that PDF at ",
              c("Actual size"),
              " with margins ",
              c("None"),
              ", then come back and click ",
              c("Mark printed"),
              " for the same selection.",
            ],
          ],
        },
        {
          kind: "warning",
          text: [
            "This page has no offset controls — it only displays the offset next to the buttons, and applies it to every page in the export. The offset comes from a single student's diploma screen. If the readout is not the value you want, ",
            a("#print-single", "open any student's diploma, set the offset there"),
            ", then come back.",
          ],
        },
        {
          kind: "note",
          text: [
            "There is no direct browser printing here — bulk always goes through the exported PDF. Marking as printed is a separate step from exporting, so an export that goes wrong does not wrongly clear your pending list.",
          ],
        },
      ],
    },
    ar: {
      title: "الطباعة بالجملة",
      blocks: [
        {
          kind: "para",
          text: [
            "تحوّل صفحة ",
            c("Bulk print"),
            " عدّة طلبة إلى ملف PDF واحد مدمج — صفحة A4 أفقية لكل طالب — تطبعه بعدها من قارئ PDF. يُعرض الطلبة المنتظرون أوّلًا.",
          ],
        },
        {
          kind: "steps",
          items: [
            [
              "علّم الطلبة المطلوبين، أو استعمل ",
              c("Select pending"),
              " لأخذ كل من لم تُطبع شهادته بعد. أمّا ",
              c("Select all"),
              " و",
              c("Clear"),
              " فيفعلان ما يدلّ عليه اسمهما.",
            ],
            [
              "اترك ",
              c("With background"),
              " بلا علامة للطباعة على الشهادات المطبوعة مسبقًا الحقيقية. علّمه فقط للنسخ الأرشيفية الكاملة على ورق عادي.",
            ],
            ["اضغط ", c("Export merged PDF"), ". يُفتح الملف الجاهز في لسان جديد."],
            [
              "اطبع ذلك الملف بـ",
              c("Actual size"),
              " وهوامش ",
              c("None"),
              "، ثم عُد واضغط ",
              c("Mark printed"),
              " للتحديد نفسه.",
            ],
          ],
        },
        {
          kind: "warning",
          text: [
            "لا توجد في هذه الصفحة أدوات لضبط الإزاحة — إنّما تعرضها بجانب الأزرار فقط، وتطبّقها على كل صفحة في التصدير. تأتي الإزاحة من شاشة شهادة طالب واحد. إذا لم تكن القيمة المعروضة هي المطلوبة، ",
            a("#print-single", "افتح شهادة أيّ طالب واضبط الإزاحة هناك"),
            "، ثم عُد.",
          ],
        },
        {
          kind: "note",
          text: [
            "لا توجد هنا طباعة مباشرة من المتصفّح — تمرّ الطباعة بالجملة عبر ملف PDF المصدَّر دائمًا. والتعليم كمطبوع خطوة منفصلة عن التصدير، حتى لا يُفرغ تصديرٌ فاشل قائمة الانتظار خطأً.",
          ],
        },
      ],
    },
  },

  {
    id: "calibration-grid",
    en: {
      title: "The calibration grid",
      blocks: [
        {
          kind: "para",
          text: [
            "Before trusting any offset, prove that your printer prints at true size. The calibration grid is an A4 landscape sheet of 10 mm squares with heavier lines every 50 mm. Admins reach it from ",
            c("🖨 Calibration grid"),
            " on the Templates page; anyone signed in can open ",
            a("/print/calibration", "the grid page"),
            " directly.",
          ],
        },
        {
          kind: "steps",
          items: [
            [
              "Print the grid on plain A4 at ",
              c("Actual size"),
              " / ",
              c("100%"),
              ", margins ",
              c("None"),
              ".",
            ],
            ["Measure one of the large squares with a ruler. It must be exactly 50 mm."],
            [
              "Lay a real blank diploma over the printed grid, line up a corner, and read off how far the printing sits from where it should be. Those two numbers, in millimetres, are your ",
              a("#print-single", "alignment offset"),
              ".",
            ],
          ],
        },
        {
          kind: "warning",
          text: [
            "If the square does not measure 50 mm, stop — that is a scaling problem, not an alignment one, and no offset can fix it. Reprint with scaling turned off until the square measures true. An offset applied on top of a scaled print will look right in one corner and drift further out across the page.",
          ],
        },
      ],
    },
    ar: {
      title: "شبكة المعايرة",
      blocks: [
        {
          kind: "para",
          text: [
            "قبل الوثوق بأيّ إزاحة، تأكّد أنّ طابعتك تطبع بالحجم الحقيقي. شبكة المعايرة ورقة A4 أفقية من مربّعات 10 مم بخطوط أثقل كل 50 مم. يصل إليها المشرفون من ",
            c("🖨 Calibration grid"),
            " في صفحة القوالب؛ ويمكن لأيّ مسجَّل الدخول فتح ",
            a("/print/calibration", "صفحة الشبكة"),
            " مباشرةً.",
          ],
        },
        {
          kind: "steps",
          items: [
            [
              "اطبع الشبكة على ورق A4 عادي بـ",
              c("Actual size"),
              " / ",
              c("100%"),
              " وهوامش ",
              c("None"),
              ".",
            ],
            ["قِس أحد المربّعات الكبيرة بمسطرة. يجب أن يكون 50 مم بالضبط."],
            [
              "ضع شهادة بيضاء حقيقية فوق الشبكة المطبوعة، حاذِ زاوية، واقرأ مقدار بُعد الطباعة عن موضعها الصحيح. هذان الرقمان، بالمليمتر، هما ",
              a("#print-single", "إزاحة المحاذاة"),
              " الخاصّة بك.",
            ],
          ],
        },
        {
          kind: "warning",
          text: [
            "إذا لم يقِس المربّع 50 مم، فتوقّف — هذه مشكلة تحجيم لا محاذاة، ولا يمكن لأيّ إزاحة إصلاحها. أعد الطباعة مع تعطيل التحجيم حتى يقيس المربّع القيمة الصحيحة. الإزاحة المطبَّقة فوق طباعة محجَّمة تبدو صحيحة في زاوية واحدة ثم تزداد انحرافًا عبر الصفحة.",
          ],
        },
      ],
    },
  },

  {
    id: "templates",
    adminOnly: true,
    en: {
      title: "Templates and backgrounds",
      blocks: [
        {
          kind: "para",
          text: [
            "A template is the description of one kind of diploma: its page size and where each field sits. The app ships with a single template, ",
            c("PhD (Doctorat)"),
            ", on a 297×210 mm A4 landscape page. Its card shows the field count, how many students use it, and whether a background scan has been uploaded.",
          ],
        },
        {
          kind: "para",
          text: [
            "The background is a scan of the blank ministry diploma. It is only ever shown on screen, so you can position fields against the real thing — it is never printed onto a real diploma. Upload it from ",
            c("Calibrate fields"),
            "; the upload form sits at the top of that page.",
          ],
        },
        {
          kind: "bullets",
          items: [
            ["Scan the blank in landscape, the same way round as it will be printed. PNG, JPG or WebP."],
            ["The file must be under 25 MB. If yours is larger, downscale it — the scan is a positioning aid, not an archival master."],
          ],
        },
        {
          kind: "warning",
          text: [
            "Uploading replaces the current scan in place. There is no version history and no undo, so keep your own copy of the original file.",
          ],
        },
        {
          kind: "warning",
          text: [
            "Replacing the background does not move any field. If the new scan is even slightly differently aligned, every field is now wrong relative to it and must be ",
            a("#calibrate", "re-positioned and saved"),
            ".",
          ],
        },
        {
          kind: "note",
          text: [
            "Templates cannot be created, renamed or deleted from the app — they are set up during installation. If you need a second kind of diploma, that is a job for whoever maintains the app.",
          ],
        },
      ],
    },
    ar: {
      title: "القوالب والخلفيات",
      blocks: [
        {
          kind: "para",
          text: [
            "القالب وصف لنوع واحد من الشهادات: حجم صفحته وموضع كل حقل فيه. يأتي التطبيق بقالب واحد، ",
            c("PhD (Doctorat)"),
            "، على صفحة A4 أفقية بقياس 297×210 مم. تعرض بطاقته عدد الحقول، وعدد الطلبة الذين يستعملونه، وما إذا رُفعت خلفية ممسوحة.",
          ],
        },
        {
          kind: "para",
          text: [
            "الخلفية نسخة ممسوحة ضوئيًا من شهادة الوزارة البيضاء. لا تُعرض إلّا على الشاشة، لتضع الحقول في مواضعها مقابل الشيء الحقيقي — ولا تُطبع أبدًا على شهادة حقيقية. ارفعها من ",
            c("Calibrate fields"),
            "؛ فاستمارة الرفع في أعلى تلك الصفحة.",
          ],
        },
        {
          kind: "bullets",
          items: [
            ["امسح الورقة البيضاء أفقيًا، بالاتّجاه نفسه الذي ستُطبع به. بصيغة PNG أو JPG أو WebP."],
            ["يجب أن يقلّ حجم الملف عن 25 ميغابايت. إن كان أكبر فصغّره — فالنسخة الممسوحة أداة لتحديد المواضع لا أصل للأرشفة."],
          ],
        },
        {
          kind: "warning",
          text: [
            "الرفع يستبدل النسخة الحالية في مكانها. لا يوجد سجلّ إصدارات ولا تراجع، فاحتفظ بنسختك الخاصّة من الملف الأصلي.",
          ],
        },
        {
          kind: "warning",
          text: [
            "استبدال الخلفية لا يحرّك أيّ حقل. إذا كانت النسخة الجديدة مختلفة المحاذاة ولو قليلًا، فكل الحقول صارت خاطئة بالنسبة إليها ويجب ",
            a("#calibrate", "إعادة وضعها وحفظها"),
            ".",
          ],
        },
        {
          kind: "note",
          text: [
            "لا يمكن إنشاء القوالب أو إعادة تسميتها أو حذفها من التطبيق — فهي تُضبط عند التنصيب. إن احتجت نوعًا ثانيًا من الشهادات فتلك مهمّة من يتولّى صيانة التطبيق.",
          ],
        },
      ],
    },
  },

  {
    id: "calibrate",
    adminOnly: true,
    en: {
      title: "Calibrating field positions",
      blocks: [
        {
          kind: "para",
          text: [
            "Calibration is where you tell the app exactly where on the paper each piece of data belongs. Positions are stored in millimetres, so they hold for every printer and every student. This is done once, carefully, and then left alone.",
          ],
        },
        {
          kind: "para",
          text: [
            "Drag any box to move it. The sample text inside comes from your first imported student, so you are judging the layout against a real name rather than a placeholder. Use the zoom buttons for precision, ",
            c("Background"),
            " to show or hide the scan, and ",
            c("Printable only"),
            " to hide the boxes that never print.",
          ],
        },
        {
          kind: "para",
          text: [
            "Select a field and the panel on the right gives exact control: ",
            c("X (mm)"),
            " and ",
            c("Y (mm)"),
            " for position, ",
            c("Width (mm)"),
            " and ",
            c("Font (pt)"),
            " for size, and the ",
            c("Nudge"),
            " arrows for half-millimetre steps. ",
            c("Alignment"),
            ", ",
            c("Direction"),
            " and ",
            c("Font"),
            " control how the text sits in its box — Arabic fields need right-to-left and the Arabic font.",
          ],
        },
        {
          kind: "bullets",
          items: [
            [
              c("Fixed value (overrides student data)"),
              " prints the same text for every student, regardless of what their record says. Use it for wording that never changes.",
            ],
            [
              c("Printable"),
              " unticked means the field is already on the ministry paper and must not be printed again. These show at half opacity and are visible here but not on the diploma preview.",
            ],
          ],
        },
        {
          kind: "warning",
          text: [
            "Moving and editing fields changes nothing until you click ",
            c("Save positions"),
            ". Removing a field is the exception — it takes effect at once, without saving.",
          ],
        },
        {
          kind: "para",
          text: [
            "To remove a field, select it and press ",
            k("Del"),
            " or click ",
            c("Remove field (Del)"),
            ", then confirm. It stops printing straight away and stays gone across restarts. Nothing is lost: every removed field is listed under ",
            c("Removed fields"),
            " with a ",
            c("Restore"),
            " button.",
          ],
        },
        {
          kind: "note",
          text: [
            "New fields cannot be added from here — the set of fields is fixed when the app is installed. Restoring a removed field is the only way to bring one back.",
          ],
        },
        {
          kind: "warning",
          text: [
            "Never sign off calibration from the screen alone. Do a ",
            a("#print-single", "test print with the background"),
            " and lay it over a real blank diploma. The screen can only tell you the fields look right relative to the scan; only paper tells you they are right relative to the paper.",
          ],
        },
      ],
    },
    ar: {
      title: "معايرة مواضع الحقول",
      blocks: [
        {
          kind: "para",
          text: [
            "المعايرة هي أن تخبر التطبيق بموضع كل بيان على الورقة بالضبط. تُحفظ المواضع بالمليمتر، فتصلح لكل طابعة وكل طالب. تُجرى مرّة واحدة بعناية ثم تُترك.",
          ],
        },
        {
          kind: "para",
          text: [
            "اسحب أيّ مربّع لتحريكه. النصّ النموذجي داخله مأخوذ من أوّل طالب مستورَد، فأنت تحكم على التصميم باسم حقيقي لا بنصّ بديل. استعمل أزرار التكبير للدقّة، و",
            c("Background"),
            " لإظهار النسخة الممسوحة أو إخفائها، و",
            c("Printable only"),
            " لإخفاء المربّعات التي لا تُطبع أبدًا.",
          ],
        },
        {
          kind: "para",
          text: [
            "حدّد حقلًا فتمنحك اللوحة اليمنى تحكّمًا دقيقًا: ",
            c("X (mm)"),
            " و",
            c("Y (mm)"),
            " للموضع، و",
            c("Width (mm)"),
            " و",
            c("Font (pt)"),
            " للحجم، وأسهم ",
            c("Nudge"),
            " للتحريك بنصف مليمتر. وتتحكّم ",
            c("Alignment"),
            " و",
            c("Direction"),
            " و",
            c("Font"),
            " في وضع النصّ داخل مربّعه — الحقول العربية تحتاج الاتّجاه من اليمين إلى اليسار والخطّ العربي.",
          ],
        },
        {
          kind: "bullets",
          items: [
            [
              "يطبع ",
              c("Fixed value (overrides student data)"),
              " النصّ نفسه لكل الطلبة، مهما كان في سجلّهم. استعمله للعبارات التي لا تتغيّر أبدًا.",
            ],
            [
              "إزالة علامة ",
              c("Printable"),
              " تعني أنّ الحقل موجود أصلًا على ورق الوزارة ويجب ألّا يُطبع ثانيةً. تظهر هذه الحقول بنصف شفافية، وتُرى هنا لا في معاينة الشهادة.",
            ],
          ],
        },
        {
          kind: "warning",
          text: [
            "تحريك الحقول وتعديلها لا يغيّر شيئًا حتى تضغط ",
            c("Save positions"),
            ". أمّا إزالة حقل فاستثناء — إذ تسري فورًا دون حفظ.",
          ],
        },
        {
          kind: "para",
          text: [
            "لإزالة حقل، حدّده واضغط ",
            k("Del"),
            " أو انقر ",
            c("Remove field (Del)"),
            " ثم أكّد. يتوقّف عن الطباعة فورًا ويبقى محذوفًا بعد إعادة التشغيل. ولا يضيع شيء: فكل حقل مُزال مدرَج تحت ",
            c("Removed fields"),
            " مع زرّ ",
            c("Restore"),
            ".",
          ],
        },
        {
          kind: "note",
          text: [
            "لا يمكن إضافة حقول جديدة من هنا — فمجموعة الحقول تُحدَّد عند تنصيب التطبيق. واستعادة حقل مُزال هي السبيل الوحيد لإرجاع واحد.",
          ],
        },
        {
          kind: "warning",
          text: [
            "لا تعتمد المعايرة من الشاشة وحدها أبدًا. أجرِ ",
            a("#print-single", "طباعة تجريبية مع الخلفية"),
            " وضعها فوق شهادة بيضاء حقيقية. الشاشة لا تخبرك إلّا أنّ الحقول صحيحة بالنسبة إلى النسخة الممسوحة؛ والورق وحده يخبرك أنّها صحيحة بالنسبة إلى الورق.",
          ],
        },
      ],
    },
  },

  {
    id: "users",
    adminOnly: true,
    en: {
      title: "User accounts",
      blocks: [
        {
          kind: "para",
          text: [
            "Everyone who uses the app has their own account, so the record of who changed and printed what stays meaningful. Create one under ",
            c("Users"),
            ": fill in ",
            c("Full name"),
            ", ",
            c("Email"),
            " and an initial password of at least 6 characters, pick a role, and click ",
            c("Create user"),
            ".",
          ],
        },
        {
          kind: "bullets",
          items: [
            [c("Staff"), " — students, import, printing and PDF export. The right choice for most people."],
            [c("Admin"), " — all of that, plus templates, calibration and user accounts. Keep this to the few people who need it."],
          ],
        },
        {
          kind: "warning",
          text: [
            "The initial password is shown in plain text as you type it, and the app never displays it again. Make sure nobody is reading over your shoulder, pass it to the person directly, and ask them to tell you if they cannot sign in.",
          ],
        },
        {
          kind: "para",
          text: [
            "In the table, ",
            c("Reset"),
            " sets a new password for someone who has forgotten theirs, and ",
            c("Disable"),
            " blocks sign-in for someone who has left. Disabling is reversible with ",
            c("Enable"),
            ".",
          ],
        },
        {
          kind: "note",
          text: [
            "Accounts cannot be edited or deleted — a name, email and role are fixed once created, and someone who leaves should be disabled rather than removed, so past records still make sense. You cannot disable your own account, which stops you locking yourself out.",
          ],
        },
      ],
    },
    ar: {
      title: "حسابات المستخدمين",
      blocks: [
        {
          kind: "para",
          text: [
            "لكل مستعمل للتطبيق حسابه الخاصّ، حتى يبقى سجلّ من غيّر وطبع ماذا ذا معنى. أنشئ حسابًا من ",
            c("Users"),
            ": املأ ",
            c("Full name"),
            " و",
            c("Email"),
            " وكلمة مرور أوّلية من 6 محارف على الأقلّ، واختر الدور، ثم اضغط ",
            c("Create user"),
            ".",
          ],
        },
        {
          kind: "bullets",
          items: [
            [c("Staff"), " — الطلبة والاستيراد والطباعة وتصدير PDF. الخيار المناسب لأغلب الناس."],
            [c("Admin"), " — ذلك كلّه، إضافةً إلى القوالب والمعايرة وحسابات المستخدمين. اقصره على القلّة التي تحتاجه."],
          ],
        },
        {
          kind: "warning",
          text: [
            "تظهر كلمة المرور الأوّلية كنصّ ظاهر أثناء كتابتها، ولا يعرضها التطبيق مرّة أخرى أبدًا. تأكّد أنّ أحدًا لا يقرأ من خلف كتفك، وسلّمها إلى صاحبها مباشرةً، واطلب منه إعلامك إن تعذّر عليه الدخول.",
          ],
        },
        {
          kind: "para",
          text: [
            "في الجدول، يضبط ",
            c("Reset"),
            " كلمة مرور جديدة لمن نسي كلمته، ويمنع ",
            c("Disable"),
            " الدخول عمّن غادر. والتعطيل قابل للتراجع بـ",
            c("Enable"),
            ".",
          ],
        },
        {
          kind: "note",
          text: [
            "لا يمكن تعديل الحسابات ولا حذفها — فالاسم والبريد والدور ثابتة بعد الإنشاء، ومن يغادر ينبغي تعطيله لا حذفه، حتى تبقى السجلّات السابقة مفهومة. ولا يمكنك تعطيل حسابك أنت، وهو ما يمنعك من إغلاق الباب على نفسك.",
          ],
        },
      ],
    },
  },

  {
    id: "troubleshooting",
    en: {
      title: "Troubleshooting",
      blocks: [
        {
          kind: "bullets",
          items: [
            [
              "Everything prints slightly off, but evenly — the layout is right and the paper feed is not. Set the ",
              a("#print-single", "alignment offset"),
              ".",
            ],
            [
              "Text drifts further out towards one side of the page — that is scaling, not alignment. ",
              a("#calibration-grid", "Print the grid"),
              " and check a large square measures 50 mm; if it does not, the print dialog is scaling the page.",
            ],
            [
              "A diploma came out with the border and labels printed over the pre-printed ones — the background was included. Use ",
              c("🖨 Print onto diploma (data only)"),
              ", not the test print or the PDF export.",
            ],
            [
              "The bulk PDF is offset wrongly — bulk uses the offset saved on a single student's diploma screen, in this browser. ",
              a("#print-batch", "Check the readout"),
              " before exporting.",
            ],
            [
              "Every student appears twice — the same Excel file was imported twice with “Add all as new students”. Delete the duplicates from the students list, and re-import with “Update existing students” so the rows are matched instead of added.",
            ],
            [
              "A printed date looks wrong or oddly formatted — the app could not recognise what was typed, so it printed it verbatim. Open the student and check the date field.",
            ],
            [
              "Arabic prints as boxes or disconnected letters — the Arabic font did not load. Reload the page; if it persists, tell whoever maintains the app rather than retyping the name.",
            ],
            [
              "A menu item described in this guide is missing — it is admin-only and you are signed in as staff. Your name and role are at the top right of every screen.",
            ],
          ],
        },
        {
          kind: "note",
          text: [
            "When something looks wrong on paper, always check it against a real blank diploma rather than against the screen. The preview can only show that the data matches the scan.",
          ],
        },
      ],
    },
    ar: {
      title: "حلّ المشكلات",
      blocks: [
        {
          kind: "bullets",
          items: [
            [
              "كل شيء يُطبع منزاحًا قليلًا لكن بانتظام — التصميم صحيح وتغذية الورق ليست كذلك. اضبط ",
              a("#print-single", "إزاحة المحاذاة"),
              ".",
            ],
            [
              "النصّ يزداد انحرافًا نحو أحد جانبَي الصفحة — هذا تحجيم لا محاذاة. ",
              a("#calibration-grid", "اطبع الشبكة"),
              " وتحقّق أنّ مربّعًا كبيرًا يقيس 50 مم؛ فإن لم يكن كذلك فنافذة الطباعة تحجّم الصفحة.",
            ],
            [
              "خرجت شهادة بإطار وعناوين مطبوعة فوق المطبوعة مسبقًا — أُدرجت الخلفية. استعمل ",
              c("🖨 Print onto diploma (data only)"),
              " لا الطباعة التجريبية ولا تصدير PDF.",
            ],
            [
              "ملف PDF الجماعي منزاح خطأً — تستعمل الطباعة بالجملة الإزاحة المحفوظة في شاشة شهادة طالب واحد، في هذا المتصفّح. ",
              a("#print-batch", "تحقّق من القيمة المعروضة"),
              " قبل التصدير.",
            ],
            [
              "كل طالب يظهر مرّتين — استُورد ملف Excel نفسه مرّتين بخيار «Add all as new students». احذف المكرّرين من قائمة الطلبة، ثم أعد الاستيراد بخيار «Update existing students» ليُطابَق كل سطر بدل أن يُضاف.",
            ],
            [
              "تاريخ مطبوع يبدو خاطئًا أو غريب الصيغة — لم يتعرّف التطبيق على ما كُتب فطبعه حرفيًا. افتح الطالب وتحقّق من حقل التاريخ.",
            ],
            [
              "العربية تُطبع مربّعات أو حروفًا مفكّكة — لم يُحمَّل الخطّ العربي. أعد تحميل الصفحة؛ وإن استمرّ الأمر فأبلغ من يتولّى صيانة التطبيق بدل إعادة كتابة الاسم.",
            ],
            [
              "عنصر مذكور في هذا الدليل غير موجود في القائمة — فهو للمشرفين وأنت مسجَّل الدخول كموظّف. اسمك ودورك في أعلى يمين كل شاشة.",
            ],
          ],
        },
        {
          kind: "note",
          text: [
            "متى بدا شيء خاطئًا على الورق، فتحقّق منه دائمًا مقابل شهادة بيضاء حقيقية لا مقابل الشاشة. المعاينة لا تُظهر إلّا أنّ البيانات تطابق النسخة الممسوحة.",
          ],
        },
      ],
    },
  },
];
