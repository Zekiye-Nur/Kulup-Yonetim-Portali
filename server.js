const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 2603;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./okul.db', (err) => {
    if (err) console.error("Veritabanı hatası:", err.message);
    else console.log("Kulüp Yönetim Portalı SQLite veritabanına bağlandı.");
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS kulupler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT UNIQUE,
        bilgi TEXT,
        kategori TEXT,
        kontenjan INTEGER DEFAULT 40,
        ogretmen1 TEXT DEFAULT 'Atanmadı',
        ogretmen2 TEXT DEFAULT 'Atanmadı',
        baskan TEXT DEFAULT 'Atanmadı',
        yardimci TEXT DEFAULT 'Atanmadı'
    )`, () => {
        const yararliKulupler = [
            ["💻 Siber Güvenlik & Yazılım", "Ağ güvenliği, yazılım ve temel kodlama becerileri kazandırır.", "Yazılım & Teknoloji", 40],
            ["🚀 İHA / SİHA & TEKNOFEST", "Model uçak, drone tasarımı ve teknoloji yarışmalarına hazırlar.", "Yazılım & Teknoloji", 40],
            ["🤖 Robotik & Yapay Zeka", "Arduino, sensör projeleri ve yapay zeka temellerini öğretir.", "Yazılım & Teknoloji", 40],
            ["♟️ Satranç & Akıl Oyunları", "Stratejik düşünme, öngörü ve zeka oyunları becerisi geliştirir.", "Akademik & Bilim", 40],
            ["🗣️ Münazara & Hitabet", "Topluluk önünde özgüvenle konuşma ve kendini ifade etme yeteneği kazandırır.", "Akademik & Bilim", 40],
            ["📐 Matematik & Olimpiyat", "Matematiksel bulmacalar, olimpiyat hazırlık ve analitik düşünce sağlar.", "Akademik & Bilim", 40],
            ["📚 Edebiyat & Kütüphanecilik", "Kitap okuma alışkanlığı kazandırır, yazar söyleşileri düzenler.", "Akademik & Bilim", 40],
            ["🌐 Yabancı Diller & İngilizce", "Pratik İngilizce konuşma kulübü ve yabancı kültür etkinlikleri yapar.", "Akademik & Bilim", 40],
            ["🎭 Tiyatro & Drama", "Sahne sanatları, diksiyon ve özgüven geliştirme çalışmaları yapar.", "Oyun & Sanat", 40],
            ["🎸 Müzik & Okul Orkestrası", "Enstrüman çalma becerisi, okul korosu ve konser etkinlikleri düzenler.", "Oyun & Sanat", 40],
            ["🎨 Resim & Görsel Sanatlar", "Tuval çalışmaları, perspektif ve el becerisi atölyeleri kurar.", "Oyun & Sanat", 40],
            ["📷 Sinema & Fotoğrafçılık", "Kısa film çekimi, kare kompozisyonu ve görsel hikaye anlatımı sağlar.", "Oyun & Sanat", 40],
            ["⚽ Futbol & Basketbol", "Takım çalışması, futbol ve basketbol turnuvaları organize eder.", "Spor", 40],
            ["🏐 Voleybol & Masa Tenisi", "Voleybol ve masa tenisi ligleriyle aktif spor alışkanlığı kazandırır.", "Spor", 40],
            ["🚴 Doğa Sporları & Bisiklet", "Sağlıklı yaşam bilinci, doğa yürüyüşleri ve bisiklet turları düzenler.", "Spor", 40],
            ["❤️ Kızılay & Kan Bağışı", "Toplumsal yardımlaşma bilinci ve ilk yardım farkındalığı oluşturur.", "Sosyal Sorumluluk", 40],
            ["🟢 Yeşilay Kulübü", "Bağımlılıkla mücadele, irade eğitimi ve sağlıklı yaşam seminerleri verir.", "Sosyal Sorumluluk", 40],
            ["🌱 Çevre & Sıfır Atık", "Geri dönüşüm projeleri, fidan dikimi ve doğayı koruma bilinci aşılar.", "Sosyal Sorumluluk", 40],
            ["🤝 Sosyal Sorumluluk & Gönüllülük", "Huzurevi ziyaretleri ve toplumsal gönüllülük projeleri yürütür.", "Sosyal Sorumluluk", 40],
            ["💡 Girişimcilik & İnovasyon", "Genç fikirler üretme, proje yönetimi ve iş geliştirme atölyeleri yapar.", "Yazılım & Teknoloji", 40],
            ["🔭 Astronomi & Uzay Bilimleri", "Gök cisimlerini inceleme, teleskop gözlemleri ve evren bilinci kazandırır.", "Akademik & Bilim", 40],
            ["🌍 Coğrafya & Gezi", "Ülkemizin tarihi ve coğrafi zenginliklerini tanıtan geziler planlar.", "Sosyal Sorumluluk", 40],
            ["📜 Tarih & Kültür Mirası", "Müze gezileri, yerel tarih araştırmaları ve kültürel bilinç kazandırır.", "Akademik & Bilim", 40],
            ["📰 Okul Gazetesi & Basın", "Röportaj yapma, yazarlık ve dönemlik okul bülteni çıkarma becerisi verir.", "Oyun & Sanat", 40],
            ["🏛️ Model Birleşmiş Milletler (MUN)", "Küresel meseleleri tartışma, diplomasi ve İngilizce münazara becerisi kazandırır.", "Akademik & Bilim", 40]
        ];

        yararliKulupler.forEach(k => {
            db.run(`INSERT OR IGNORE INTO kulupler (ad, bilgi, kategori, kontenjan) VALUES (?, ?, ?, ?)`, k);
        });
    });

    db.run(`CREATE TABLE IF NOT EXISTS ogrenciler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT NOT NULL UNIQUE,
        sinif TEXT NOT NULL,
        kulup_id INTEGER,
        FOREIGN KEY (kulup_id) REFERENCES kulupler(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS etkinlikler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kulup_id INTEGER,
        baslik TEXT,
        tarih TEXT,
        aciklama TEXT,
        FOREIGN KEY (kulup_id) REFERENCES kulupler(id)
    )`);
});

app.post('/api/login', (req, res) => {
    const { sifre } = req.body;
    if (sifre === "ogretmen123") {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Hatalı şifre!" });
    }
});

app.get('/api/kulupler', (req, res) => {
    db.all("SELECT * FROM kulupler", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/ogrenciler', (req, res) => {
    db.all("SELECT o.*, k.ad as kulup_adi FROM ogrenciler o LEFT JOIN kulupler k ON o.kulup_id = k.id", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/etkinlikler', (req, res) => {
    db.all("SELECT e.*, k.ad as kulup_adi FROM etkinlikler e LEFT JOIN kulupler k ON e.kulup_id = k.id", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/ogrenci-ekle', (req, res) => {
    const { ad, sinif, kulup_id } = req.body;
    db.get("SELECT * FROM ogrenciler WHERE ad = ?", [ad], (err, row) => {
        if (row) return res.status(400).json({ error: "Bu öğrenci zaten başka bir kulübe kayıtlı!" });

        db.get("SELECT kontenjan FROM kulupler WHERE id = ?", [kulup_id], (err, kulup) => {
            if (!kulup || kulup.kontenjan <= 0) return res.status(400).json({ error: "Kulüp genel kontenjanı dolu!" });

            db.get("SELECT COUNT(*) as sayi FROM ogrenciler WHERE kulup_id = ? AND sinif = ?", [kulup_id, sinif], (err, sinifCount) => {
                if (err) return res.status(500).json({ error: err.message });

                if (sinifCount.sayi >= 3) {
                    return res.status(400).json({ error: `Bu kulübe ${sinif} sınıfından maksimum 3 öğrenci girebilir!` });
                }

                db.run("INSERT INTO ogrenciler (ad, sinif, kulup_id) VALUES (?, ?, ?)", [ad, sinif, kulup_id], function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    db.run("UPDATE kulupler SET kontenjan = kontenjan - 1 WHERE id = ?", [kulup_id]);
                    res.json({ success: true });
                });
            });
        });
    });
});

app.post('/api/ogrenci-sil', (req, res) => {
    const { id, kulup_id } = req.body;
    db.run("DELETE FROM ogrenciler WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.run("UPDATE kulupler SET kontenjan = kontenjan + 1 WHERE id = ?", [kulup_id]);
        res.json({ success: true });
    });
});

app.post('/api/etkinlik-ekle', (req, res) => {
    const { kulup_id, baslik, tarih, aciklama } = req.body;
    db.run("INSERT INTO etkinlikler (kulup_id, baslik, tarih, aciklama) VALUES (?, ?, ?, ?)", [kulup_id, baslik, tarih, aciklama], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/etkinlik-sil', (req, res) => {
    const { id } = req.body;
    db.run("DELETE FROM etkinlikler WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/etkinlik-guncelle', (req, res) => {
    const { id, baslik, tarih, aciklama } = req.body;
    db.run("UPDATE etkinlikler SET baslik = ?, tarih = ?, aciklama = ? WHERE id = ?", 
        [baslik, tarih, aciklama, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/kulup-guncelle', (req, res) => {
    const { id, ogretmen1, ogretmen2, baskan, yardimci } = req.body;
    db.run("UPDATE kulupler SET ogretmen1 = ?, ogretmen2 = ?, baskan = ?, yardimci = ? WHERE id = ?", 
        [ogretmen1 || 'Atanmadı', ogretmen2 || 'Atanmadı', baskan, yardimci, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kulüp Yönetim Portalı aktif! Bilgisayardan erişim: http://localhost:${PORT}`);
});