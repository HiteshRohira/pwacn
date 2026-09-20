# Native reference library

Store local native recordings beside the annotation files in `ios/` and `android/`.
Recordings are intentionally git-ignored; annotations and provenance are committed.

Every recording must identify:

- platform, device, OS version, app and screen
- display refresh rate and accessibility motion settings
- capture method and recording frame rate
- exact canonical gesture and scenario id
- contact, release, turnaround, commit, and settle frames when observable
- reviewer notes using `../VOCABULARY.md`

Do not substitute a web implementation or an invented timing curve for a native reference.
If a reference cannot be captured, mark it pending in the annotation instead of estimating.
