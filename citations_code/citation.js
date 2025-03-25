const Cite = require('citation-js');

fetch('references.bib')
    .then(response => response.text())
    .then(bibtex => {
        const cite = new Cite(bibtex);

        // Process citations
        document.querySelectorAll('.citation').forEach(span => {
            const key = span.getAttribute('data-cite');
            // Find the single reference object matching the key
            const ref = cite.data.find(entry => entry.id === key);
            if (!ref) {
                span.innerHTML = `<span style="color: red;">[Error: Reference not found]</span>`;
                return;
            };

            // Create a new Cite instance only for the found reference
            const singleCite = new Cite(ref);

            // Format the citation for this single reference
            const citation = singleCite.format('citation', {
                format: 'html',
                template: 'apa',
                lang: 'en-US'
            });

            span.innerHTML = `<a href="#ref-${key}">${citation}</a>`;
        });

        // Add bibliography with anchors
        const bibliography = cite.format('bibliography', {
            format: 'html',
            template: 'apa',
            lang: 'en-US'
        });

        const bibliographyDiv = document.getElementById('bibliography');
        if (bibliographyDiv) {
            bibliographyDiv.innerHTML = bibliography;
            // After setting the bibliography, add id attributes for manual linking.
            const entries = bibliographyDiv.querySelectorAll('.csl-entry');
            entries.forEach(entry => {
                // You need a reliable way to extract the citation key for each entry.
                // This will depend on your citation-js template.
                // For example, if the key is in a span with class 'citation-key', use:
                const key = entry.getAttribute('data-csl-entry-id');
                if (key) {
                    // const key = keyElement.textContent.trim();
                    entry.setAttribute('id', `ref-${key}`);
                }
            });

        } else {
            console.error('Bibliography div not found');
        }
    })
    .catch(error => console.error('Error:', error));