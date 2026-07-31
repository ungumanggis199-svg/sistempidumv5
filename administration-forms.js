/*
 * Skema form administrasi SIAP PIDUM.
 * Field dengan source akan diisi otomatis dari data perkara atau administrasi sebelumnya.
 * Field tanpa source harus dilengkapi administrator.
 */
(() => {
  "use strict";

  const commonDocument = [
    {
      title: "Identitas dokumen",
      description: "Data utama administrasi yang sedang dibuat.",
      fields: [
        { key: "documentNumber", label: "Nomor administrasi / surat", type: "text", placeholder: "Isi apabila formulir memiliki nomor surat" },
        { key: "documentDate", label: "Tanggal administrasi", type: "date", required: true, source: "today", sourceLabel: "Tanggal hari ini", editableAuto: true },
        { key: "documentPlace", label: "Tempat dikeluarkan / dibuat", type: "text", placeholder: "Contoh: Raha" },
        { key: "responsibleOfficer", label: "Pejabat / Jaksa penanggung jawab", type: "text", required: true, source: "case:prosecutorName|user:fullName", sourceLabel: "Jaksa perkara / akun aktif", editableAuto: true }
      ]
    }
  ];

  const schemas = {
    "P-1A": {
      title: "Tanda Terima Penerimaan SPDP",
      subtitle: "Penerimaan dan verifikasi SPDP",
      referencePages: "Halaman 2",
      sections: [
        ...commonDocument,
        {
          title: "Waktu penerimaan",
          description: "Waktu dan zona waktu saat SPDP diterima.",
          fields: [
            { key: "receiptDate", label: "Tanggal SPDP diterima di PTSP", type: "date", required: true, source: "case:receivedDate", sourceLabel: "Data SPDP", editableAuto: true },
            { key: "receiptTime", label: "Jam penerimaan", type: "time", required: true },
            { key: "timeZone", label: "Zona waktu", type: "select", required: true, defaultValue: "WITA", options: ["WIB", "WITA", "WIT"] }
          ]
        },
        {
          title: "Penerima SPDP",
          description: "Petugas Kejaksaan yang menerima SPDP.",
          fields: [
            { key: "receiverName", label: "Nama penerima", type: "text", required: true, source: "user:fullName", sourceLabel: "Akun aktif", editableAuto: true },
            { key: "receiverRank", label: "Pangkat/Gol penerima", type: "text", required: true },
            { key: "receiverNip", label: "NIP/NRP penerima", type: "text", required: true },
            { key: "receiverPosition", label: "Jabatan penerima", type: "select", required: true, options: ["Kabag TU", "Kasubbag Bin", "Kaur Bin", "Lainnya"] }
          ]
        },
        {
          title: "Data SPDP dan Penyidik",
          description: "Bagian ini diambil otomatis dari data perkara.",
          fields: [
            { key: "investigatorInstitution", label: "Instansi/Unit Penyidik", type: "text", required: true, source: "case:investigatorInstitution", sourceLabel: "Data perkara" },
            { key: "spdpNumber", label: "Nomor SPDP", type: "text", required: true, source: "case:spdpNumber", sourceLabel: "Data perkara" },
            { key: "spdpDate", label: "Tanggal SPDP", type: "date", required: true, source: "case:spdpDate", sourceLabel: "Data perkara" },
            { key: "sprindikNumber", label: "Nomor Sprindik", type: "text", required: true, source: "case:sprindikNumber", sourceLabel: "Data perkara" },
            { key: "sprindikDate", label: "Tanggal Sprindik", type: "date", required: true, source: "case:sprindikDate", sourceLabel: "Data perkara" },
            { key: "suspectName", label: "Nama Tersangka/Terlapor", type: "text", required: true, source: "case:suspectName", sourceLabel: "Data perkara" },
            { key: "allegedArticle", label: "Pasal yang disangkakan", type: "textarea", required: true, source: "case:allegedArticle", sourceLabel: "Data perkara", full: true }
          ]
        },
        {
          title: "Pihak yang menyampaikan",
          description: "Identitas penyidik yang menyerahkan SPDP.",
          fields: [
            { key: "senderName", label: "Nama penyidik yang menyampaikan", type: "text", required: true, source: "case:investigatorName", sourceLabel: "Data perkara" },
            { key: "senderRankNrp", label: "Pangkat/NRP penyidik", type: "text", required: true, source: "computed:investigatorRankNrp", sourceLabel: "Data perkara" }
          ]
        },
        {
          title: "Catatan verifikasi",
          description: "Verifikasi waktu dan kesetaraan sebagaimana format P-1A.",
          fields: [
            { key: "verificationSprindikDate", label: "Tanggal Surat Perintah Penyidikan", type: "date", required: true, source: "case:sprindikDate", sourceLabel: "Data perkara" },
            { key: "verificationReceivedDate", label: "Tanggal SPDP diterima", type: "date", required: true, source: "case:receivedDate", sourceLabel: "Data perkara" },
            { key: "delayDays", label: "Selisih hari", type: "number", required: true, source: "case:spdpDelayDays", sourceLabel: "Perhitungan sistem" },
            { key: "delayCategory", label: "Kategori selisih", type: "text", required: true, source: "computed:delayCategory", sourceLabel: "Perhitungan sistem" },
            { key: "institutionEquality", label: "Sesuai dengan kesetaraan", type: "select", required: true, options: ["Ya", "Tidak"] },
            { key: "verificationNotes", label: "Catatan verifikasi tambahan", type: "textarea", full: true }
          ]
        }
      ]
    },

    "P-16": {
      title: "Surat Perintah Mengikuti Perkembangan Penyidikan",
      subtitle: "Penunjukan tim Penuntut Umum",
      referencePages: "Halaman 8-11",
      sections: [
        ...commonDocument,
        {
          title: "Penerbit surat perintah",
          description: "Data pejabat dan dasar penerbitan P-16.",
          fields: [
            { key: "issuerLevel", label: "Penerbit", type: "select", required: true, options: ["Jaksa Agung Muda Tindak Pidana Umum", "Kepala Kejaksaan Tinggi", "Kepala Kejaksaan Negeri", "Kepala Cabang Kejaksaan Negeri"] },
            { key: "issuerInstitution", label: "Nama satuan kerja", type: "text", required: true, placeholder: "Contoh: Kejaksaan Negeri Muna" },
            { key: "issuerName", label: "Nama pejabat penerbit", type: "text", required: true },
            { key: "issuerRank", label: "Pangkat pejabat penerbit", type: "text", required: true },
            { key: "specialProceduralLaw", label: "Undang-undang/hukum acara khusus", type: "textarea", placeholder: "Opsional, misalnya Tipikor/TPPU", full: true }
          ]
        },
        {
          title: "Dasar SPDP dan identitas tersangka",
          description: "Data dasar perkara terisi otomatis.",
          fields: [
            { key: "spdpNumber", label: "Nomor SPDP", type: "text", required: true, source: "case:spdpNumber", sourceLabel: "Data perkara" },
            { key: "spdpDate", label: "Tanggal SPDP", type: "date", required: true, source: "case:spdpDate", sourceLabel: "Data perkara" },
            { key: "suspectName", label: "Nama lengkap", type: "text", required: true, source: "case:suspectName", sourceLabel: "Data perkara" },
            { key: "suspectIdentityNumber", label: "Nomor identitas", type: "text", required: true, source: "case:suspectIdentityNumber", sourceLabel: "Data perkara" },
            { key: "birthPlace", label: "Tempat lahir", type: "text", required: true, source: "case:birthPlace", sourceLabel: "Data perkara" },
            { key: "birthDate", label: "Tanggal lahir", type: "date", required: true, source: "case:birthDate", sourceLabel: "Data perkara" },
            { key: "age", label: "Umur", type: "number", source: "case:age", sourceLabel: "Data perkara" },
            { key: "gender", label: "Jenis kelamin", type: "text", required: true, source: "case:gender", sourceLabel: "Data perkara" },
            { key: "nationality", label: "Kebangsaan/Kewarganegaraan", type: "text", required: true, source: "case:nationality", sourceLabel: "Data perkara" },
            { key: "address", label: "Tempat tinggal", type: "textarea", required: true, source: "case:address", sourceLabel: "Data perkara", full: true },
            { key: "religion", label: "Agama", type: "text", required: true, source: "case:religion", sourceLabel: "Data perkara" },
            { key: "occupation", label: "Pekerjaan", type: "text", required: true, source: "case:occupation", sourceLabel: "Data perkara" },
            { key: "education", label: "Pendidikan", type: "text", required: true, source: "case:education", sourceLabel: "Data perkara" },
            { key: "allegedArticle", label: "Pasal yang disangkakan", type: "textarea", required: true, source: "case:allegedArticle", sourceLabel: "Data perkara", full: true }
          ]
        },
        {
          title: "Tim Penuntut Umum",
          description: "Isi susunan tim sebagaimana lampiran P-16.",
          fields: [
            { key: "teamLeaderName", label: "Nama ketua/penanggung jawab tim", type: "text", required: true, source: "case:prosecutorName|user:fullName", sourceLabel: "Jaksa perkara / akun aktif", editableAuto: true },
            { key: "teamLeaderRank", label: "Pangkat ketua tim", type: "text", required: true },
            { key: "teamLeaderNip", label: "NIP/NRP ketua tim", type: "text", required: true },
            { key: "teamLeaderPosition", label: "Jabatan ketua tim", type: "text", required: true },
            { key: "teamLeaderRole", label: "Kedudukan dalam tim", type: "text", required: true, defaultValue: "Penanggung Jawab Penelitian Berkas Perkara" },
            { key: "member1Name", label: "Nama anggota 1", type: "text" },
            { key: "member1RankNip", label: "Pangkat/NIP anggota 1", type: "text" },
            { key: "member1Position", label: "Jabatan anggota 1", type: "text" },
            { key: "member1Role", label: "Kedudukan anggota 1", type: "text", defaultValue: "Penuntut Umum / Jaksa Peneliti" },
            { key: "member2Name", label: "Nama anggota 2", type: "text" },
            { key: "member2RankNip", label: "Pangkat/NIP anggota 2", type: "text" },
            { key: "member2Position", label: "Jabatan anggota 2", type: "text" },
            { key: "member2Role", label: "Kedudukan anggota 2", type: "text", defaultValue: "Penuntut Umum / Jaksa Peneliti" },
            { key: "additionalTeamMembers", label: "Anggota tim tambahan", type: "textarea", placeholder: "Tuliskan satu anggota per baris: nama | pangkat/NIP | jabatan | kedudukan", full: true }
          ]
        },
        {
          title: "Keterangan tambahan",
          description: "Catatan internal yang tidak tersedia pada data perkara.",
          fields: [
            { key: "additionalInstructions", label: "Perintah/keterangan tambahan", type: "textarea", full: true },
            { key: "copies", label: "Tembusan", type: "textarea", placeholder: "Tuliskan penerima tembusan satu per baris", full: true }
          ]
        }
      ]
    },

    "P-1B": {
      title: "Tanda Terima Penerimaan Berkas Perkara",
      subtitle: "Penerimaan berkas hasil penyidikan/Tahap I",
      referencePages: "Halaman 33",
      sections: [
        ...commonDocument,
        {
          title: "Waktu dan penerima berkas",
          description: "Data petugas Kejaksaan yang menerima berkas.",
          fields: [
            { key: "receiptDate", label: "Tanggal penerimaan", type: "date", required: true, source: "today", sourceLabel: "Tanggal hari ini", editableAuto: true },
            { key: "receiptTime", label: "Jam penerimaan", type: "time", required: true },
            { key: "timeZone", label: "Zona waktu", type: "select", required: true, defaultValue: "WITA", options: ["WIB", "WITA", "WIT"] },
            { key: "receiverName", label: "Nama penerima", type: "text", required: true, source: "user:fullName", sourceLabel: "Akun aktif", editableAuto: true },
            { key: "receiverRank", label: "Pangkat/Gol penerima", type: "text", required: true },
            { key: "receiverNip", label: "NIP/NRP penerima", type: "text", required: true },
            { key: "receiverPosition", label: "Jabatan penerima", type: "select", required: true, options: ["Kabag TU", "Kasubbag Bin", "Kaur Bin", "Lainnya"] }
          ]
        },
        {
          title: "Data penyidik",
          description: "Terisi otomatis dari perkara dan dapat dilengkapi jika diperlukan.",
          fields: [
            { key: "investigatorInstitution", label: "Instansi Penyidik", type: "text", required: true, source: "case:investigatorInstitution", sourceLabel: "Data perkara" },
            { key: "investigatorName", label: "Nama Penyidik", type: "text", required: true, source: "case:investigatorName", sourceLabel: "Data perkara" },
            { key: "investigatorRankNrp", label: "Pangkat/NRP Penyidik", type: "text", required: true, source: "computed:investigatorRankNrp", sourceLabel: "Data perkara" }
          ]
        },
        {
          title: "Data berkas perkara",
          description: "Nomor dan jenis berkas yang diterima.",
          fields: [
            { key: "dossierType", label: "Jenis penerimaan berkas", type: "select", required: true, options: ["Hasil Penyidikan", "Hasil Penyidikan Tambahan", "Tindak Lanjut Hasil Gelar Perkara Bersama"] },
            { key: "copyCount", label: "Jumlah rangkap", type: "number", required: true, defaultValue: "3" },
            { key: "dossierNumber", label: "Nomor Berkas Perkara", type: "text", required: true },
            { key: "dossierDate", label: "Tanggal Berkas Perkara", type: "date", required: true },
            { key: "suspectName", label: "Nama Tersangka", type: "text", required: true, source: "case:suspectName", sourceLabel: "Data perkara" },
            { key: "allegedArticle", label: "Disangka melanggar Pasal", type: "textarea", required: true, source: "case:allegedArticle", sourceLabel: "Data perkara", full: true }
          ]
        },
        {
          title: "Penyerahan dan tanda tangan",
          description: "Identitas pihak yang menyerahkan dan menerima.",
          fields: [
            { key: "senderName", label: "Nama penyidik yang menyerahkan", type: "text", required: true, source: "case:investigatorName", sourceLabel: "Data perkara" },
            { key: "senderRankNrp", label: "Pangkat/NRP penyidik", type: "text", required: true, source: "computed:investigatorRankNrp", sourceLabel: "Data perkara" },
            { key: "receiptNotes", label: "Catatan penerimaan", type: "textarea", full: true }
          ]
        }
      ]
    },

    "P-24": {
      title: "Nota Pendapat Hasil Penelitian Berkas Perkara",
      subtitle: "Penelitian kelengkapan formil dan materil",
      referencePages: "Halaman 74-78",
      sections: [
        ...commonDocument,
        {
          title: "Jaksa peneliti dan dasar surat",
          description: "P-16 dan P-1B diambil dari administrasi yang telah dibuat.",
          fields: [
            { key: "prosecutor1Name", label: "Nama Jaksa Peneliti 1", type: "text", required: true, source: "case:prosecutorName|user:fullName", sourceLabel: "Jaksa perkara / akun aktif", editableAuto: true },
            { key: "prosecutor1Rank", label: "Pangkat Jaksa Peneliti 1", type: "text", required: true },
            { key: "prosecutor1Nip", label: "NIP Jaksa Peneliti 1", type: "text", required: true },
            { key: "prosecutor2Name", label: "Nama Jaksa Peneliti 2", type: "text" },
            { key: "prosecutor2RankNip", label: "Pangkat/NIP Jaksa Peneliti 2", type: "text" },
            { key: "p16Number", label: "Nomor P-16", type: "text", required: true, source: "admin:P-16:documentNumber", sourceLabel: "Administrasi P-16" },
            { key: "p16Date", label: "Tanggal P-16", type: "date", required: true, source: "admin:P-16:documentDate", sourceLabel: "Administrasi P-16" },
            { key: "dossierNumber", label: "Nomor Berkas Perkara", type: "text", required: true, source: "admin:P-1B:field:dossierNumber", sourceLabel: "Administrasi P-1B" },
            { key: "dossierDate", label: "Tanggal Berkas Perkara", type: "date", required: true, source: "admin:P-1B:field:dossierDate", sourceLabel: "Administrasi P-1B" }
          ]
        },
        {
          title: "Identitas dan perkara",
          description: "Data utama perkara terisi otomatis.",
          fields: [
            { key: "suspectName", label: "Nama Tersangka", type: "text", required: true, source: "case:suspectName", sourceLabel: "Data perkara" },
            { key: "suspectIdentity", label: "Identitas Tersangka", type: "textarea", required: true, source: "computed:suspectIdentity", sourceLabel: "Data perkara", full: true },
            { key: "caseSummary", label: "Kasus Posisi", type: "textarea", required: true, source: "case:caseSummary", sourceLabel: "Data perkara", full: true },
            { key: "allegedArticle", label: "Pasal yang disangkakan", type: "textarea", required: true, source: "case:allegedArticle", sourceLabel: "Data perkara", full: true },
            { key: "articleElements", label: "Uraian unsur tindak pidana", type: "textarea", required: true, full: true },
            { key: "punishmentThreat", label: "Ancaman pidana", type: "textarea", required: true, full: true }
          ]
        },
        {
          title: "Hasil penelitian",
          description: "Ringkas hasil penelitian formil dan materil secara terstruktur.",
          fields: [
            { key: "formalReview", label: "Hasil penelitian aspek formil", type: "textarea", required: true, placeholder: "Uraikan kelengkapan penyidik, penyidikan, upaya paksa, hak para pihak, legalitas alat bukti, koordinasi, dan aspek formil lain.", full: true },
            { key: "materialReview", label: "Hasil penelitian aspek materil", type: "textarea", required: true, placeholder: "Uraikan fakta hukum, alat bukti, tempus/locus, unsur delik, kesalahan, pertanggungjawaban pidana, dan aspek materil lain.", full: true },
            { key: "conclusion", label: "Kesimpulan", type: "textarea", required: true, placeholder: "Rangkum kekurangan atau pemenuhan aspek formil dan materil.", full: true },
            { key: "opinion", label: "Pendapat/sikap Penuntut Umum", type: "select", required: true, options: [
              { value: "P-19", label: "Berkas dikembalikan untuk dilengkapi (P-19)" },
              { value: "KOORDINASI", label: "Koordinasi/Gelar Perkara karena penyidikan tambahan belum lengkap" },
              { value: "P-21", label: "Berkas lengkap dan dilanjutkan P-21" }
            ] },
            { key: "instructions", label: "Rincian petunjuk atau tindak lanjut", type: "textarea", required: true, full: true },
            { key: "supervisorOpinion", label: "Pendapat pejabat struktural", type: "textarea", full: true },
            { key: "leadershipDirection", label: "Petunjuk pimpinan", type: "textarea", full: true }
          ]
        }
      ]
    },

    "P-19": {
      title: "Petunjuk Mengenai Hal yang Harus Dilengkapi",
      subtitle: "Pengembalian berkas perkara untuk dilengkapi",
      referencePages: "Halaman 99",
      sections: [
        ...commonDocument,
        {
          title: "Tujuan surat",
          description: "Pihak penyidik yang menerima petunjuk P-19.",
          fields: [
            { key: "recipientTitle", label: "Yth. Penyidik/Atasan Penyidik", type: "text", required: true, source: "computed:investigatorRecipient", sourceLabel: "Data penyidik", editableAuto: true },
            { key: "destination", label: "Tempat tujuan", type: "text", required: true },
            { key: "coordinationDate", label: "Tanggal Berita Acara Koordinasi", type: "date", required: true }
          ]
        },
        {
          title: "Data berkas perkara",
          description: "Data perkara dan berkas diambil otomatis.",
          fields: [
            { key: "suspectName", label: "Nama Tersangka", type: "text", required: true, source: "case:suspectName", sourceLabel: "Data perkara" },
            { key: "allegedArticle", label: "Pasal yang disangkakan", type: "textarea", required: true, source: "case:allegedArticle", sourceLabel: "Data perkara", full: true },
            { key: "dossierNumber", label: "Nomor Berkas Perkara", type: "text", required: true, source: "admin:P-1B:field:dossierNumber", sourceLabel: "Administrasi P-1B" },
            { key: "dossierDate", label: "Tanggal Berkas Perkara", type: "date", required: true, source: "admin:P-1B:field:dossierDate", sourceLabel: "Administrasi P-1B" },
            { key: "dossierReceivedDate", label: "Tanggal berkas diterima", type: "date", required: true, source: "admin:P-1B:field:receiptDate", sourceLabel: "Administrasi P-1B" }
          ]
        },
        {
          title: "Petunjuk kelengkapan",
          description: "Isi harus konsisten dengan koordinasi, check list, dan P-24.",
          fields: [
            { key: "formalInstructions", label: "A. Kelengkapan Formil yang harus dilengkapi", type: "textarea", required: true, full: true },
            { key: "materialInstructions", label: "B. Kelengkapan Materil yang harus dilengkapi", type: "textarea", required: true, full: true },
            { key: "completionDeadlineDays", label: "Batas waktu penyidikan tambahan (hari)", type: "number", required: true, defaultValue: "14" },
            { key: "signatoryName", label: "Nama Penuntut Umum penandatangan", type: "text", required: true, source: "case:prosecutorName|user:fullName", sourceLabel: "Jaksa perkara / akun aktif", editableAuto: true },
            { key: "signatoryRank", label: "Pangkat Penuntut Umum", type: "text", required: true },
            { key: "copies", label: "Tembusan", type: "textarea", full: true }
          ]
        }
      ]
    },

    "P-21": {
      title: "Pemberitahuan Hasil Penyidikan Sudah Lengkap",
      subtitle: "Pemberitahuan berkas lengkap dan jadwal Tahap II",
      referencePages: "Halaman 95-96",
      sections: [
        ...commonDocument,
        {
          title: "Tujuan dan dasar surat",
          description: "Pihak penyidik dan berkas yang dinyatakan lengkap.",
          fields: [
            { key: "recipientTitle", label: "Yth. Atasan Penyidik", type: "text", required: true, source: "computed:investigatorRecipient", sourceLabel: "Data penyidik", editableAuto: true },
            { key: "destination", label: "Tempat tujuan", type: "text", required: true },
            { key: "attachment", label: "Lampiran", type: "text", required: true, defaultValue: "1 (satu) berkas" },
            { key: "letterNature", label: "Sifat surat", type: "select", required: true, defaultValue: "Rahasia", options: ["Rahasia", "Segera", "Biasa"] },
            { key: "dossierNumber", label: "Nomor Berkas Perkara", type: "text", required: true, source: "admin:P-1B:field:dossierNumber", sourceLabel: "Administrasi P-1B" },
            { key: "dossierDate", label: "Tanggal Berkas Perkara", type: "date", required: true, source: "admin:P-1B:field:dossierDate", sourceLabel: "Administrasi P-1B" },
            { key: "dossierReceivedDate", label: "Tanggal berkas diterima", type: "date", required: true, source: "admin:P-1B:field:receiptDate", sourceLabel: "Administrasi P-1B" },
            { key: "suspectName", label: "Nama Tersangka", type: "text", required: true, source: "case:suspectName", sourceLabel: "Data perkara" },
            { key: "allegedArticle", label: "Pasal yang disangkakan", type: "textarea", required: true, source: "case:allegedArticle", sourceLabel: "Data perkara", full: true },
            { key: "researchConclusion", label: "Kesimpulan penelitian berkas", type: "textarea", required: true, source: "admin:P-24:field:conclusion", sourceLabel: "Administrasi P-24", full: true }
          ]
        },
        {
          title: "Jadwal penyerahan tersangka dan barang bukti",
          description: "Tahap II dapat dilakukan sekaligus atau bertahap.",
          fields: [
            { key: "evidenceHandoverDateTime", label: "Hari/tanggal/pukul penelitian barang bukti", type: "datetime-local", required: true },
            { key: "evidenceHandoverPlace", label: "Tempat penelitian barang bukti", type: "text", required: true },
            { key: "suspectHandoverDateTime", label: "Hari/tanggal/pukul penyerahan tersangka", type: "datetime-local", required: true },
            { key: "suspectHandoverPlace", label: "Tempat penyerahan tersangka", type: "text", required: true },
            { key: "handoverDeadlineDays", label: "Batas waktu pelaksanaan (hari)", type: "number", required: true, defaultValue: "14" }
          ]
        },
        {
          title: "Penandatangan dan tanda terima",
          description: "Data pejabat penandatangan dan penyidik penerima P-21.",
          fields: [
            { key: "signatoryTitle", label: "Jabatan penandatangan", type: "text", required: true, defaultValue: "Kepala Kejaksaan Negeri selaku Penanggung Jawab Penuntutan" },
            { key: "signatoryName", label: "Nama penandatangan", type: "text", required: true },
            { key: "signatoryRank", label: "Pangkat penandatangan", type: "text", required: true },
            { key: "receiptRecipientName", label: "Nama penyidik penerima P-21", type: "text", required: true, source: "case:investigatorName", sourceLabel: "Data perkara", editableAuto: true },
            { key: "receiptRecipientRankNrp", label: "Pangkat/NRP penerima", type: "text", required: true, source: "computed:investigatorRankNrp", sourceLabel: "Data perkara", editableAuto: true },
            { key: "receiptDeliveryName", label: "Nama petugas yang menyampaikan", type: "text", required: true, source: "case:prosecutorName|user:fullName", sourceLabel: "Jaksa perkara / akun aktif", editableAuto: true },
            { key: "copies", label: "Tembusan", type: "textarea", full: true }
          ]
        }
      ]
    },

    "P-29": {
      title: "Surat Dakwaan",
      subtitle: "Penyusunan dakwaan untuk penuntutan",
      referencePages: "Halaman 79-91",
      sections: [
        ...commonDocument,
        {
          title: "Nomor register dan jenis terdakwa",
          description: "Nomor register dapat disesuaikan dengan register PDM yang berlaku.",
          fields: [
            { key: "registerNumber", label: "Nomor Register Perkara", type: "text", required: true, source: "case:courtCaseNumber|case:caseId", sourceLabel: "Register perkara", editableAuto: true },
            { key: "defendantType", label: "Jenis terdakwa", type: "select", required: true, defaultValue: "ORANG_DEWASA", options: [
              { value: "ORANG_DEWASA", label: "Orang Perorangan Dewasa" },
              { value: "ANAK", label: "Anak" },
              { value: "KORPORASI", label: "Korporasi" }
            ] },
            { key: "indictmentStructure", label: "Bentuk surat dakwaan", type: "select", required: true, options: ["Tunggal", "Alternatif", "Subsidair/Berlapis", "Kumulatif", "Kombinasi"] }
          ]
        },
        {
          title: "Identitas terdakwa",
          description: "Identitas awal terisi otomatis dari data tersangka.",
          fields: [
            { key: "suspectName", label: "Nama lengkap", type: "text", required: true, source: "case:suspectName", sourceLabel: "Data perkara" },
            { key: "suspectIdentityNumber", label: "Nomor identitas", type: "text", required: true, source: "case:suspectIdentityNumber", sourceLabel: "Data perkara" },
            { key: "birthPlace", label: "Tempat lahir", type: "text", required: true, source: "case:birthPlace", sourceLabel: "Data perkara" },
            { key: "birthDate", label: "Tanggal lahir", type: "date", required: true, source: "case:birthDate", sourceLabel: "Data perkara" },
            { key: "age", label: "Umur", type: "number", source: "case:age", sourceLabel: "Data perkara" },
            { key: "gender", label: "Jenis kelamin", type: "text", required: true, source: "case:gender", sourceLabel: "Data perkara" },
            { key: "nationality", label: "Kebangsaan/Kewarganegaraan", type: "text", required: true, source: "case:nationality", sourceLabel: "Data perkara" },
            { key: "address", label: "Tempat tinggal", type: "textarea", required: true, source: "case:address", sourceLabel: "Data perkara", full: true },
            { key: "religion", label: "Agama", type: "text", required: true, source: "case:religion", sourceLabel: "Data perkara" },
            { key: "occupation", label: "Pekerjaan", type: "text", required: true, source: "case:occupation", sourceLabel: "Data perkara" },
            { key: "education", label: "Pendidikan", type: "text", required: true, source: "case:education", sourceLabel: "Data perkara" }
          ]
        },
        {
          title: "Status penangkapan dan penahanan",
          description: "Uraikan riwayat penangkapan, penahanan, pengalihan, penangguhan, pembantaran, dan perpanjangan.",
          fields: [
            { key: "arrestDetentionStatus", label: "Status penangkapan dan penahanan", type: "textarea", required: true, placeholder: "Contoh: Ditahan oleh Penyidik di Rutan sejak ... s.d. ...; diperpanjang Penuntut Umum sejak ... s.d. ...", full: true }
          ]
        },
        {
          title: "Uraian dakwaan",
          description: "Lengkapi tempus, locus, perbuatan, unsur, dan pasal dakwaan.",
          fields: [
            { key: "caseSummary", label: "Ringkasan kasus posisi", type: "textarea", required: true, source: "case:caseSummary", sourceLabel: "Data perkara", full: true },
            { key: "tempusDelicti", label: "Tempus delicti", type: "textarea", required: true, full: true },
            { key: "locusDelicti", label: "Locus delicti", type: "textarea", required: true, full: true },
            { key: "modusOperandi", label: "Modus operandi", type: "textarea", required: true, full: true },
            { key: "factualNarrative", label: "Uraian lengkap perbuatan terdakwa", type: "textarea", required: true, placeholder: "Susun uraian secara cermat, jelas, lengkap, kronologis, dan menghubungkan fakta dengan unsur pasal.", full: true },
            { key: "chargedArticle", label: "Pasal yang didakwakan", type: "textarea", required: true, source: "case:allegedArticle", sourceLabel: "Data perkara", editableAuto: true, full: true },
            { key: "articleElements", label: "Uraian pemenuhan unsur pasal", type: "textarea", required: true, full: true },
            { key: "evidenceSummary", label: "Alat bukti dan barang bukti pendukung", type: "textarea", required: true, source: "case:evidence", sourceLabel: "Data perkara", editableAuto: true, full: true },
            { key: "closingFormula", label: "Rumusan penutup dakwaan", type: "textarea", required: true, placeholder: "Contoh: Perbuatan Terdakwa sebagaimana diatur dan diancam pidana dalam Pasal ...", full: true }
          ]
        },
        {
          title: "Penuntut Umum",
          description: "Data penandatangan surat dakwaan.",
          fields: [
            { key: "prosecutorName", label: "Nama Penuntut Umum", type: "text", required: true, source: "case:prosecutorName|user:fullName", sourceLabel: "Jaksa perkara / akun aktif", editableAuto: true },
            { key: "prosecutorRank", label: "Pangkat Penuntut Umum", type: "text", required: true },
            { key: "prosecutorNip", label: "NIP Penuntut Umum", type: "text", required: true },
            { key: "additionalNotes", label: "Catatan penyusunan dakwaan", type: "textarea", full: true }
          ]
        }
      ]
    }
  };

  window.SIAP_ADMIN_FORM_SCHEMAS = Object.freeze(schemas);
})();
