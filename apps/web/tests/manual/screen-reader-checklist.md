# Optional VoiceOver quality checklist

Status: **Optional — outside TASK-002 acceptance**  
Target duration: **5 minutes**  
Recommended setup: macOS VoiceOver with Safari; repeat in Chrome if time allows.

This checklist is not part of TASK-002 acceptance. TASK-002 accessibility acceptance is provided by the automated axe, ARIA/live-region, keyboard, focus, responsive, and Chromium/Firefox/WebKit test matrix. Leaving this checklist unrun is not a missing, partial, or blocked task state.

The automated matrix and this optional web spot-check must not be used to claim “VoiceOver supported” in App Store or marketing content. If a native application is released, create a separate platform-specific VoiceOver quality plan and evaluate it independently.

## Optional web spot-check

1. Run `npm run dev`, open `http://localhost:3000/#waitlist`, and enable VoiceOver with `Command-F5`.
2. Reach the waitlist form with landmarks or headings. Submit the empty form with the keyboard. Confirm that focus moves to “E-posta adresin” and its label, invalid state, and “E-posta adresini gir.” message are announced once.
3. Enter a new valid email, choose a persona, and toggle “İsteğe bağlı: Alpha süreci dışındaki ürün duyurularını da almak istiyorum.” Confirm that the checkbox is announced as checked/unchecked, then submit and confirm the success status is announced once.
4. In DevTools, run the snippet below, submit a different valid email, and confirm the safe storage alert is announced once without the technical exception text.

   ```js
   const originalSetItem = Storage.prototype.setItem;
   Storage.prototype.setItem = function (key, value) {
     if (key === "kapsam-alpha-waitlist-v1") {
       throw new DOMException("Manual storage failure", "QuotaExceededError");
     }
     return originalSetItem.call(this, key, value);
   };
   ```

5. Open `http://localhost:3000/test-fixtures/ui-states`. Confirm that “Devre dışı işlem” is skipped by Tab, “Bildirim seçimi” announces its state, “Test içeriği yükleniyor” is discoverable as a status, and “İçerik yüklenemedi” is an alert. Activate “Tekrar dene” and confirm “Tekrar denendi” is announced; confirm “Kaydı sil” also has a clear name.

If this optional check is run, record the date, browser/OS versions, and result below. A pending result does not affect TASK-002 completion.

- Date: Not run (optional)
- Environment: Not run (optional)
- Result: Not run (optional)
- Notes: No TASK-002 action required
