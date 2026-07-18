ALTER TABLE curriculum
  ADD COLUMN level_number TINYINT UNSIGNED DEFAULT NULL AFTER category,
  ADD COLUMN mode ENUM('solo','duel','peer','coop') NOT NULL DEFAULT 'solo' AFTER level_number,
  ADD INDEX idx_curriculum_category_level (category, level_number);

-- ── Engineering ──────────────────────────────────────────────

INSERT INTO curriculum (id, title, description, type, url, category, level_number, mode, content, access, is_published, sort_order, author) VALUES
(UUID(), 'Review PR Sederhana', 'AI kasih kode dengan 3 bug, jelasin lewat chat di mana salahnya.', 'course', '/kurikulum/engineering/level-1', 'engineering', 1, 'solo',
 'AI kasih kamu kode yang punya 3 bug. Tugas kamu: jelasin lewat chat di mana letak salahnya dan kenapa. Fokus latihan ini bukan nemuin bug secepat mungkin, tapi ngasih penjelasan yang bisa dipahami rekan tim.',
 'free', 1, 1, 'Kodeye Team'),

(UUID(), 'Duel: Trade-off Refactor', 'Debat pendekatan refactor kode legacy vs lawan.', 'course', '/kurikulum/engineering/level-2', 'engineering', 2, 'duel',
 'Kamu vs 1 lawan, sama-sama dikasih kode legacy yang sama. Debat pendekatan refactor terbaik lewat chat — AI nilai siapa yang argumennya lebih kuat secara teknis.',
 'giat', 1, 2, 'Kodeye Team'),

(UUID(), 'Peer Rating: Code Review Reasoning', 'Submit reasoning code review, dinilai peer lain.', 'course', '/kurikulum/engineering/level-3', 'engineering', 3, 'peer',
 'Submit reasoning code review kamu, di-rating peer lain di komunitas. Latihan ini ngasah gimana caranya kasih feedback yang membangun, bukan cuma benar secara teknis.',
 'giat', 1, 3, 'Kodeye Team'),

(UUID(), 'Duel Kompetitif: Refactor Efisien', 'Versi kompetitif level 2, taruhan ELO.', 'course', '/kurikulum/engineering/level-4', 'engineering', 4, 'duel',
 'Versi lanjutan level 2, sekarang taruhan ELO. Siapa yang reasoning-nya paling tepat dan efisien menang poin peringkat.',
 'giat', 1, 4, 'Kodeye Team'),

(UUID(), 'Skenario Premium: Live Refactor', 'Refactor kode beneran di code editor, AI jalanin test-nya.', 'course', '/kurikulum/engineering/level-5', 'engineering', 5, 'coop',
 'Kamu beneran nulis dan edit kode di editor, AI langsung jalanin test-nya. Ini level paling nyata — gak cuma ngomongin refactor, tapi eksekusi. Butuh Editor Workspace Chat+Code (plan Premium).',
 'premium', 1, 5, 'Kodeye Team');

-- ── Debugging ───────────────────────────────────────────────

INSERT INTO curriculum (id, title, description, type, url, category, level_number, mode, content, access, is_published, sort_order, author) VALUES
(UUID(), 'Rubber Duck ke AI Mentor', 'Narasiin hipotesis debugging step by step ke AI mentor.', 'course', '/kurikulum/debugging/level-1', 'debugging', 1, 'solo',
 'Kamu dikasih stack trace dan gejala bug. Narasiin hipotesis kamu step by step ke AI mentor — sering kali proses ngejelasin ini yang bikin kamu sendiri sadar di mana salahnya.',
 'free', 1, 1, 'Kodeye Team'),

(UUID(), 'Duel Race Debug', 'Debug bug yang sama dengan clue terbatas vs lawan.', 'course', '/kurikulum/debugging/level-2', 'debugging', 2, 'duel',
 'Kamu vs 1 lawan, dikasih bug yang sama dengan clue terbatas. Yang dinilai bukan cuma kecepatan, tapi kualitas hipotesis yang kamu susun.',
 'giat', 1, 2, 'Kodeye Team'),

(UUID(), 'Peer Rating: Kualitas Hipotesis', 'Proses debugging dinilai peer soal reasoning sistematis.', 'course', '/kurikulum/debugging/level-3', 'debugging', 3, 'peer',
 'Submit proses debugging kamu, di-rating peer soal seberapa sistematis reasoning-nya.',
 'giat', 1, 3, 'Kodeye Team'),

(UUID(), 'Duel Kompetitif: Bug Susah Direproduksi', 'Bug cuma muncul di production, latihan reasoning di bawah ketidakpastian.', 'course', '/kurikulum/debugging/level-4', 'debugging', 4, 'duel',
 'Bug cuma muncul di production, gak kereproduksi di lokal. Latihan reasoning di bawah ketidakpastian, taruhan ELO.',
 'giat', 1, 4, 'Kodeye Team'),

(UUID(), 'Skenario Premium: War Room Jam 2 Pagi', 'Simulasi co-op incident response, debug live sambil komunikasi stakeholder.', 'course', '/kurikulum/debugging/level-5', 'debugging', 5, 'coop',
 'Simulasi co-op: production down, revenue jalan terus. Satu orang investigasi langsung di code editor, satu orang komunikasi ke stakeholder real-time. AI jadi incident commander yang nanya update tiap beberapa menit. Butuh Editor Workspace Chat+Code (plan Premium).',
 'premium', 1, 5, 'Kodeye Team');

-- ── System Design ───────────────────────────────────────────

INSERT INTO curriculum (id, title, description, type, url, category, level_number, mode, content, access, is_published, sort_order, author) VALUES
(UUID(), 'Ngomongin Arsitektur ke Teknisi', 'Jelasin diagram arsitektur ke AI yang pura-pura jadi teknisi awam.', 'course', '/kurikulum/system-design/level-1', 'system-design', 1, 'solo',
 'AI ngasih diagram arsitektur sederhana. Tugas kamu: jelasin pakai bahasa awam ke AI yang pura-pura jadi teknisi yang gak familiar. Latihan ini ngukur gampangnya kamu komunikasiin konsep teknis.',
 'free', 1, 1, 'Kodeye Team'),

(UUID(), 'Duel: Pilih Stack buat Startup', 'Kamu vs 1 lawan bedah pilihan stack buat startup hipotetis.', 'course', '/kurikulum/system-design/level-2', 'system-design', 2, 'duel',
 'Startup hipotetis dikasih requirement sederhana. Kamu vs lawan bedah trade-off pilihan stack — yang argumennya paling relevan sama konteks bisnisnya yang menang.',
 'giat', 1, 2, 'Kodeye Team'),

(UUID(), 'Peer Rating: Arsitektur Diagram', 'Submit diagram arsitektur dan reasoning kamu, dinilai peer.', 'course', '/kurikulum/system-design/level-3', 'system-design', 3, 'peer',
 'Kamu submit diagram arsitektur plus reasoning di balik tiap keputusan. Peer di komunitas nilai seberapa solid tiap keputusan.',
 'giat', 1, 3, 'Kodeye Team'),

(UUID(), 'Duel Kompetitif: Scaling End of Month', 'Arsitek yang scaling-nya paling hemat jadi pemenang.', 'course', '/kurikulum/system-design/level-4', 'system-design', 4, 'duel',
 'Sistem lagi peak load akhir bulan. Kamu vs lawan: arsitek yang scaling-nya paling hemat tanpa over-engineering jadi pemenang. Taruhan ELO.',
 'giat', 1, 4, 'Kodeye Team'),

(UUID(), 'Skenario Premium: Migrasi Cloud', 'Migrasi 5 menit terakhir dari AWS ke GCP live bersama tim.', 'course', '/kurikulum/system-design/level-5', 'system-design', 5, 'coop',
 'Sesi co-op: migrasi 5 menit lagi dari AWS ke GCP. Bagi peran: satu urus data migration plan, satu urus DNS & routing, satu urus monitoring rollback. AI jadi manager yang nagih update tiap sesi. Butuh Editor Workspace Chat+Code (plan Premium).',
 'premium', 1, 5, 'Kodeye Team');

-- ── Data ────────────────────────────────────────────────────

INSERT INTO curriculum (id, title, description, type, url, category, level_number, mode, content, access, is_published, sort_order, author) VALUES
(UUID(), 'Bacain Dashboard ke Manager', 'Kamu jelasin isi dashboard data ke AI yang pura-pura manager nonteknis.', 'course', '/kurikulum/data/level-1', 'data', 1, 'solo',
 'Dashboard penuh metrik. Kamu jelasin ke AI manager yang cuma peduli implikasi bisnis — gak peduli teknisnya. Latihan simplifikasi insight.',
 'free', 1, 1, 'Kodeye Team'),

(UUID(), 'Duel: Pendekatan Analitik', 'Kamu vs lawan bedah dataset sederhana, siapa insight-nya paling actionable.', 'course', '/kurikulum/data/level-2', 'data', 2, 'duel',
 'Dataset sederhana dikasih ke kamu dan lawan. Duel: siapa yang kasih insight paling actionable, bukan sekadar "menarik" secara teknis.',
 'giat', 1, 2, 'Kodeye Team'),

(UUID(), 'Peer Rating: Analisis Data', 'Submit analisis data kamu, dinilai peer.', 'course', '/kurikulum/data/level-3', 'data', 3, 'peer',
 'Submit analisis data plus visualisasi kamu. Peer nilai kejelasan dan relevansi insight-nya.',
 'giat', 1, 3, 'Kodeye Team'),

(UUID(), 'Duel Kompetitif: Anomali Data', 'Cari anomali yang bikin rugi, siapa paling cepet dan tepat.', 'course', '/kurikulum/data/level-4', 'data', 4, 'duel',
 'Anomali data yang bikin rugi. Siapa yang paling cepet nemuin akar masalah dan paling tepat rekomendasi fix-nya — taruhan ELO.',
 'giat', 1, 4, 'Kodeye Team'),

(UUID(), 'Skenario Premium: Data Pipeline Incident', 'Simulasi data pipeline broken di production, live debug bareng tim.', 'course', '/kurikulum/data/level-5', 'data', 5, 'coop',
 'Pipeline data broken di production. Satu orang debug query & transform, satu orang cek source & destination, satu orang komunikasi ke stakeholder. Butuh Editor Workspace Chat+Code (plan Premium).',
 'premium', 1, 5, 'Kodeye Team');

-- ── Interview Prep ──────────────────────────────────────────

INSERT INTO curriculum (id, title, description, type, url, category, level_number, mode, content, access, is_published, sort_order, author) VALUES
(UUID(), 'Sesi Latihan Wawancara', 'AI jadi pewawancara, kamu jawab pertanyaan teknis dan behavioral.', 'course', '/kurikulum/interview-prep/level-1', 'interview-prep', 1, 'solo',
 'AI jadi pewawancara yang strictly ngikutin skrip pertanyaan umum. Kamu latihan jawab pertanyaan teknis dan behavioral tanpa tekanan kompetitif.',
 'free', 1, 1, 'Kodeye Team'),

(UUID(), 'Duel: Mock Interview', 'Dua orang diwawancara AI dengan pertanyaan yang sama, rebutan nilai.', 'course', '/kurikulum/interview-prep/level-2', 'interview-prep', 2, 'duel',
 'Kamu vs 1 lawan, diwawancara AI dengan pertanyaan sama. Yang jawabannya lebih terstruktur dan tepat sasaran dapat poin lebih.',
 'giat', 1, 2, 'Kodeye Team'),

(UUID(), 'Peer Rating: Simulasi Reviewer', 'Submit jawaban, dinilai peer.', 'course', '/kurikulum/interview-prep/level-3', 'interview-prep', 3, 'peer',
 'Submit jawaban kamu ke simulasi "reviewer panel" komunitas. Peer nilai dari sisi struktur, ketepatan, dan cara kamu merespons pertanyaan susulan.',
 'giat', 1, 3, 'Kodeye Team'),

(UUID(), 'Duel Kompetitif: System Design Interview', 'Versi kompetitif mock interview system design, taruhan ELO.', 'course', '/kurikulum/interview-prep/level-4', 'interview-prep', 4, 'duel',
 'Mock interview system design sekarang kompetitif. Dua orang dihadapkan ke pertanyaan arsitektur yang sama. Yang bisa justify trade-off lebih baik menang. Taruhan ELO.',
 'giat', 1, 4, 'Kodeye Team'),

(UUID(), 'Skenario Premium: Panel Interview', 'Simulasi wawancara panel 3 pewawancara dengan dynamic questioning.', 'course', '/kurikulum/interview-prep/level-5', 'interview-prep', 5, 'coop',
 'Panel interview simulation: 3 AI pewawancara dengan fokus berbeda (teknis, sistem, behavioral). Kamu harus handle multiple questioning styles sekaligus. Butuh Editor Workspace Chat+Code (plan Premium).',
 'premium', 1, 5, 'Kodeye Team');

-- ── Technical Communication ─────────────────────────────────

INSERT INTO curriculum (id, title, description, type, url, category, level_number, mode, content, access, is_published, sort_order, author) VALUES
(UUID(), 'Dokumentasi Singkat ke Junior', 'Jelasin fitur baru dalam 3 paragraf ke AI yang pura-pura junior.', 'course', '/kurikulum/technical-communication/level-1', 'technical-communication', 1, 'solo',
 'Fitur baru, 3 paragraf. Jelasin ke AI yang pura-pura junior yang baru join. Latihan prioritas informasi dan kesederhanaan bahasa.',
 'free', 1, 1, 'Kodeye Team'),

(UUID(), 'Duel: Nulis RFC vs Lawan', 'Kamu vs lawan tulis RFC pendek untuk improvement yang sama.', 'course', '/kurikulum/technical-communication/level-2', 'technical-communication', 2, 'duel',
 'Improvement yang sama. Kamu vs lawan: tulis RFC pendek. Yang argumentasinya lebih meyakinkan dan strukturnya lebih rapi yang menang.',
 'giat', 1, 2, 'Kodeye Team'),

(UUID(), 'Peer Rating: Technical Writing', 'Tulisan dinilai peer.', 'course', '/kurikulum/technical-communication/level-3', 'technical-communication', 3, 'peer',
 'Tulisan kamu di-rating peer dari sisi clarity, completeness, dan persuasiveness.',
 'giat', 1, 3, 'Kodeye Team'),

(UUID(), 'Duel Kompetitif: Postmortem', 'Incident postmortem duel, siapa yang paling jujur dan jelas.', 'course', '/kurikulum/technical-communication/level-4', 'technical-communication', 4, 'duel',
 'Incident postmortem: siapa yang tulisannya paling jujur, paling jelas, dan mengandung actionable insight — bukan sekadar kronologi. Taruhan ELO.',
 'giat', 1, 4, 'Kodeye Team'),

(UUID(), 'Skenario Premium: Live Dokumentasi', 'Nulis dokumentasi real-time sambil fitur dikerjakan di depan mata.', 'course', '/kurikulum/technical-communication/level-5', 'technical-communication', 5, 'coop',
 'Sesi co-op: satu orang nulis dokumentasi, satu orang ngejelasin API yang baru selesai dikerjain, satu orang cek konsistensi istilah. Butuh Editor Workspace Chat+Code (plan Premium).',
 'premium', 1, 5, 'Kodeye Team');

-- ── Negotiation ─────────────────────────────────────────────

INSERT INTO curriculum (id, title, description, type, url, category, level_number, mode, content, access, is_published, sort_order, author) VALUES
(UUID(), 'Roleplay Negosiasi Gaji', 'AI jadi HRD, kamu latihan negosiasi gaji tanpa tekanan.', 'course', '/kurikulum/negotiation/level-1', 'negotiation', 1, 'solo',
 'AI jadi HRD dengan batasan wewenang tertentu. Kamu latihan negosiasi gaji tanpa tekanan. Fokus: nyusun argumen berdasarkan data pasar, bukan gertak sambal.',
 'free', 1, 1, 'Kodeye Team'),

(UUID(), 'Duel: Deadline Feature', 'Tim lo minta fitur, tim lawan minta prioritas. Siapa yang negosiasinya paling win-win.', 'course', '/kurikulum/negotiation/level-2', 'negotiation', 2, 'duel',
 'Tim kamu minta fitur, tim lawan minta prioritasnya. Duel: siapa yang bisa negosiasi alokasi resource paling win-win, bukan siapa yang menang argumen.',
 'giat', 1, 2, 'Kodeye Team'),

(UUID(), 'Peer Rating: Strategi Negosiasi', 'Submit strategi, dinilai peer.', 'course', '/kurikulum/negotiation/level-3', 'negotiation', 3, 'peer',
 'Submit strategi dan bahasa yang kamu pake di negosiasi tadi. Peer nilai efektivitas pendekatan kamu.',
 'giat', 1, 3, 'Kodeye Team'),

(UUID(), 'Duel Kompetitif: Stakeholder Conflict', 'Stakeholder (AI) minta mustahil, duel approach bedah constraint.', 'course', '/kurikulum/negotiation/level-4', 'negotiation', 4, 'duel',
 'Stakeholder (AI) minta tenggat yang mustahil. Kamu vs lawan: bedah constraint dan cari jalan keluarnya. Siapa yang bisa negosiasi ulang tanpa merusak hubungan. Taruhan ELO.',
 'giat', 1, 4, 'Kodeye Team'),

(UUID(), 'Skenario Premium: Vendor Contract', 'Simulasi negosiasi kontrak vendor IT live dengan 3 pihak.', 'course', '/kurikulum/negotiation/level-5', 'negotiation', 5, 'coop',
 'Negosiasi kontrak vendor IT: satu orang handle scope & timeline, satu orang handle budget & SLA, satu orang handle hubungan & komunikasi. AI jadi vendor yang tough tapi fair. Butuh Editor Workspace Chat+Code (plan Premium).',
 'premium', 1, 5, 'Kodeye Team');

-- ── Stakeholder Management ──────────────────────────────────

INSERT INTO curriculum (id, title, description, type, url, category, level_number, mode, content, access, is_published, sort_order, author) VALUES
(UUID(), 'Update Status ke Stakeholder', 'Kirim update progres proyek ke AI stakeholder yang cuma peduli deadline.', 'course', '/kurikulum/stakeholder-management/level-1', 'stakeholder-management', 1, 'solo',
 'Kamu kirim update progres ke AI stakeholder yang cuma peduli deadline. Latihan: kasih sinyal early warning tanpa bikin panik.',
 'free', 1, 1, 'Kodeye Team'),

(UUID(), 'Duel: Manage Expectations', 'Kamu vs lawan: handle stakeholder yang minta scope creep.', 'course', '/kurikulum/stakeholder-management/level-2', 'stakeholder-management', 2, 'duel',
 'Stakeholder (AI) minta tambahan fitur di tengah sprint. Kamu vs lawan: yang bisa manage expectation tanpa over-promise menang.',
 'giat', 1, 2, 'Kodeye Team'),

(UUID(), 'Peer Rating: Komunikasi Stakeholder', 'Komunikasi dinilai peer.', 'course', '/kurikulum/stakeholder-management/level-3', 'stakeholder-management', 3, 'peer',
 'Riwayat komunikasi kamu dengan stakeholder dinilai peer: seberapa transparan, seberapa realistis, seberapa sopan.',
 'giat', 1, 3, 'Kodeye Team');

INSERT INTO curriculum (id, title, description, type, url, category, level_number, mode, content, access, is_published, sort_order, author) VALUES
(UUID(), 'Duel Kompetitif: Krisis Komunikasi', 'Duel handle krisis komunikasi di tengah deadline mblepet.', 'course', '/kurikulum/stakeholder-management/level-4', 'stakeholder-management', 4, 'duel',
 'Krisis: deadline mblepet, stakeholder mulai panik. Kamu vs lawan: yang bisa komunikasi situasi dengan kepala dingin dan kasih rencana mitigasi realistis menang. Taruhan ELO.',
 'giat', 1, 4, 'Kodeye Team'),

(UUID(), 'Skenario Premium: Steering Committee', 'Simulasi steering committee dengan multi-stakeholder.', 'course', '/kurikulum/stakeholder-management/level-5', 'stakeholder-management', 5, 'coop',
 'Steering committee: hadepin 3 AI stakeholder beda kepentingan (bisnis, teknis, operasional). Bagi peran: satu explain progress, satu handle concern bisnis, satu handle mitigasi risiko. Butuh Editor Workspace Chat+Code (plan Premium).',
 'premium', 1, 5, 'Kodeye Team');
