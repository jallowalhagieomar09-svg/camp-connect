# Finish the CFG Certificate Generator

## What will be completed
- Restyle the generated A4 landscape certificate to closely match the uploaded sample: white centre, deep-green geometric border, gold accents, top logo row, large title, centered participant name, event wording, and two signature areas.
- Use the official CFG logo already in the project and reproduce the sample’s named signatories and roles.
- Add the missing post-camp thank-you section to the homepage with a prominent “Generate My Certificate” button.
- Preserve the existing participant eligibility search and permanent certificate ID system.
- Verify name lookup, repeat certificate issuance, PDF preview/download, homepage navigation, and mobile/desktop presentation.

## Technical details
- Keep PDF creation in jsPDF as a true vector/text PDF, not a webpage screenshot.
- Scale long names and wrap body copy to prevent clipping while retaining A4 landscape print proportions.
- Use the existing backend certificate records so repeated downloads keep the same `CFG-2026-00001`-style ID.
- Update route metadata where required and validate the rendered PDF visually before completion.
