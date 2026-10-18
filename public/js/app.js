document.addEventListener("DOMContentLoaded", () => {
    veriYukle();

    document.getElementById("ogrenciFormu").addEventListener("submit", function(e) {
        e.preventDefault();
        ogrenciKaydet();
    });
});

let tumKulupler = [];
let tumOgrenciler = [];
let tumEtkinlikler = [];

async function veriYukle() {
    try {
        const [kulupRes, ogrenciRes, etkinlikRes] = await Promise.all([
            fetch('/api/kulupler'),
            fetch('/api/ogrenciler'),
            fetch('/api/etkinlikler')
        ]);

        tumKulupler = await kulupRes.json();
        tumOgrenciler = await ogrenciRes.json();
        tumEtkinlikler = await etkinlikRes.json();

        ekranlariGuncelle();
    } catch (err) {
        console.error("Veri yüklenirken hata oluştu:", err);
    }
}

function ekranlariGuncelle() {
    istatistikleriGuncelle();
    kulupSecimleriDoldur();
    kulupKartlariniOlustur(tumKulupler);
    etkinlikleriListele();
    
    // Eğer yönetim paneli açıksa dinamik listeleri güncelle
    if (document.getElementById("yonetimPaneli").style.display === "block") {
        panelGuncelle();
    }
}

function istatistikleriGuncelle() {
    const toplamOgrenci = tumOgrenciler.length;
    const toplamBosKontenjan = 1000 - toplamOgrenci;

    document.getElementById("statToplamOgrenci").innerText = toplamOgrenci + " Öğrenci";
    document.getElementById("statToplamBos").innerText = toplamBosKontenjan + " Kontenjan";
}

function kulupSecimleriDoldur() {
    const kulupSecim = document.getElementById("kulupSecim");
    const yonetimKulupSec = document.getElementById("yonetimKulupSec");

    const seciliDegerKayit = kulupSecim.value;
    const seciliDegerYonetim = yonetimKulupSec.value;

    kulupSecim.innerHTML = '<option value="">-- Kulüp Seçiniz --</option>';
    yonetimKulupSec.innerHTML = '';

    tumKulupler.forEach(k => {
        kulupSecim.innerHTML += `<option value="${k.id}">${k.ad} (Boş: ${k.kontenjan})</option>`;
        yonetimKulupSec.innerHTML += `<option value="${k.id}">${k.ad}</option>`;
    });

    if (seciliDegerKayit) kulupSecim.value = seciliDegerKayit;
    if (seciliDegerYonetim) yonetimKulupSec.value = seciliDegerYonetim;
}

function kulupKartlariniOlustur(kulupler) {
    const container = document.getElementById("kulupKartlari");
    container.innerHTML = '';

    kulupler.forEach(k => {
        container.innerHTML += `
            <div class="kulup-card">
                <div>
                    <span class="badge">${k.kategori}</span>
                    <h3>${k.ad}</h3>
                    <p>${k.bilgi}</p>
                </div>
                <div style="font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;">
                    <b>Kontenjan:</b> ${k.kontenjan} <br>
                    <b>Danışman:</b> ${k.ogretmen1}
                </div>
            </div>
        `;
    });
}

function kulupFiltrele() {
    const arama = document.getElementById("kulupArama").value.toLowerCase();
    const filtrelenmis = tumKulupler.filter(k => 
        k.ad.toLowerCase().includes(arama) || k.kategori.toLowerCase().includes(arama)
    );
    kulupKartlariniOlustur(filtrelenmis);
}

async function ogrenciKaydet() {
    const data = {
        kulup_id: document.getElementById("kulupSecim").value,
        ad: document.getElementById("ogrenciAd").value.trim(),
        sinif: document.getElementById("seviyeSecim").value + " " + document.getElementById("subeSecim").value
    };

    const res = await fetch('/api/ogrenci-ekle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const sonuc = await res.json();
    if (res.ok) {
        alert("Öğrenci başarıyla kaydedildi!");
        document.getElementById("ogrenciFormu").reset();
        veriYukle();
    } else {
        alert("Hata: " + sonuc.error);
    }
}

// Akıllı Öneri Sihirbazı
function kulupOnerisiGetir() {
    const secilenIlgi = document.getElementById("ilgiAlaniSec").value;
    const uygunKulupler = tumKulupler.filter(k => k.kategori === secilenIlgi);
    const sonucAlani = document.getElementById("oneriSonucAlani");

    if (uygunKulupler.length === 0) {
        sonucAlani.innerHTML = "<p style='color:red;'>Bu kategoride kulüp bulunamadı.</p>";
        return;
    }

    sonucAlani.innerHTML = "<b style='font-size:13px; color:var(--primary-color);'>Sizin İçin Önerilen Kulüpler:</b>";
    uygunKulupler.forEach(k => {
        sonucAlani.innerHTML += `
            <div style="background:#f1f5f9; padding:8px; border-radius:6px; margin-top:5px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:12px; font-weight:600;">${k.ad}</span>
                <button type="button" class="btn btn-mavi" style="margin:0; padding:4px 8px; font-size:11px; width:auto;" onclick="kulubuSecVeGit(${k.id})">Seç & Kaydol</button>
            </div>
        `;
    });
}

function kulubuSecVeGit(kulupId) {
    document.getElementById("kulupSecim").value = kulupId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Öğretmen Paneli İşlemleri
async function girisYap() {
    const sifre = document.getElementById("sifreInput").value;
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sifre })
    });

    if (res.ok) {
        document.getElementById("girisAlani").style.display = "none";
        document.getElementById("yonetimPaneli").style.display = "block";
        panelGuncelle();
    } else {
        alert("Hatalı şifre!");
    }
}

function panelGuncelle() {
    const kulupId = document.getElementById("yonetimKulupSec").value;
    const seciliKulup = tumKulupler.find(k => k.id == kulupId);
    if (!seciliKulup) return;

    document.getElementById("ogretmen1Ad").value = seciliKulup.ogretmen1 !== 'Atanmadı' ? seciliKulup.ogretmen1 : '';
    document.getElementById("ogretmen2Ad").value = seciliKulup.ogretmen2 !== 'Atanmadı' ? seciliKulup.ogretmen2 : '';

    const kulupOgrencileri = tumOgrenciler.filter(o => o.kulup_id == kulupId);
    const baskanSec = document.getElementById("baskanSec");
    const yardimciSec = document.getElementById("yardimciSec");

    baskanSec.innerHTML = '<option value="Atanmadı">-- Başkan Seç --</option>';
    yardimciSec.innerHTML = '<option value="Atanmadı">-- Yardımcı Seç --</option>';

    kulupOgrencileri.forEach(o => {
        baskanSec.innerHTML += `<option value="${o.ad}">${o.ad} (${o.sinif})</option>`;
        yardimciSec.innerHTML += `<option value="${o.ad}">${o.ad} (${o.sinif})</option>`;
    });

    baskanSec.value = seciliKulup.baskan;
    yardimciSec.value = seciliKulup.yardimci;

    ogrenciListesiniCiz(kulupOgrencileri);
}

function ogrenciListesiniCiz(liste) {
    const listeDiv = document.getElementById("ogrenciListe");
    if (liste.length === 0) {
        listeDiv.innerHTML = "<p style='font-size:12px; color:#64748b;'>Bu kulüpte henüz öğrenci bulunmuyor.</p>";
        return;
    }

    listeDiv.innerHTML = '<div style="max-height: 150px; overflow-y: auto;">';
    liste.forEach(o => {
        listeDiv.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 0; border-bottom:1px solid #e2e8f0; font-size:12px;">
                <span><b>${o.ad}</b> (${o.sinif})</span>
                <button type="button" class="btn btn-kirmizi" style="margin:0; padding:2px 6px; font-size:10px; width:auto;" onclick="ogrenciSil(${o.id}, ${o.kulup_id})">Sil</button>
            </div>
        `;
    });
    listeDiv.innerHTML += '</div>';
}

function ogrenciFiltrele() {
    const arama = document.getElementById("ogrenciArama").value.toLowerCase();
    const kulupId = document.getElementById("yonetimKulupSec").value;
    const kulupOgrencileri = tumOgrenciler.filter(o => o.kulup_id == kulupId);
    
    const filtrelenmis = kulupOgrencileri.filter(o => 
        o.ad.toLowerCase().includes(arama) || o.sinif.toLowerCase().includes(arama)
    );
    ogrenciListesiniCiz(filtrelenmis);
}

async function ogrenciSil(id, kulup_id) {
    if (!confirm("Öğrenciyi kulüpten silmek istediğinize emin misiniz?")) return;

    const res = await fetch('/api/ogrenci-sil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, kulup_id })
    });

    if (res.ok) {
        veriYukle();
    } else {
        alert("Silme işleminde hata oluştu.");
    }
}

async function ogretmenleriKaydet() {
    const kulupId = document.getElementById("yonetimKulupSec").value;
    const ogretmen1 = document.getElementById("ogretmen1Ad").value;
    const ogretmen2 = document.getElementById("ogretmen2Ad").value;
    const seciliKulup = tumKulupler.find(k => k.id == kulupId);

    const data = {
        id: kulupId,
        ogretmen1,
        ogretmen2,
        baskan: seciliKulup.baskan,
        yardimci: seciliKulup.yardimci
    };

    const res = await fetch('/api/kulup-guncelle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (res.ok) {
        alert("Danışman öğretmenler kaydedildi!");
        veriYukle();
    }
}

async function yonetimKaydet() {
    const kulupId = document.getElementById("yonetimKulupSec").value;
    const seciliKulup = tumKulupler.find(k => k.id == kulupId);
    const baskan = document.getElementById("baskanSec").value;
    const yardimci = document.getElementById("yardimciSec").value;

    const data = {
        id: kulupId,
        ogretmen1: seciliKulup.ogretmen1,
        ogretmen2: seciliKulup.ogretmen2,
        baskan,
        yardimci
    };

    const res = await fetch('/api/kulup-guncelle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (res.ok) {
        alert("Kulüp yönetimi güncellendi!");
        veriYukle();
    }
}

// Etkinlik İşlemleri
async function etkinlikEkle() {
    const data = {
        kulup_id: document.getElementById("yonetimKulupSec").value,
        baslik: document.getElementById("etkinlikBaslik").value,
        tarih: document.getElementById("etkinlikTarih").value,
        aciklama: document.getElementById("etkinlikAciklama").value
    };

    if (!data.baslik || !data.tarih) {
        alert("Lütfen başlık ve tarih giriniz!");
        return;
    }

    const res = await fetch('/api/etkinlik-ekle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (res.ok) {
        alert("Etkinlik yayınlandı!");
        document.getElementById("etkinlikBaslik").value = '';
        document.getElementById("etkinlikTarih").value = '';
        document.getElementById("etkinlikAciklama").value = '';
        veriYukle();
    }
}

function etkinlikleriListele() {
    const listDiv = document.getElementById("etkinlikListesi");
    listDiv.innerHTML = '';

    if (tumEtkinlikler.length === 0) {
        listDiv.innerHTML = "<p style='font-size:13px; color:#64748b;'>Henüz planlanmış bir etkinlik bulunmuyor.</p>";
        return;
    }

    tumEtkinlikler.forEach(e => {
        listDiv.innerHTML += `
            <div style="background:#f8fafc; border:1px solid var(--border-color); border-left:4px solid var(--success-color); padding:10px; border-radius:6px;">
                <span style="font-size:11px; font-weight:bold; color:var(--secondary-color);">${e.kulup_adi || 'Genel'} — ${e.tarih}</span>
                <h4 style="font-size:14px; color:var(--primary-color); margin:3px 0;">${e.baslik}</h4>
                <p style="font-size:12px; color:#475569;">${e.aciklama}</p>
            </div>
        `;
    });
}

// Raporlama (CSV İndir ve Yazdır)
function excelIndir() {
    const kulupId = document.getElementById("yonetimKulupSec").value;
    const seciliKulup = tumKulupler.find(k => k.id == kulupId);
    const kulupOgrencileri = tumOgrenciler.filter(o => o.kulup_id == kulupId);

    let csvContent = "\uFEFFÖğrenci Adı,Sınıf,Kulüp\n";
    kulupOgrencileri.forEach(o => {
        csvContent += `"${o.ad}","${o.sinif}","${seciliKulup.ad}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${seciliKulup.ad}_ogrenci_listesi.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function listeyiYazdir() {
    const kulupId = document.getElementById("yonetimKulupSec").value;
    const seciliKulup = tumKulupler.find(k => k.id == kulupId);
    const kulupOgrencileri = tumOgrenciler.filter(o => o.kulup_id == kulupId);

    let printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Resmi Kulüp Listesi</title>');
    printWindow.document.write('<style>body{font-family:sans-serif; padding:20px;} table{width:100%; border-collapse:collapse; margin-top:20px;} th, td{border:1px solid #000; padding:8px; text-align:left; font-size:13px;} th{background:#eee;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h2>T.C. MİLLÎ EĞİTİM BAKANLIĞI</h2>');
    printWindow.document.write('<h3>Atatürk Anadolu Müdürlüğü — Kulüp Üye Listesi</h3>');
    printWindow.document.write(`<p><b>Kulüp Adı:</b> ${seciliKulup.ad} <br> <b>Danışman Öğretmenler:</b> ${seciliKulup.ogretmen1}, ${seciliKulup.ogretmen2}</p>`);
    printWindow.document.write('<table><thead><tr><th>Sıra</th><th>Öğrenci Adı Soyadı</th><th>Sınıfı</th></tr></thead><tbody>');
    
    kulupOgrencileri.forEach((o, index) => {
        printWindow.document.write(`<tr><td>${index + 1}</td><td>${o.ad}</td><td>${o.sinif}</td></tr>`);
    });

    printWindow.document.write('</tbody></table>');
    printWindow.document.write('<br><br><div style="display:flex; justify-content:space-between; margin-top:50px;"><div><b>Danışman Öğretmen</b><br><br>İmza</div><div><b>Okul Müdürü</b><br><br>Mühür / İmza</div></div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}