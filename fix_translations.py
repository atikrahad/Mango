# -*- coding: utf-8 -*-
path = '/home/atik/Personal/Mango/apps/web/src/app/translations.ts'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

changes = 0

for i, line in enumerate(lines):
    lineno = i + 1

    # Line 334: faqA3 BN - remove খড় দিয়ে প্যাক
    if lineno == 334 and 'খড়' in line:
        old = line
        lines[i] = line.replace('খড় দিয়ে প্যাক করে', 'পরিবেশবান্ধব কাগজে প্যাক করে')
        print(f"Fixed line {lineno}: faqA3 BN — {'changed' if lines[i] != old else 'NO CHANGE'}")
        changes += 1

    # Line 427: footerDesc BN
    if lineno == 427 and 'রাজশাহী' in line:
        eol = '\r\n' if '\r\n' in line else '\n'
        lines[i] = "    footerDesc: 'নওগাঁর সাপাহার ও পোরশার সমবায় চাষী জোট থেকে সরাসরি নিরাপদ, অর্গানিক এবং প্রাকৃতিকভাবে পাকানো প্রিমিয়াম আম আপনার দরজায় পৌঁছে দেওয়া হচ্ছে।'," + eol
        print(f"Fixed line {lineno}: footerDesc BN")
        changes += 1

print(f"\nTotal changes: {changes}")
with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Saved.")
