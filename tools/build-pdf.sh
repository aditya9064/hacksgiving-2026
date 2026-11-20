#!/usr/bin/env bash
# Builds docs/Relay-MKE-Playbook.pdf from the markdown docs, diagrams and screenshots.
# Requires: pandoc, Google Chrome (macOS). Run from repo root: ./tools/build-pdf.sh
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"
OUT_HTML="$ROOT/docs/assets/playbook.html"
OUT_PDF="$ROOT/docs/Relay-MKE-Playbook.pdf"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Order of documents in the PDF
DOCS=(
  docs/challenge/judging-criteria.md
  docs/challenge/comforce-mke-profile.md
  docs/brainstorm/recommended-concept.md
  docs/product/spec.md
  docs/product/build-schedule.md
  docs/brainstorm/ideas-longlist.md
  docs/brainstorm/evaluation-matrix.md
  docs/research/lessons-learned.md
  docs/research/01-cvi-programs.md
  docs/research/02-referral-platforms.md
  docs/research/03-crisis-response.md
  docs/research/04-disaster-mutual-aid.md
  docs/research/05-privacy-data-ownership.md
  docs/research/06-milwaukee-context.md
  docs/research/07-past-hacksgiving-winners.md
  docs/research/08-police-systems.md
)

TMP="$(mktemp -d)"
BODY="$TMP/body.html"
: > "$BODY"

section() { # $1 = markdown file
  echo '<section class="doc">' >> "$BODY"
  pandoc "$1" -f gfm-tex_math_dollars -t html5 >> "$BODY"
  echo '</section>' >> "$BODY"
}

cat > "$TMP/cover.html" <<EOF
<section class="cover">
  <div class="brand">HACKSGIVING 2026 · MSOE AI CLUB × COMFORCE MKE</div>
  <h1>Relay MKE</h1>
  <p class="tag">Every request. Every responder. Every outcome — verified.</p>
  <p class="sub">Research, brainstorm, product spec and build plan</p>
  <p class="meta">Prepared $(date '+%B %-d, %Y') · github.com/aditya9064/hacksgiving-2026</p>
</section>
<section class="doc">
  <h1>At a glance</h1>
  <p><strong>The challenge:</strong> How can technology help ComForce MKE and its partners turn fragmented information into coordinated action and measurable community impact?</p>
  <p><strong>Our answer:</strong> one near-free, privacy-first system that closes the loop on <em>people</em>, not incidents. Every one of ComForce's eight divisions runs the same five-stage loop; every platform we studied breaks at one of those stages.</p>
  <figure><img src="diagrams/relay-loop.svg"><figcaption>Figure 1. The Relay loop.</figcaption></figure>
  <figure><img src="diagrams/spine-five-surfaces.svg"><figcaption>Figure 2. One shared data spine; each hackathon track is a view on it.</figcaption></figure>
  <figure><img src="diagrams/architecture.svg"><figcaption>Figure 3. Architecture and privacy boundary.</figcaption></figure>
</section>
<section class="doc">
  <h1>Reference screenshots</h1>
  <figure><img class="shot" src="screenshots/hackathon-brief.png"><figcaption>The official Hacksgiving 2026 brief (msoe-maic.com).</figcaption></figure>
  <figure><img class="shot" src="screenshots/comforce-home.png"><figcaption>ComForce MKE homepage: forest green, black, serif headlines, red accent rules. Our UI matches this identity.</figcaption></figure>
  <figure><img class="shot" src="screenshots/comforce-programs.png"><figcaption>ComForce programs page: every program routes to one contact form today.</figcaption></figure>
</section>
EOF

for d in "${DOCS[@]}"; do section "$d"; done

cat > "$OUT_HTML" <<EOF
<!doctype html><html><head><meta charset="utf-8"><title>Relay MKE Playbook</title>
<style>
@page { size: Letter; margin: 18mm 16mm; }
html { font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif; color:#111; font-size: 11pt; line-height:1.45; }
body { margin:0; }
.cover { height: 240mm; display:flex; flex-direction:column; justify-content:center; padding: 0 10mm; page-break-after: always; border-left: 10px solid #0f5132; }
.cover .brand { letter-spacing: .18em; font-size: 10pt; color:#0f5132; font-weight:700; }
.cover h1 { font-family: Georgia, "Times New Roman", serif; font-size: 64pt; margin: 8mm 0 4mm; color:#0b0f0d; }
.cover .tag { font-size: 18pt; color:#0f5132; margin:0 0 10mm; }
.cover .sub { font-size: 13pt; color:#374151; }
.cover .meta { font-size: 10pt; color:#6b7280; margin-top: 20mm; }
section.doc { page-break-before: always; }
h1 { font-family: Georgia, serif; font-size: 24pt; color:#0b0f0d; border-bottom: 3px solid #dc2626; padding-bottom: 4px; margin-top: 0; }
h2 { font-size: 15pt; color:#0f5132; margin-top: 1.4em; }
h3 { font-size: 12.5pt; margin-top: 1.2em; }
table { border-collapse: collapse; width: 100%; font-size: 9.5pt; margin: 8px 0 14px; page-break-inside: auto; }
th, td { border: 1px solid #d1d5db; padding: 5px 7px; vertical-align: top; text-align:left; }
th { background:#ecfdf5; color:#0f5132; }
tr { page-break-inside: avoid; }
blockquote { border-left: 4px solid #0f5132; margin: 10px 0; padding: 4px 14px; color:#374151; background:#f9fafb; }
pre { background:#0b0f0d; color:#d1fae5; padding: 10px 12px; border-radius: 8px; font-size: 9pt; overflow:hidden; white-space: pre-wrap; }
code { font-size: 9.5pt; }
figure { margin: 14px 0; page-break-inside: avoid; }
figure img { width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; }
figure img.shot { max-height: 215mm; width:auto; max-width:100%; display:block; margin:0 auto; }
figcaption { font-size: 9pt; color:#6b7280; margin-top: 4px; text-align:center; }
a { color:#0f5132; text-decoration: none; word-break: break-all; }
</style></head><body>
$(cat "$TMP/cover.html")
$(cat "$BODY")
</body></html>
EOF

# Inline images as data URIs so headless Chrome can render them from file://
python3 - "$OUT_HTML" <<'PY'
import sys,re,base64,os,mimetypes
p=sys.argv[1]; root=os.path.dirname(p)
s=open(p).read()
def rep(m):
    src=m.group(1); f=os.path.join(root,src)
    if not os.path.exists(f): return m.group(0)
    mt=mimetypes.guess_type(f)[0] or 'application/octet-stream'
    return 'src="data:%s;base64,%s"'%(mt,base64.b64encode(open(f,'rb').read()).decode())
s=re.sub(r'src="((?:diagrams|screenshots)/[^"]+)"',rep,s)
open(p,'w').write(s)
PY
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="$OUT_PDF" "file://$OUT_HTML" 2>/dev/null
rm -rf "$TMP"
echo "Wrote $OUT_PDF ($(du -h "$OUT_PDF" | cut -f1))"
