# FreelancerCRM çalışma kuralları

- `plan.md` normatif görev kapsamı ve kabul kriterleri kaynağıdır; ilerleme `implementation_status.md` içinde tutulur.
- Görevleri TASK numarasına göre sırayla ele al. Önce en düşük numaralı tamamlanmamış görevi bitirip kabul kriterlerini doğrula; ancak sonra sonraki göreve geç. Kısmi veya bloke görev tamamlanmış sayılmaz.
- Tek seferlik geçiş istisnası (2026-09-28): Kullanıcı preview/staging/production Supabase projelerini yayına çıkışa ertelediği için TASK-003 kısmi kalırken TASK-004 üzerinde çalışılabilir. TASK-004'ün ilk işi, TASK-003'ün yerelde tamamlanabilir açık kapılarını (özellikle otomatik secret taramasını) doğrulayıp ilerlemeyi TASK-003'e de kaydetmektir. Bu istisna TASK-003'ü tamamlandı saymaz, TASK-005 veya sonraki görevlere geçiş izni vermez ve başka görevlere örnek oluşturmaz.
- Kullanıcının açıkça istediği farklı bir görev, sıralama için istisnadır; yalnız istenen kapsamda çalış ve ardından ilk tamamlanmamış göreve dön. Gerekli altyapı işi başka bir göreve aitse bunu sessizce o görevin tamamlanması olarak genişletme.
- Bir görevin uygulanması başka bir görevin ürün kararı, kapsamı, güvenlik modeli veya verisiyle çakışıyorsa değişiklik yapmadan önce çakışmayı ve seçenekleri kullanıcıya açıkça sor. Yanıt gelene kadar çakışan değişikliği yapma.
- Önceden yapılmış sıra dışı değişiklikleri kendiliğinden silme veya geri alma; önce kapsamını bildir ve kullanıcıdan yön iste. `implementation_status.md` içinde yalnız doğrulanmış tamamlanmayı işaretle.
- Verili yerel/uzak veritabanını sıfırlamadan veya mevcut kayıtları silmeden önce içeriği kontrol et; veri varsa kullanıcıdan açık onay al.
